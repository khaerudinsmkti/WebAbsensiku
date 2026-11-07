import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    BookOpen,
    Building2,
    GraduationCap,
    School,
    Search,
    User,
    Users,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/public-header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';

export interface TeacherProfileItem {
    id: number;
    user_id?: number | null;
    name: string;
    subject?: string | null;
    homeroom_class?: string | null;
    employment_status: string;
    photo_path?: string | null;
    photo_url?: string | null;
    file_size?: number;
    formatted_size?: string;
    sort_order: number;
    is_active: boolean;
}

interface SchoolProp {
    name?: string;
    logo_url?: string | null;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface PublicTeachersProps {
    teachers: {
        data: TeacherProfileItem[];
    } & PaginationMeta;
    statuses: string[];
    filters: {
        search: string;
        status: string;
    };
}

function getStatusBadgeClass(status: string): string {
    const normalized = (status || '').toUpperCase().trim();
    if (normalized === 'PNS') {
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
    }
    if (normalized === 'PPPK' || normalized === 'P3K') {
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800';
    }
    if (normalized === 'KKI') {
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800';
    }
    return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800';
}

export default function PublicTeachersIndex({ teachers, statuses = [], filters }: PublicTeachersProps) {
    const { school } = usePage<{ school?: SchoolProp }>().props;
    const schoolName = school?.name || 'AbsensiKu SD';

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfileItem | null>(null);

    const handleStatusClick = (st: string) => {
        setSelectedStatus(st);
        router.get(
            '/profil/guru',
            {
                search: search || undefined,
                status: st !== 'all' ? st : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/profil/guru',
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
        router.get('/profil/guru', {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <>
            <Head title="Profil Guru & Tenaga Pendidik" />

            <div className="flex min-h-screen flex-col bg-page-gradient text-[#1F2937] dark:text-neutral-100">
                <PublicHeader />

                <main className="flex-1 px-4 py-8 pb-24 sm:px-6 md:pb-12 lg:px-12">
                    <div className="mx-auto max-w-6xl space-y-8">
                        {/* Sub Menu Navigation Switcher: Profil Sekolah & Profil Guru */}
                        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200/80 bg-white/90 p-2 shadow-2xs backdrop-blur-md dark:border-gray-800 dark:bg-[#18122B]/90 w-fit">
                            <Link
                                href="/profil"
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-[#FF6B35] transition-all dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                <Building2 className="size-4" />
                                <span>Profil Sekolah</span>
                            </Link>
                            <Link
                                href="/profil/guru"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2 text-xs font-extrabold text-white shadow-xs shadow-[#FF6B35]/25 transition-all"
                            >
                                <GraduationCap className="size-4" />
                                <span>Profil Guru</span>
                            </Link>
                        </div>

                        {/* Header Banner */}
                        <div className="flex flex-col gap-4 border-b border-gray-200 pb-8 sm:flex-row sm:items-end sm:justify-between dark:border-gray-800">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-bold text-[#FF6B35] dark:border-orange-900 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                    <GraduationCap className="size-3.5" />
                                    Pendidik & Tenaga Kependidikan
                                </div>
                                <h1 className="mt-3 text-3xl font-black leading-tight text-[#111827] sm:text-4xl dark:text-white">
                                    Profil Guru {schoolName}
                                </h1>
                                <p className="mt-1.5 max-w-2xl text-xs text-[#6B7280] sm:text-sm dark:text-[#9CA3AF]">
                                    Galeri foto dan biodata lengkap dewan guru, jabatan / tugas, serta wali kelas yang berdedikasi mendidik siswa-siswi kami.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                    Total {teachers.total} Guru & Pendidik
                                </span>
                            </div>
                        </div>

                        {/* Filter & Search Bar */}
                        <div className="flex flex-col gap-4 rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between dark:border-gray-800 dark:bg-[#18122B]">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleStatusClick('all')}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                        selectedStatus === 'all'
                                            ? 'bg-[#FF6B35] text-white shadow-xs shadow-[#FF6B35]/30'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                    }`}
                                >
                                    Semua Status
                                </button>
                                {statuses.map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => handleStatusClick(st)}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                            selectedStatus === st
                                                ? 'bg-[#FF6B35] text-white shadow-xs shadow-[#FF6B35]/30'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari nama guru, mapel, kelas..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2 pl-9 pr-8 text-xs font-semibold focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                router.get('/profil/guru', {
                                                    status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                                });
                                            }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                                <Button type="submit" variant="secondary" size="sm" className="rounded-xl text-xs font-bold">
                                    Cari
                                </Button>
                                {(search || selectedStatus !== 'all') && (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        Reset
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* Teachers Photo & Biodata Grid */}
                        {teachers.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 p-16 text-center backdrop-blur-md dark:border-gray-800 dark:bg-[#18122B]/60">
                                <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35] dark:bg-orange-950/40">
                                    <Users className="size-8" />
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                                    Belum Ada Data Profil Guru
                                </h3>
                                <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
                                    Data biodata dan foto guru akan ditampilkan di halaman ini.
                                </p>
                                {(search || selectedStatus !== 'all') && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="mt-4 rounded-xl text-xs font-bold"
                                    >
                                        Tampilkan Semua Guru
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                                {teachers.data.map((teacher) => (
                                    <div
                                        key={teacher.id}
                                        onClick={() => setSelectedTeacher(teacher)}
                                        className="group cursor-pointer flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-primary,#FF6B35)] hover:shadow-md dark:border-gray-800 dark:bg-[#18122B]"
                                    >
                                        {/* Teacher Photo Header */}
                                        <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-gradient-to-br from-orange-100/80 via-amber-50/60 to-teal-50/50 dark:from-gray-900 dark:via-purple-950/30 dark:to-gray-800">
                                            {teacher.photo_url ? (
                                                <img
                                                    src={teacher.photo_url}
                                                    alt={teacher.name}
                                                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full flex-col items-center justify-center p-3 sm:p-5 text-center">
                                                    <div className="flex size-14 sm:size-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg dark:border-gray-800">
                                                        <User className="size-7 sm:size-10" />
                                                    </div>
                                                    <span className="mt-2 text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                                        Tenaga Pendidik
                                                    </span>
                                                </div>
                                            )}

                                            {/* Status Kepegawaian Badge (PNS, PPPK, KKI, dll) */}
                                            <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 sm:px-2.5 text-[9px] sm:text-[10px] font-extrabold shadow-sm backdrop-blur-md ${getStatusBadgeClass(
                                                        teacher.employment_status,
                                                    )}`}
                                                >
                                                    <BadgeCheck className="size-2.5 sm:size-3" />
                                                    <span>{teacher.employment_status}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Biodata Body */}
                                        <div className="flex flex-1 flex-col p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                                            <div>
                                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary,#FF6B35)]">
                                                    Nama Lengkap
                                                </span>
                                                <h3 className="mt-0.5 text-xs sm:text-base font-black text-gray-900 group-hover:text-[var(--brand-primary,#FF6B35)] transition-colors leading-snug line-clamp-2 dark:text-white">
                                                    {teacher.name}
                                                </h3>
                                            </div>

                                            <div className="grid grid-cols-1 gap-1.5 sm:gap-2 border-t border-gray-100 pt-2.5 sm:pt-3 text-xs dark:border-gray-800">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-2">
                                                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 shrink-0 text-[10px] sm:text-[11px]">
                                                        <BookOpen className="size-3 text-[#FF6B35]" />
                                                        Jabatan
                                                    </span>
                                                    <span className="font-bold text-gray-900 sm:text-right text-[10px] sm:text-[11px] dark:text-white">
                                                        {teacher.subject || 'Guru Kelas'}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-2">
                                                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 shrink-0 text-[10px] sm:text-[11px]">
                                                        <School className="size-3 text-blue-600 dark:text-blue-400" />
                                                        Wali Kelas
                                                    </span>
                                                    <span className="font-bold text-gray-900 sm:text-right text-[10px] sm:text-[11px] dark:text-white">
                                                        {teacher.homeroom_class || '-'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 shrink-0 text-[10px] sm:text-[11px]">
                                                        <BadgeCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                                                        Status
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center rounded-lg border px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[10px] font-extrabold ${getStatusBadgeClass(
                                                            teacher.employment_status,
                                                        )}`}
                                                    >
                                                        {teacher.employment_status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination (Default 12 item per halaman - 4 Kolom x 3 Baris) */}
                        {teachers.data.length > 0 && (
                            <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:flex-row dark:border-gray-800 dark:bg-[#18122B]">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    Menampilkan {teachers.from ?? 1} - {teachers.to ?? teachers.data.length} dari total {teachers.total} profil guru (12 per halaman)
                                </span>

                                <div className="flex flex-wrap items-center gap-1.5">
                                    {teachers.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            disabled={!link.url || link.active}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                                link.active
                                                    ? 'bg-[#FF6B35] text-white shadow-xs'
                                                    : link.url
                                                    ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                                                    : 'cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-400 opacity-60 dark:border-gray-800 dark:bg-gray-900'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* Footer (Hidden on Mobile) */}
                <footer className="hidden md:block border-t border-[#E8E8E8] bg-white/70 py-6 text-center text-xs text-[#6B7280] backdrop-blur-md dark:border-[#2D234A] dark:bg-[#18122B]/70 dark:text-[#9CA3AF]">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                        <div>
                            &copy; {new Date().getFullYear()} {schoolName}. All rights reserved.
                        </div>
                    </div>
                </footer>

                <PwaInstallPrompt />

                {/* Modal Detail Profil Guru */}
                {selectedTeacher && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-[#18122B]">
                            <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#FF6B35]">
                                    <GraduationCap className="size-4" />
                                    Biodata Pendidik
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTeacher(null)}
                                    className="flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <div className="relative mx-auto aspect-4/3 max-h-72 w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                                    {selectedTeacher.photo_url ? (
                                        <img
                                            src={selectedTeacher.photo_url}
                                            alt={selectedTeacher.name}
                                            className="h-full w-full object-contain"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center p-8">
                                            <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-md">
                                                <User className="size-12" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center">
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusBadgeClass(
                                            selectedTeacher.employment_status,
                                        )}`}
                                    >
                                        <BadgeCheck className="size-3.5" />
                                        Status: {selectedTeacher.employment_status}
                                    </span>
                                    <h2 className="mt-2.5 text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                        {selectedTeacher.name}
                                    </h2>
                                </div>

                                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-gray-50/60 p-4 text-xs dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
                                    <div className="flex items-center justify-between py-2.5 first:pt-0">
                                        <span className="font-semibold text-gray-500 dark:text-gray-400">Nama Lengkap</span>
                                        <span className="font-extrabold text-gray-900 dark:text-white">{selectedTeacher.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="font-semibold text-gray-500 dark:text-gray-400">Jabatan</span>
                                        <span className="font-extrabold text-gray-900 dark:text-white">
                                            {selectedTeacher.subject || 'Guru Kelas'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="font-semibold text-gray-500 dark:text-gray-400">Wali Kelas</span>
                                        <span className="font-extrabold text-gray-900 dark:text-white">
                                            {selectedTeacher.homeroom_class || '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2.5 last:pb-0">
                                        <span className="font-semibold text-gray-500 dark:text-gray-400">Status Kepegawaian</span>
                                        <span className="font-extrabold text-[#FF6B35]">{selectedTeacher.employment_status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

