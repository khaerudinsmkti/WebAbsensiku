import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Eye,
    ImageIcon,
    Images,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/public-header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import type { GalleryItem } from './index';
import { WhatsAppShareButton } from '@/components/whatsapp-share-button';

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

interface PublicGalleryProps {
    galleries: {
        data: GalleryItem[];
    } & PaginationMeta;
    categories: string[];
    filters: {
        search: string;
        category: string;
    };
}

export default function PublicGalleryIndex({ galleries, categories = [], filters }: PublicGalleryProps) {
    const { auth, school } = usePage<{ auth: any; school?: SchoolProp }>().props;
    const schoolName = school?.name || 'AbsensiKu SD';
    const canManageGallery =
        auth?.user?.role === 'publisher' ||
        auth?.user?.role === 'admin' ||
        auth?.user?.role === 'principal';

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [activeGallery, setActiveGallery] = useState<GalleryItem | null>(null);
    const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

    // Auto-open gallery if query parameter ?view=ID is provided (e.g. from WhatsApp share link)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const viewId = params.get('view');
        if (viewId && galleries?.data) {
            const found = galleries.data.find((item) => item.id.toString() === viewId);
            if (found) {
                setActivePhotoIdx(0);
                setActiveGallery(found);
            }
        }
    }, [galleries?.data]);

    const handleCategoryClick = (cat: string) => {
        setSelectedCategory(cat);
        router.get(
            '/galeri',
            {
                search: search || undefined,
                category: cat !== 'all' ? cat : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/galeri',
            {
                search: search || undefined,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedCategory('all');
        router.get('/galeri', {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <>
            <Head title="Galeri Kegiatan Sekolah" />
            <div className="flex min-h-screen flex-col bg-page-gradient text-[#1F2937] dark:text-neutral-100">
                <PublicHeader />

                <main className="flex-1 px-6 py-10 pb-24 md:pb-12 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        {/* Header Banner */}
                        <div className="flex flex-col gap-4 border-b border-gray-200 pb-8 sm:flex-row sm:items-end sm:justify-between dark:border-gray-800">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-bold text-[#FF6B35] dark:border-orange-900 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                    <Images className="size-3.5" />
                                    Dokumentasi & Momen Sekolah
                                </div>
                                <h1 className="mt-3 text-3xl font-black leading-tight text-[#111827] sm:text-4xl dark:text-white">
                                    Galeri Foto Kegiatan Sekolah
                                </h1>
                                <p className="mt-1.5 max-w-2xl text-xs text-[#6B7280] sm:text-sm dark:text-[#9CA3AF]">
                                    Dokumentasi berbagai aktivitas belajar, kegiatan ekstrakurikuler, prestasi siswa, dan momen kebersamaan warga sekolah.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                    Total {galleries.total} Album Kegiatan
                                </span>
                            </div>
                        </div>

                        {/* Search & Category Filter Bar */}
                        <div className="mt-8 flex flex-col gap-4 rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between dark:border-gray-800 dark:bg-[#18122B]">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleCategoryClick('all')}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                        selectedCategory === 'all'
                                            ? 'bg-[#FF6B35] text-white shadow-xs shadow-[#FF6B35]/30'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                    }`}
                                >
                                    Semua Kegiatan
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => handleCategoryClick(cat)}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                            selectedCategory === cat
                                                ? 'bg-[#FF6B35] text-white shadow-xs shadow-[#FF6B35]/30'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                        }`}
                                    >
                                        {cat}
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
                                        placeholder="Cari foto kegiatan..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2 pl-9 pr-8 text-xs font-semibold focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                router.get('/galeri', {
                                                    category: selectedCategory !== 'all' ? selectedCategory : undefined,
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
                                {(search || selectedCategory !== 'all') && (
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

                        {/* Gallery Cards Grid */}
                        {galleries.data.length === 0 ? (
                            <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 p-16 text-center backdrop-blur-md dark:border-gray-800 dark:bg-[#18122B]/60">
                                <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35] dark:bg-orange-950/40">
                                    <Images className="size-8" />
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                                    Belum Ada Dokumentasi Galeri
                                </h3>
                                <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
                                    Dokumentasi foto kegiatan sekolah akan ditampilkan di halaman ini.
                                </p>
                                {(search || selectedCategory !== 'all') && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="mt-4 rounded-xl text-xs font-bold"
                                    >
                                        Tampilkan Semua Galeri
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {galleries.data.map((item) => {
                                    const photoCount = item.images_urls?.length || (item.image_url ? 1 : 0);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setActivePhotoIdx(0);
                                                setActiveGallery(item);
                                            }}
                                            className="group cursor-pointer flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-primary,#FF6B35)] hover:shadow-md dark:border-gray-800 dark:bg-[#18122B]"
                                        >
                                            <div className="relative h-56 w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.title}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                        <ImageIcon className="size-10" />
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                                <div className="absolute top-3 left-3">
                                                    <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-[#FF6B35] shadow-sm backdrop-blur-md dark:bg-gray-900/90 dark:text-[#FFA07A]">
                                                        {item.category}
                                                    </span>
                                                </div>

                                                <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/75 px-3 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-md">
                                                    <Images className="size-3.5 text-[#FF6B35]" />
                                                    <span>{photoCount} Foto</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-1 flex-col p-5">
                                                <div className="flex items-center justify-between text-[11px] text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="size-3 text-[#FF6B35]" />
                                                        {item.formatted_date}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 font-bold text-[var(--brand-primary,#FF6B35)]">
                                                        <Eye className="size-3" />
                                                        Lihat Album
                                                    </span>
                                                </div>

                                                <h3 className="mt-2 line-clamp-2 text-base font-extrabold leading-snug text-[#111827] transition-colors group-hover:text-[var(--brand-primary,#FF6B35)] dark:text-white">
                                                    {item.title}
                                                </h3>

                                                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                                                    <span className="text-xs font-bold text-[#FF6B35] group-hover:underline">
                                                        Buka Galeri
                                                    </span>
                                                    <WhatsAppShareButton type="gallery" item={item} variant="icon" size="xs" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination (Default 9 item per halaman) */}
                        {galleries.data.length > 0 && (
                            <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:flex-row dark:border-gray-800 dark:bg-[#18122B]">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    Menampilkan {galleries.from ?? 1} - {galleries.to ?? galleries.data.length} dari total {galleries.total} album kegiatan (9 per halaman)
                                </span>

                                <div className="flex flex-wrap items-center gap-1.5">
                                    {galleries.links.map((link, idx) => (
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

                {/* Lightbox Modal */}
                {activeGallery && (() => {
                    const allPhotos =
                        activeGallery.images_urls && activeGallery.images_urls.length > 0
                            ? activeGallery.images_urls
                            : activeGallery.image_url
                            ? [activeGallery.image_url]
                            : [];
                    const currentPhoto = allPhotos[activePhotoIdx] || allPhotos[0];

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-[#18122B]">
                                <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                            {activeGallery.category}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {activeGallery.formatted_date}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <WhatsAppShareButton type="gallery" item={activeGallery} variant="button" size="xs" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveGallery(null);
                                                setActivePhotoIdx(0);
                                            }}
                                            className="flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                                        >
                                            <X className="size-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                    {currentPhoto && (
                                        <div className="relative overflow-hidden rounded-2xl bg-black/90">
                                            <img
                                                src={currentPhoto}
                                                alt={activeGallery.title}
                                                className="mx-auto max-h-[60vh] w-full object-contain"
                                            />
                                            {allPhotos.length > 1 && (
                                                <>
                                                    <span className="absolute bottom-3 right-3 rounded-lg bg-black/75 px-3 py-1 text-xs font-black text-white backdrop-blur-xs">
                                                        {activePhotoIdx + 1} / {allPhotos.length} Foto
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))
                                                        }
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                                    >
                                                        <ChevronLeft className="size-5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActivePhotoIdx((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))
                                                        }
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                                    >
                                                        <ChevronRight className="size-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {allPhotos.length > 1 && (
                                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                                            {allPhotos.map((imgUrl, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setActivePhotoIdx(idx)}
                                                    className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                                                        activePhotoIdx === idx
                                                            ? 'border-[#FF6B35] ring-2 ring-orange-200 dark:ring-orange-900'
                                                            : 'border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img src={imgUrl} alt={`Foto ${idx + 1}`} className="size-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex-1">
                                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                                {activeGallery.title}
                                            </h2>
                                        </div>
                                        <div className="shrink-0">
                                            <WhatsAppShareButton type="gallery" item={activeGallery} variant="button" size="sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </>
    );
}

PublicGalleryIndex.layout = (page: React.ReactNode) => page;

