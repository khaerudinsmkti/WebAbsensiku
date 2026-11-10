import { Head, Link, router } from '@inertiajs/react';
import {
    ExternalLink,
    Filter,
    Layers,
    Play,
    Search,
    Sliders,
    Sparkles,
    Video,
    X,
    Youtube,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { PageBanner } from '@/components/page-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface RoleItem {
    key: string;
    name: string;
    badge: string;
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
}

interface Props {
    tutorials: TutorialItem[];
    availableRoles: Record<string, RoleItem>;
    userRole: string;
    isAdmin: boolean;
    filters: {
        search?: string;
        role?: string;
    };
}

export default function TutorialsIndex({
    tutorials,
    availableRoles,
    userRole,
    isAdmin,
    filters,
}: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [activeVideo, setActiveVideo] = useState<TutorialItem | null>(null);

    const roleEntries = useMemo(() => Object.entries(availableRoles), [availableRoles]);

    // Handle filter submit
    const applyFilters = (newRole?: string, newSearch?: string) => {
        router.get(
            '/tutorials',
            {
                search: newSearch !== undefined ? newSearch : searchQuery,
                role: newRole !== undefined ? newRole : selectedRole,
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
        applyFilters(selectedRole, searchQuery);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedRole('');
        router.get('/tutorials', {}, { preserveState: true, replace: true });
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

    const userRoleInfo = availableRoles[userRole];

    return (
        <>
            <Head title="Video Tutorial & Panduan Sistem" />

            <div className="w-full min-w-0 max-w-7xl mx-auto space-y-5 px-3 sm:px-6 lg:px-8 py-5">
                {/* 1. Header Banner */}
                <PageBanner
                    badgeText={userRoleInfo ? `Panduan Khusus ${userRoleInfo.name}` : 'Pusat Panduan Video'}
                    title="Video Tutorial & Panduan Aplikasi"
                    description="Pelajari langkah praktis penggunaan fitur aplikasi presensi dan manajemen sekolah melalui materi video resmi yang dirancang khusus untuk peran Anda."
                    icon={<Youtube className="size-6 text-white" />}
                    action={
                        isAdmin ? (
                            <Button
                                asChild
                                className="bg-white text-gray-900 hover:bg-white/90 shadow-md font-bold text-xs sm:text-sm h-9"
                            >
                                <Link href="/admin/tutorials">
                                    <Sliders className="size-3.5 mr-1.5 text-red-600" />
                                    Kelola Video Tutorial
                                </Link>
                            </Button>
                        ) : undefined
                    }
                />

                {/* 2. Search & Filter Bar */}
                <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 sm:p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Cari topik atau materi panduan yang ingin dipelajari..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 text-xs h-9"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        applyFilters(selectedRole, '');
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
                            {(searchQuery || selectedRole) && (
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

                    {/* Filter Pills for Admin or multi-role users */}
                    {isAdmin && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                            <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1">
                                <Filter className="size-3.5" /> Filter Kategori:
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedRole('');
                                    applyFilters('', searchQuery);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    !selectedRole
                                        ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                Semua Video
                            </button>

                            {roleEntries.map(([rKey, rItem]) => {
                                const isSelected = selectedRole === rKey;
                                return (
                                    <button
                                        key={rKey}
                                        type="button"
                                        onClick={() => {
                                            const next = isSelected ? '' : rKey;
                                            setSelectedRole(next);
                                            applyFilters(next, searchQuery);
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                            isSelected
                                                ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {rItem.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 3. Tutorials Cards Grid */}
                {tutorials.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-800 bg-white/60 dark:bg-gray-900/40">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-3 shadow-xs">
                            <Youtube className="size-7" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            Belum Ada Video Tutorial
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {searchQuery || selectedRole
                                ? 'Tidak ada video tutorial yang cocok dengan kata kunci pencarian Anda.'
                                : 'Materi video panduan untuk peran Anda saat ini sedang disiapkan oleh Administrator.'}
                        </p>
                        {(searchQuery || selectedRole) && (
                            <div className="mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="text-xs font-semibold"
                                >
                                    Hapus Filter Pencarian
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tutorials.map((item) => (
                            <div
                                key={item.id}
                                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs transition-all hover:shadow-md hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900"
                            >
                                <div>
                                    {/* Video Thumbnail with Play Button */}
                                    <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                                        <img
                                            src={item.thumbnail_url}
                                            alt={item.title}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        {/* Play Button Overlay */}
                                        <button
                                            type="button"
                                            onClick={() => setActiveVideo(item)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/45 transition-colors group/play"
                                            title="Putar Video Tutorial"
                                        >
                                            <div className="flex size-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-red-600/40 group-hover/play:scale-110 transition-transform">
                                                <Play className="size-6 fill-white ml-0.5" />
                                            </div>
                                        </button>

                                        {/* YouTube Tag */}
                                        <div className="absolute top-2.5 left-2.5">
                                            <Badge className="bg-red-600 text-white font-bold text-[10px] px-1.5 py-0 shadow-xs border-0 flex items-center gap-1">
                                                <Youtube className="size-3" /> YouTube
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Video Content */}
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <h4
                                                onClick={() => setActiveVideo(item)}
                                                className="font-bold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2 hover:text-[var(--brand-primary,#FF6B35)] cursor-pointer transition-colors"
                                            >
                                                {item.title}
                                            </h4>
                                            {item.description && (
                                                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Target Role Badges */}
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

                                {/* Footer Action */}
                                <div className="border-t border-gray-100 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setActiveVideo(item)}
                                        className="h-8 px-3 text-xs font-bold bg-[var(--brand-primary,#FF6B35)] hover:bg-[var(--brand-primary-dark,#E0531F)] text-white shadow-xs"
                                    >
                                        <Play className="size-3 mr-1 fill-white" />
                                        Tonton Sekarang
                                    </Button>

                                    <a
                                        href={item.youtube_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                    >
                                        <span>Buka di YouTube</span>
                                        <ExternalLink className="size-3" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Player Modal Dialog - Cinema Large View */}
            <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
                <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[94vw] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl p-0 overflow-hidden bg-black border border-white/10 rounded-2xl shadow-2xl">
                    {activeVideo && (
                        <div className="relative">
                            {/* Prominent Floating Close Button */}
                            <DialogClose className="absolute top-3.5 right-3.5 z-30 flex size-9 items-center justify-center rounded-full bg-black/70 hover:bg-black/95 text-white backdrop-blur-md transition-colors border border-white/20 shadow-lg cursor-pointer">
                                <X className="size-5" />
                                <span className="sr-only">Tutup</span>
                            </DialogClose>

                            {/* Responsive 16:9 Large Cinema Video Player */}
                            <div className="relative aspect-video w-full max-h-[75vh] bg-black">
                                <iframe
                                    src={activeVideo.embed_url}
                                    title={activeVideo.title}
                                    className="h-full w-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>

                            {/* Video Information Card Below */}
                            <div className="p-4 sm:p-6 bg-gradient-to-b from-gray-900 to-gray-950 text-white space-y-3 border-t border-white/10">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div className="space-y-1.5">
                                        <h3 className="text-lg sm:text-xl font-bold leading-snug">
                                            {activeVideo.title}
                                        </h3>
                                        {activeVideo.description && (
                                            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-4xl">
                                                {activeVideo.description}
                                            </p>
                                        )}
                                    </div>
                                    <a
                                        href={activeVideo.youtube_url}
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
                                    {activeVideo.target_role_labels.map((role) => (
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

TutorialsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Video Tutorial', href: '/tutorials' },
    ],
};
