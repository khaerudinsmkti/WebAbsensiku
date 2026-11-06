import { useState, useRef } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    BadgeCheck,
    BookOpen,
    CheckCircle2,
    ExternalLink,
    GraduationCap,
    Pencil,
    Plus,
    RefreshCw,
    School,
    Search,
    Sparkles,
    Trash2,
    UploadCloud,
    User,
    Users,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import type { TeacherProfileItem } from '@/pages/profile/public-teachers';

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface TeacherProfilesManageProps {
    teachers: {
        data: TeacherProfileItem[];
    } & PaginationMeta;
    statuses: string[];
    classrooms: string[];
    stats: {
        total: number;
        active: number;
        pns_pppk: number;
        homeroom_count: number;
    };
    filters: {
        search: string;
        status: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Profil Guru',
        href: '/manage/teacher-profiles',
    },
];

function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let b = bytes;
    while (b >= 1024 && i < units.length - 1) {
        b /= 1024;
        i++;
    }
    return `${b.toFixed(1)} ${units[i]}`;
}

function compressTeacherPhoto(
    file: File,
    maxWidth = 900,
    maxHeight = 900,
    quality = 0.75,
): Promise<{ base64: string; originalSize: number; compressedSize: number }> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const rawBase64 = event.target?.result as string;
            const img = new Image();
            img.src = rawBase64;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve({ base64: rawBase64, originalSize: file.size, compressedSize: file.size });
                    return;
                }

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                const base64Length = compressedDataUrl.split(',')[1]?.length || 0;
                const estimatedBytes = Math.round((base64Length * 3) / 4);

                resolve({
                    base64: compressedDataUrl,
                    originalSize: file.size,
                    compressedSize: estimatedBytes > 0 ? estimatedBytes : file.size,
                });
            };
            img.onerror = () => resolve({ base64: rawBase64, originalSize: file.size, compressedSize: file.size });
        };
        reader.onerror = () => resolve({ base64: '', originalSize: file.size, compressedSize: 0 });
    });
}

export default function TeacherProfilesManagement({
    teachers,
    statuses,
    classrooms,
    stats,
    filters,
}: TeacherProfilesManageProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<TeacherProfileItem | null>(null);
    const [deletingTeacher, setDeletingTeacher] = useState<TeacherProfileItem | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const photoInputRef = useRef<HTMLInputElement>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [compressionInfo, setCompressionInfo] = useState<{ original: number; compressed: number } | null>(null);

    const form = useForm<{
        name: string;
        subject: string;
        homeroom_class: string;
        employment_status: string;
        sort_order: number;
        is_active: boolean;
        photo_base64: string;
        remove_photo: boolean;
    }>({
        name: '',
        subject: 'Guru Kelas',
        homeroom_class: '',
        employment_status: 'PNS',
        sort_order: 1,
        is_active: true,
        photo_base64: '',
        remove_photo: false,
    });

    const handleApplyFilters = () => {
        router.get(
            '/manage/teacher-profiles',
            {
                search: search || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedStatus('all');
        router.get('/manage/teacher-profiles', {}, { preserveState: true, preserveScroll: true });
    };

    const handleSyncFromMaster = () => {
        setIsSyncing(true);
        router.post(
            '/manage/teacher-profiles/sync',
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsSyncing(false),
            },
        );
    };

    const openCreateModal = () => {
        setEditingTeacher(null);
        setPhotoPreview(null);
        setCompressionInfo(null);
        form.setData({
            name: '',
            subject: 'Guru Kelas',
            homeroom_class: '',
            employment_status: 'PNS',
            sort_order: stats.total + 1,
            is_active: true,
            photo_base64: '',
            remove_photo: false,
        });
        setIsFormModalOpen(true);
    };

    const openEditModal = (teacher: TeacherProfileItem) => {
        setEditingTeacher(teacher);
        setPhotoPreview(teacher.photo_url || null);
        setCompressionInfo(null);
        form.setData({
            name: teacher.name,
            subject: teacher.subject || 'Guru Kelas',
            homeroom_class: teacher.homeroom_class || '',
            employment_status: teacher.employment_status || 'PNS',
            sort_order: teacher.sort_order || 1,
            is_active: teacher.is_active,
            photo_base64: '',
            remove_photo: false,
        });
        setIsFormModalOpen(true);
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCompressing(true);
        try {
            const res = await compressTeacherPhoto(file);
            if (res.base64) {
                setPhotoPreview(res.base64);
                setCompressionInfo({ original: res.originalSize, compressed: res.compressedSize });
                form.setData((prev) => ({
                    ...prev,
                    photo_base64: res.base64,
                    remove_photo: false,
                }));
            }
        } finally {
            setIsCompressing(false);
            if (photoInputRef.current) {
                photoInputRef.current.value = '';
            }
        }
    };

    const handleRemovePhoto = () => {
        setPhotoPreview(null);
        setCompressionInfo(null);
        form.setData((prev) => ({
            ...prev,
            photo_base64: '',
            remove_photo: true,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingTeacher) {
            router.post(`/manage/teacher-profiles/${editingTeacher.id}`, form.data, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setEditingTeacher(null);
                },
            });
        } else {
            router.post('/manage/teacher-profiles', form.data, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormModalOpen(false);
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (!deletingTeacher) return;
        router.delete(`/manage/teacher-profiles/${deletingTeacher.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingTeacher(null),
        });
    };

    return (
        <>
            <Head title="Kelola Profil Guru" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8">
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200">
                        <CheckCircle2 className="size-5 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200">
                        <AlertCircle className="size-5 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Top Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950/60 dark:text-[#FFA07A]">
                            <GraduationCap className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#111827] dark:text-white">
                                Kelola Profil & Biodata Guru
                            </h1>
                            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                Kelola foto dan biodata guru (Nama Lengkap, Guru Pelajaran, Wali Kelas, Status PNS/PPPK/KKI) untuk halaman publik.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold">
                            <Link href="/profil/guru" target="_blank">
                                <ExternalLink className="mr-1.5 size-3.5" />
                                Lihat di Publik
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSyncing}
                            onClick={handleSyncFromMaster}
                            className="rounded-xl border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
                        >
                            <RefreshCw className={`mr-1.5 size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sinkronkan dari Master Guru
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={openCreateModal}
                            className="rounded-xl px-4 text-xs font-bold shadow-sm"
                        >
                            <Plus className="mr-1.5 size-4" />
                            Tambah Profil Guru
                        </Button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Profil Guru</span>
                        <div className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{stats.total}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Ditampilkan di Publik</span>
                        <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">ASN (PNS & PPPK)</span>
                        <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">{stats.pns_pppk}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Wali Kelas</span>
                        <div className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">{stats.homeroom_count}</div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center dark:border-gray-800 dark:bg-[#18122B]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                            placeholder="Cari nama guru, mata pelajaran, wali kelas, atau status..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2 pl-9 pr-4 text-xs font-medium focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="all">Semua Status</option>
                            {statuses.map((st) => (
                                <option key={st} value={st}>
                                    {st}
                                </option>
                            ))}
                        </select>

                        <Button type="button" variant="secondary" onClick={handleApplyFilters} className="rounded-xl text-xs font-bold">
                            Terapkan
                        </Button>

                        {(search || selectedStatus !== 'all') && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="rounded-xl px-2.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Teachers Grid */}
                {teachers.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white p-14 text-center dark:border-gray-800 dark:bg-[#18122B]">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35] dark:bg-orange-950/40">
                            <Users className="size-8" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                            Belum Ada Data Profil Guru
                        </h3>
                        <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
                            Tambahkan profil guru secara manual atau klik tombol Sinkronkan dari Master Guru.
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSyncFromMaster}
                                className="rounded-xl text-xs font-bold"
                            >
                                <RefreshCw className="mr-1.5 size-4" />
                                Sinkronkan dari Master Guru
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={openCreateModal}
                                className="rounded-xl text-xs font-bold"
                            >
                                <Plus className="mr-1.5 size-4" />
                                Tambah Profil Guru
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {teachers.data.map((teacher) => (
                            <div
                                key={teacher.id}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition-all hover:border-[#FF6B35]/50 hover:shadow-md dark:border-gray-800 dark:bg-[#18122B]"
                            >
                                <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-orange-100/70 via-amber-50/50 to-teal-50/40 dark:from-gray-900 dark:to-gray-800">
                                    {teacher.photo_url ? (
                                        <img
                                            src={teacher.photo_url}
                                            alt={teacher.name}
                                            className="h-full w-full object-cover object-top"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center p-4">
                                            <div className="flex size-18 items-center justify-center rounded-full border-2 border-white bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-md">
                                                <User className="size-9" />
                                            </div>
                                            <span className="mt-2 text-[10px] font-bold text-gray-400">Belum ada foto</span>
                                        </div>
                                    )}

                                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                        <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-extrabold text-[#FF6B35] shadow-xs dark:bg-gray-900/90 dark:text-[#FFA07A]">
                                            {teacher.employment_status}
                                        </span>
                                        {!teacher.is_active && (
                                            <span className="rounded-full bg-amber-500/95 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                                Disembunyikan
                                            </span>
                                        )}
                                    </div>

                                    {teacher.file_size ? (
                                        <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white">
                                            {teacher.formatted_size}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex flex-1 flex-col p-4 space-y-2.5">
                                    <div>
                                        <h3 className="line-clamp-1 text-sm font-extrabold text-gray-900 dark:text-white">
                                            {teacher.name}
                                        </h3>
                                    </div>

                                    <div className="space-y-1.5 border-t border-gray-100 pt-2.5 text-xs dark:border-gray-800">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-1 text-gray-400">
                                                <BookOpen className="size-3 text-[#FF6B35]" />
                                                Pelajaran:
                                            </span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200 truncate">
                                                {teacher.subject || 'Guru Kelas'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-1 text-gray-400">
                                                <School className="size-3 text-blue-600" />
                                                Wali Kelas:
                                            </span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200 truncate">
                                                {teacher.homeroom_class || '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-1 text-gray-400">
                                                <BadgeCheck className="size-3 text-emerald-600" />
                                                Status:
                                            </span>
                                            <span className="font-extrabold text-[#FF6B35]">
                                                {teacher.employment_status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                                        <span className="text-[10px] font-semibold text-gray-400">
                                            Urutan #{teacher.sort_order}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(teacher)}
                                                className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400"
                                                title="Edit Profil Guru"
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeletingTeacher(teacher)}
                                                className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:bg-red-50 dark:border-gray-700 dark:text-red-400"
                                                title="Hapus Profil Guru"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {teachers.last_page > 1 && (
                    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs text-gray-500">
                            Halaman {teachers.current_page} dari {teachers.last_page} (Total {teachers.total} guru)
                        </span>
                        <div className="flex items-center gap-1">
                            {teachers.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    disabled={!link.url || link.active}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                        link.active
                                            ? 'bg-[#FF6B35] text-white'
                                            : link.url
                                            ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                                            : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL: Tambah / Edit Profil Guru */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-[#18122B]">
                        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                    <GraduationCap className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                                        {editingTeacher ? 'Edit Biodata & Foto Guru' : 'Tambah Profil Guru Baru'}
                                    </h3>
                                    <p className="text-[11px] text-gray-500">
                                        Foto otomatis dikompresi agar hemat ruang penyimpanan server.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormModalOpen(false)}
                                className="flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Photo Upload with Automatic Compression */}
                            <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 p-4 dark:border-orange-900/50 dark:bg-orange-950/20">
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-gray-100 shadow-md dark:border-gray-700 dark:bg-gray-800">
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="Preview Guru" className="size-full object-cover object-top" />
                                        ) : (
                                            <div className="flex size-full items-center justify-center text-gray-400">
                                                <User className="size-10" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-2 text-center sm:text-left">
                                        <span className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                                            <Sparkles className="size-3.5 text-[#FF6B35]" />
                                            Foto Profil Guru (Auto-Compress)
                                        </span>
                                        <p className="text-[11px] text-gray-500">
                                            Format JPG, PNG, atau WebP. Foto otomatis diperkecil agar ringan dan hemat kapasitas hardisk.
                                        </p>

                                        {compressionInfo && (
                                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                <span>
                                                    Ter-kompresi: {formatBytes(compressionInfo.original)} → {formatBytes(compressionInfo.compressed)}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                            <input
                                                ref={photoInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/jpg"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={isCompressing}
                                                onClick={() => photoInputRef.current?.click()}
                                                className="rounded-xl border-[#FF6B35] text-xs font-bold text-[#FF6B35] hover:bg-orange-50"
                                            >
                                                <UploadCloud className="mr-1.5 size-3.5" />
                                                {isCompressing ? 'Mengompresi...' : photoPreview ? 'Ganti Foto' : 'Pilih Foto Guru'}
                                            </Button>

                                            {photoPreview && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleRemovePhoto}
                                                    className="rounded-xl text-xs font-bold text-red-600 hover:bg-red-50"
                                                >
                                                    Hapus Foto
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Nama Lengkap */}
                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-1">
                                    Nama Lengkap & Gelar <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="Contoh: Siti Aminah, S.Pd.SD."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                                {form.errors.name && <p className="mt-1 text-xs text-red-500">{form.errors.name}</p>}
                            </div>

                            {/* Guru Pelajaran & Wali Kelas */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-1">
                                        Guru Pelajaran / Jabatan <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        list="teacher-subjects-list"
                                        required
                                        value={form.data.subject}
                                        onChange={(e) => form.setData('subject', e.target.value)}
                                        placeholder="Contoh: Guru Kelas / Guru PJOK"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <datalist id="teacher-subjects-list">
                                        <option value="Kepala Sekolah" />
                                        <option value="Guru Kelas" />
                                        <option value="Guru Pendidikan Agama Islam (PAI)" />
                                        <option value="Guru PJOK (Olahraga)" />
                                        <option value="Guru Bahasa Inggris" />
                                        <option value="Guru Seni & Budaya" />
                                        <option value="Tenaga Administrasi Sekolah" />
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-1">
                                        Wali Kelas
                                    </label>
                                    <input
                                        type="text"
                                        list="teacher-classrooms-list"
                                        value={form.data.homeroom_class}
                                        onChange={(e) => form.setData('homeroom_class', e.target.value)}
                                        placeholder="Kosongkan jika bukan wali kelas"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <datalist id="teacher-classrooms-list">
                                        <option value="-" />
                                        {classrooms.map((cls) => (
                                            <option key={cls} value={cls} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            {/* Status (PNS, PPPK, KKI, dll) & Urutan */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-1">
                                        Status Kepegawaian (PNS, PPPK, KKI, dll) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        list="teacher-statuses-list"
                                        required
                                        value={form.data.employment_status}
                                        onChange={(e) => form.setData('employment_status', e.target.value)}
                                        placeholder="Pilih atau ketik status (PNS, PPPK, KKI...)"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <datalist id="teacher-statuses-list">
                                        {statuses.map((st) => (
                                            <option key={st} value={st} />
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-1">
                                        Nomor Urut Tampil
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.data.sort_order}
                                        onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 pt-1">
                                <input
                                    type="checkbox"
                                    id="teacher-is-active"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                    className="size-4 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                                />
                                <label htmlFor="teacher-is-active" className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                    Tampilkan di halaman Profil Guru Publik
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 pt-4 dark:border-gray-800">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={form.processing || isCompressing}
                                    className="rounded-xl px-5 text-xs font-bold shadow-sm"
                                >
                                    {isCompressing
                                        ? 'Mengompresi Foto...'
                                        : form.processing
                                        ? 'Menyimpan...'
                                        : editingTeacher
                                        ? 'Simpan Perubahan'
                                        : 'Simpan Profil Guru'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Konfirmasi Hapus */}
            {deletingTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#18122B]">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                            <Trash2 className="size-6" />
                        </div>
                        <h3 className="mt-4 text-base font-black text-gray-900 dark:text-white">
                            Hapus Profil Guru Ini?
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            Profil <strong className="text-gray-800 dark:text-gray-200">"{deletingTeacher.name}"</strong> beserta foto profilnya akan dihapus dari halaman Profil Guru publik.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setDeletingTeacher(null)}
                                className="rounded-xl text-xs font-bold"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteConfirm}
                                className="rounded-xl text-xs font-bold"
                            >
                                Ya, Hapus Profil
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

TeacherProfilesManagement.layout = {
    breadcrumbs,
};

