import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Eye,
    ExternalLink,
    Filter,
    HelpCircle,
    Info,
    Layers,
    Pencil,
    Play,
    Plus,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Trash2,
    Video,
    X,
    Youtube,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageBanner } from '@/components/page-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RoleItem {
    key: string;
    name: string;
    badge: string;
    description?: string;
    color: string;
}

interface TutorialItem {
    id: number;
    title: string;
    youtube_url: string;
    youtube_id: string;
    description: string | null;
    target_roles: string[];
    order: number;
    is_active: boolean;
    thumbnail_url: string;
    embed_url: string;
    target_role_labels: RoleItem[];
    created_at: string;
    created_by?: {
        id: number;
        name: string;
    } | null;
}

interface PaginatedTutorials {
    data: TutorialItem[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number | null;
    to: number | null;
}

interface Stats {
    total: number;
    active: number;
    inactive: number;
    role_counts: Record<string, number>;
}

interface Props {
    tutorials: PaginatedTutorials;
    stats: Stats;
    availableRoles: Record<string, RoleItem>;
    filters: {
        search?: string;
        role?: string;
        status?: string;
    };
}

// Client-side YouTube ID extractor for instant live preview in form
function extractYoutubeId(url: string): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    const pattern =
        /(?:youtube(?:-nocookie)?\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
    const matches = trimmed.match(pattern);
    if (matches && matches[1]) {
        return matches[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }
    return null;
}

export default function AdminTutorialsIndex({
    tutorials,
    stats,
    availableRoles,
    filters,
}: Props) {
    const roleEntries = useMemo(() => Object.entries(availableRoles), [availableRoles]);

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTutorial, setEditingTutorial] = useState<TutorialItem | null>(null);
    const [deletingTutorial, setDeletingTutorial] = useState<TutorialItem | null>(null);
    const [previewVideo, setPreviewVideo] = useState<TutorialItem | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    // Form for Add / Edit
    const form = useForm({
        title: '',
        youtube_url: '',
        target_roles: [] as string[],
        description: '',
        order: 0,
        is_active: true,
    });

    // YouTube preview state in modal
    const liveYoutubeId = useMemo(() => {
        return extractYoutubeId(form.data.youtube_url);
    }, [form.data.youtube_url]);

    // Handle filter submit
    const applyFilters = (newRole?: string, newStatus?: string, newSearch?: string) => {
        router.get(
            '/admin/tutorials',
            {
                search: newSearch !== undefined ? newSearch : searchQuery,
                role: newRole !== undefined ? newRole : selectedRole,
                status: newStatus !== undefined ? newStatus : selectedStatus,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(selectedRole, selectedStatus, searchQuery);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedRole('');
        setSelectedStatus('');
        router.get('/admin/tutorials', {}, { preserveState: true, replace: true });
    };

    // Open create modal
    const handleOpenCreate = () => {
        form.reset();
        form.setData({
            title: '',
            youtube_url: '',
            target_roles: ['teacher', 'principal'], // Default to teacher and principal
            description: '',
            order: 0,
            is_active: true,
        });
        form.clearErrors();
        setEditingTutorial(null);
        setIsCreateOpen(true);
    };

    // Open edit modal
    const handleOpenEdit = (item: TutorialItem) => {
        form.clearErrors();
        form.setData({
            title: item.title,
            youtube_url: item.youtube_url,
            target_roles: [...item.target_roles],
            description: item.description || '',
            order: item.order,
            is_active: item.is_active,
        });
        setEditingTutorial(item);
        setIsCreateOpen(true);
    };

    // Toggle target role checkbox
    const handleToggleRole = (roleKey: string) => {
        const current = form.data.target_roles;
        if (current.includes(roleKey)) {
            form.setData('target_roles', current.filter((r) => r !== roleKey));
        } else {
            form.setData('target_roles', [...current, roleKey]);
        }
    };

    const handleSelectAllRoles = () => {
        const allKeys = Object.keys(availableRoles);
        if (form.data.target_roles.length === allKeys.length) {
            form.setData('target_roles', []);
        } else {
            form.setData('target_roles', allKeys);
        }
    };

    // Form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingTutorial) {
            form.put(`/admin/tutorials/${editingTutorial.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setEditingTutorial(null);
                    form.reset();
                    toast.success('Video tutorial berhasil diperbarui.');
                },
                onError: (err) => {
                    const firstMsg = Object.values(err)[0];
                    toast.error(typeof firstMsg === 'string' ? firstMsg : 'Mohon periksa isian formulir.');
                },
            });
        } else {
            form.post('/admin/tutorials', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateOpen(false);
                    form.reset();
                    toast.success('Video tutorial baru berhasil ditambahkan.');
                },
                onError: (err) => {
                    const firstMsg = Object.values(err)[0];
                    toast.error(typeof firstMsg === 'string' ? firstMsg : 'Mohon periksa isian formulir.');
                },
            });
        }
    };

    // Toggle active status
    const handleToggleActive = (tutorial: TutorialItem) => {
        router.patch(
            `/admin/tutorials/${tutorial.id}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        tutorial.is_active
                            ? 'Video tutorial dinonaktifkan.'
                            : 'Video tutorial diaktifkan kembali.'
                    );
                },
            }
        );
    };

    // Delete confirmation
    const handleDeleteConfirm = () => {
        if (!deletingTutorial) return;

        router.delete(`/admin/tutorials/${deletingTutorial.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingTutorial(null);
                toast.success('Video tutorial berhasil dihapus.');
            },
            onError: () => {
                toast.error('Gagal menghapus video tutorial.');
            },
        });
    };

    const getRoleBadgeClasses = (color: string) => {
        switch (color) {
            case 'emerald':
                return 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400';
            case 'blue':
                return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
            case 'amber':
                return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 dark:bg-amber-500/20 dark:text-amber-400';
            case 'purple':
                return 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800 dark:bg-purple-500/20 dark:text-purple-400';
            case 'red':
                return 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800 dark:bg-red-500/20 dark:text-red-400';
            default:
                return 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800 dark:bg-slate-500/20 dark:text-slate-400';
        }
    };

    return (
        <>
            <Head title="Kelola Video Tutorial - Administrator" />

            <div className="w-full min-w-0 max-w-7xl mx-auto space-y-5 px-3 sm:px-6 lg:px-8 py-5">
                {/* 1. Header Banner */}
                <PageBanner
                    badgeText="Pusat Panduan Video"
                    title="Kelola Video Tutorial"
                    description="Tambahkan dan atur materi video panduan operasional YouTube yang ditargetkan spesifik untuk masing-masing peran (Guru, Kepsek, Publisher, Pelatih Ekskul, dll)."
                    icon={<Youtube className="size-6 text-white" />}
                    action={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                asChild
                                variant="outline"
                                className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md text-xs font-semibold h-9"
                            >
                                <Link href="/tutorials">
                                    <Eye className="size-3.5 mr-1.5" />
                                    Lihat Portal Tutorial
                                </Link>
                            </Button>

                            <Button
                                type="button"
                                onClick={handleOpenCreate}
                                className="bg-white text-gray-900 hover:bg-white/90 shadow-md font-bold text-xs sm:text-sm h-9"
                            >
                                <Plus className="size-4 mr-1.5 text-red-600" />
                                Tambah Video Tutorial
                            </Button>
                        </div>
                    }
                />

                {/* 2. Quick Statistics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Total Video
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                                <Video className="size-3.5" />
                            </div>
                        </div>
                        <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                            {stats.total}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">Materi panduan YouTube</p>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Tayang Aktif
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                            </div>
                        </div>
                        <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {stats.active}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">Dapat ditonton pengguna</p>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Video Guru
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <Layers className="size-3.5" />
                            </div>
                        </div>
                        <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                            {stats.role_counts.teacher ?? 0}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">Khusus role Pendidik</p>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Video Kepsek
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                <Layers className="size-3.5" />
                            </div>
                        </div>
                        <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                            {stats.role_counts.principal ?? 0}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">Khusus role Kepala Sekolah</p>
                    </div>
                </div>

                {/* 3. Filters & Search Bar */}
                <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 sm:p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Cari judul video atau keterangan tutorial..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 text-xs h-9"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        applyFilters(selectedRole, selectedStatus, '');
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button type="submit" size="sm" className="h-9 px-3.5 text-xs font-semibold">
                                <Search className="size-3.5 mr-1.5" />
                                Cari
                            </Button>
                            {(searchQuery || selectedRole || selectedStatus) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="h-9 px-2.5 text-xs text-gray-600 dark:text-gray-300"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </form>

                    {/* Role Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                        <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1">
                            <Filter className="size-3.5" /> Peran Target:
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedRole('');
                                applyFilters('', selectedStatus, searchQuery);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                !selectedRole
                                    ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            Semua Peran ({stats.total})
                        </button>

                        {roleEntries.map(([rKey, rItem]) => {
                            const count = stats.role_counts[rKey] ?? 0;
                            const isSelected = selectedRole === rKey;
                            return (
                                <button
                                    key={rKey}
                                    type="button"
                                    onClick={() => {
                                        const nextRole = isSelected ? '' : rKey;
                                        setSelectedRole(nextRole);
                                        applyFilters(nextRole, selectedStatus, searchQuery);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <span>{rItem.name}</span>
                                    <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Video Tutorials Grid */}
                {tutorials.data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-800 bg-white/60 dark:bg-gray-900/40">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-3 shadow-xs">
                            <Youtube className="size-7" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            Belum Ada Video Tutorial
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {searchQuery || selectedRole
                                ? 'Tidak ada video tutorial yang cocok dengan kriteria filter pencarian Anda.'
                                : 'Mulai tambahkan link video YouTube panduan operasional agar pengguna dapat mempelajarinya langsung dari aplikasi.'}
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                            {(searchQuery || selectedRole) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="text-xs font-semibold"
                                >
                                    Hapus Filter
                                </Button>
                            )}
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleOpenCreate}
                                className="bg-[var(--brand-primary,#FF6B35)] hover:bg-[var(--brand-primary-dark,#E0531F)] text-white text-xs font-bold"
                            >
                                <Plus className="size-3.5 mr-1.5" />
                                Tambah Video Pertama
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tutorials.data.map((item) => (
                            <div
                                key={item.id}
                                className={`group flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-xs transition-all hover:shadow-md dark:bg-gray-900 ${
                                    item.is_active
                                        ? 'border-gray-200/90 dark:border-gray-800'
                                        : 'border-amber-300/60 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/10 opacity-75'
                                }`}
                            >
                                <div>
                                    {/* Video Thumbnail Card with YouTube Badge */}
                                    <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                                        <img
                                            src={item.thumbnail_url}
                                            alt={item.title}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        {/* Play Overlay */}
                                        <button
                                            type="button"
                                            onClick={() => setPreviewVideo(item)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/35 hover:bg-black/50 transition-colors"
                                            title="Tonton Preview Video"
                                        >
                                            <div className="flex size-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 group-hover:scale-110 transition-transform">
                                                <Play className="size-5 fill-white ml-0.5" />
                                            </div>
                                        </button>

                                        {/* Top Tags */}
                                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                            <Badge className="bg-red-600 text-white font-bold text-[10px] px-1.5 py-0 shadow-xs border-0 flex items-center gap-1">
                                                <Youtube className="size-3" /> YouTube
                                            </Badge>
                                            {item.order > 0 && (
                                                <Badge variant="outline" className="bg-black/60 text-white text-[10px] font-mono border-white/20">
                                                    #{item.order}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="absolute top-2 right-2">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(item)}
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-md transition-all ${
                                                    item.is_active
                                                        ? 'bg-emerald-500/90 text-white hover:bg-emerald-600'
                                                        : 'bg-gray-700/90 text-gray-200 hover:bg-gray-800'
                                                }`}
                                                title={item.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                                            >
                                                {item.is_active ? 'Aktif' : 'Nonaktif'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Video Info Content */}
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <h4
                                                onClick={() => setPreviewVideo(item)}
                                                className="font-bold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2 hover:text-[var(--brand-primary,#FF6B35)] cursor-pointer transition-colors"
                                            >
                                                {item.title}
                                            </h4>
                                            {item.description && (
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Target Role Badges */}
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                Tampil Untuk Peran:
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {item.target_role_labels.map((role) => (
                                                    <Badge
                                                        key={role.key}
                                                        variant="outline"
                                                        className={`text-[10px] font-bold px-1.5 py-0 ${getRoleBadgeClasses(role.color)}`}
                                                    >
                                                        {role.badge || role.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="border-t border-gray-100 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setPreviewVideo(item)}
                                            className="h-8 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800"
                                        >
                                            <Play className="size-3 mr-1 text-red-600 fill-red-600" />
                                            Tonton
                                        </Button>

                                        <a
                                            href={item.youtube_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center size-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                            title="Buka di YouTube"
                                        >
                                            <ExternalLink className="size-3.5" />
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenEdit(item)}
                                            className="h-8 px-2.5 text-xs font-medium"
                                        >
                                            <Pencil className="size-3 mr-1" />
                                            Sunting
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeletingTutorial(item)}
                                            className="size-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                                            title="Hapus Video Tutorial"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 5. Pagination Footer */}
                {tutorials.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4 text-xs text-gray-500">
                        <p>
                            Menampilkan {tutorials.from} - {tutorials.to} dari {tutorials.total} video tutorial
                        </p>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: tutorials.last_page }).map((_, idx) => {
                                const pageNum = idx + 1;
                                const isCurrent = pageNum === tutorials.current_page;
                                return (
                                    <button
                                        key={pageNum}
                                        type="button"
                                        onClick={() => {
                                            router.get(
                                                '/admin/tutorials',
                                                { ...filters, page: pageNum },
                                                { preserveState: true, preserveScroll: true }
                                            );
                                        }}
                                        className={`size-8 rounded-lg font-bold text-xs transition-colors ${
                                            isCurrent
                                                ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                                : 'bg-white hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Dialog: Tambah / Sunting Video Tutorial */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                                <Youtube className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold">
                                    {editingTutorial ? 'Sunting Video Tutorial' : 'Tambah Video Tutorial Baru'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-500">
                                    Masukkan link YouTube dan tentukan peran target yang dapat mengakses video panduan ini.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        {/* Judul Video */}
                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Judul Video Tutorial <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                type="text"
                                placeholder="Contoh: Panduan Presensi Harian Siswa & Rekap Bulanan"
                                value={form.data.title}
                                onChange={(e) => form.setData('title', e.target.value)}
                                className="text-xs h-9"
                                required
                            />
                            {form.errors.title && (
                                <p className="text-[11px] font-medium text-red-500">{form.errors.title}</p>
                            )}
                        </div>

                        {/* Link YouTube */}
                        <div className="space-y-1.5">
                            <Label htmlFor="youtube_url" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Link URL Video YouTube <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="youtube_url"
                                    type="text"
                                    placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                                    value={form.data.youtube_url}
                                    onChange={(e) => form.setData('youtube_url', e.target.value)}
                                    className="text-xs h-9 pl-8"
                                    required
                                />
                                <Youtube className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-red-500" />
                            </div>
                            <p className="text-[10px] text-gray-500">
                                Mendukung format URL standar YouTube, link singkat (youtu.be), YouTube Shorts, maupun Embed.
                            </p>
                            {form.errors.youtube_url && (
                                <p className="text-[11px] font-medium text-red-500">{form.errors.youtube_url}</p>
                            )}

                            {/* Live Thumbnail Preview */}
                            {liveYoutubeId && (
                                <div className="mt-2.5 rounded-xl border border-gray-200 dark:border-gray-800 p-2.5 bg-gray-50/80 dark:bg-gray-900/60 flex items-center gap-3">
                                    <img
                                        src={`https://img.youtube.com/vi/${liveYoutubeId}/hqdefault.jpg`}
                                        alt="Thumbnail Preview"
                                        className="h-16 w-28 object-cover rounded-lg shadow-xs shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 className="size-3.5" /> ID Video Valid: <code className="font-mono text-[11px]">{liveYoutubeId}</code>
                                        </p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                            Thumbnail dan pemutar YouTube akan berfungsi otomatis saat video disimpan.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Target Roles (Kategori Role) */}
                        <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Kategori Peran Target <span className="text-red-500">*</span>
                                </Label>
                                <button
                                    type="button"
                                    onClick={handleSelectAllRoles}
                                    className="text-[11px] font-semibold text-[var(--brand-primary,#FF6B35)] hover:underline"
                                >
                                    {form.data.target_roles.length === roleEntries.length
                                        ? 'Batal Pilih Semua'
                                        : 'Pilih Semua Peran'}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                Tentukan peran mana saja yang dapat melihat dan menonton video tutorial ini pada portal aplikasi mereka.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {roleEntries.map(([rKey, rItem]) => {
                                    const isChecked = form.data.target_roles.includes(rKey);
                                    return (
                                        <label
                                            key={rKey}
                                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                isChecked
                                                    ? 'border-[var(--brand-primary,#FF6B35)]/70 bg-orange-50/40 dark:bg-orange-950/20'
                                                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
                                            }`}
                                        >
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={() => handleToggleRole(rKey)}
                                                className="mt-0.5 data-[state=checked]:bg-[var(--brand-primary,#FF6B35)] data-[state=checked]:border-[var(--brand-primary,#FF6B35)]"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                        {rItem.name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[9px] font-bold px-1 py-0 ${getRoleBadgeClasses(rItem.color)}`}
                                                    >
                                                        {rItem.badge}
                                                    </Badge>
                                                </div>
                                                {rItem.description && (
                                                    <p className="text-[10px] text-gray-500 leading-snug mt-0.5">
                                                        {rItem.description}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                            {form.errors.target_roles && (
                                <p className="text-[11px] font-medium text-red-500">{form.errors.target_roles}</p>
                            )}
                        </div>

                        {/* Deskripsi Video */}
                        <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
                            <Label htmlFor="description" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Deskripsi / Catatan Video <span className="text-gray-400 font-normal">(Opsional)</span>
                            </Label>
                            <textarea
                                id="description"
                                rows={3}
                                placeholder="Jelaskan ringkasan isi video tutorial, topik bahasan, atau langkah penting yang dibahas..."
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-[var(--brand-primary,#FF6B35)] dark:border-gray-700 dark:bg-gray-800"
                            />
                        </div>

                        {/* Pengaturan Tambahan: Urutan & Status Aktif */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                            <div className="space-y-1.5">
                                <Label htmlFor="order" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Urutan Tampil <span className="text-gray-400 font-normal">(Angka lebih kecil tampil di awal)</span>
                                </Label>
                                <Input
                                    id="order"
                                    type="number"
                                    min={0}
                                    max={999}
                                    value={form.data.order}
                                    onChange={(e) => form.setData('order', parseInt(e.target.value) || 0)}
                                    className="text-xs h-9"
                                />
                            </div>

                            <div className="flex items-center gap-2 sm:pt-6">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <Checkbox
                                        checked={form.data.is_active}
                                        onCheckedChange={(checked) => form.setData('is_active', Boolean(checked))}
                                        className="data-[state=checked]:bg-[var(--brand-primary,#FF6B35)] data-[state=checked]:border-[var(--brand-primary,#FF6B35)]"
                                    />
                                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                        Aktifkan video ini (langsung tayang di pengguna)
                                    </span>
                                </label>
                            </div>
                        </div>

                        <DialogFooter className="pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={form.processing}
                                className="text-xs font-semibold"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing || form.data.target_roles.length === 0}
                                className="bg-[var(--brand-primary,#FF6B35)] hover:bg-[var(--brand-primary-dark,#E0531F)] text-white text-xs font-bold shadow-md"
                            >
                                {form.processing ? (
                                    <>
                                        <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : editingTutorial ? (
                                    'Simpan Perubahan'
                                ) : (
                                    'Simpan Video Tutorial'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog: Konfirmasi Hapus */}
            <Dialog open={!!deletingTutorial} onOpenChange={(open) => !open && setDeletingTutorial(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-2">
                            <Trash2 className="size-6" />
                        </div>
                        <DialogTitle className="text-center text-lg font-bold">
                            Hapus Video Tutorial?
                        </DialogTitle>
                        <DialogDescription className="text-center text-xs text-gray-500">
                            Apakah Anda yakin ingin menghapus video tutorial <strong>"{deletingTutorial?.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingTutorial(null)}
                            className="text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            className="text-xs font-bold"
                        >
                            Ya, Hapus Video
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog: Pemutar Video Preview YouTube - Large Cinema View */}
            <Dialog open={!!previewVideo} onOpenChange={(open) => !open && setPreviewVideo(null)}>
                <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[94vw] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl p-0 overflow-hidden bg-black border border-white/10 rounded-2xl shadow-2xl">
                    {previewVideo && (
                        <div className="relative">
                            {/* Prominent Floating Close Button */}
                            <DialogClose className="absolute top-3.5 right-3.5 z-30 flex size-9 items-center justify-center rounded-full bg-black/70 hover:bg-black/95 text-white backdrop-blur-md transition-colors border border-white/20 shadow-lg cursor-pointer">
                                <X className="size-5" />
                                <span className="sr-only">Tutup</span>
                            </DialogClose>

                            {/* Responsive 16:9 Large Cinema Video Embed Player */}
                            <div className="relative aspect-video w-full max-h-[75vh] bg-black">
                                <iframe
                                    src={previewVideo.embed_url}
                                    title={previewVideo.title}
                                    className="h-full w-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>

                            {/* Player Info Below Video */}
                            <div className="p-4 sm:p-6 bg-gradient-to-b from-gray-900 to-gray-950 text-white space-y-3 border-t border-white/10">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div className="space-y-1.5">
                                        <h3 className="text-lg sm:text-xl font-bold leading-snug">
                                            {previewVideo.title}
                                        </h3>
                                        {previewVideo.description && (
                                            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-4xl">
                                                {previewVideo.description}
                                            </p>
                                        )}
                                    </div>
                                    <a
                                        href={previewVideo.youtube_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:shadow-red-600/30"
                                    >
                                        <Youtube className="size-4" /> Buka di YouTube
                                        <ExternalLink className="size-3.5" />
                                    </a>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800 text-xs">
                                    <span className="text-[11px] text-gray-400 font-semibold mr-1">Target Peran:</span>
                                    {previewVideo.target_role_labels.map((role) => (
                                        <Badge
                                            key={role.key}
                                            variant="outline"
                                            className={`text-[11px] font-bold px-2 py-0.5 ${getRoleBadgeClasses(role.color)}`}
                                        >
                                            {role.badge || role.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminTutorialsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pengaturan Sekolah', href: '/admin/school-settings' },
        { title: 'Kelola Tutorial', href: '/admin/tutorials' },
    ],
};
