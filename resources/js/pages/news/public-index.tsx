import { useState, useMemo, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    Eye,
    FileText,
    ImageIcon,
    Images,
    Instagram,
    Newspaper,
    Plus,
    Search,
    Sparkles,
    X,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/public-header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { dashboard, login } from '@/routes';
import type { NewsCategory, NewsItem } from '@/types/news';
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

interface PublicNewsProps {
    news: {
        data: NewsItem[];
    } & PaginationMeta;
    newsCategories: NewsCategory[];
    filters: {
        search: string;
        category_id: string;
        per_page?: number;
    };
}

function formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let b = bytes;
    while (b >= 1024 && i < units.length - 1) {
        b /= 1024;
        i++;
    }
    return `${b.toFixed(1)} ${units[i]}`;
}

export default function PublicNewsIndex({ news, newsCategories = [], filters }: PublicNewsProps) {
    const { auth, school } = usePage<{ auth: any; school?: SchoolProp }>().props;
    const schoolName = school?.name || 'AbsensiKu SD';
    const logoUrl = school?.logo_url;
    const isPublisherOrAdmin = auth?.user?.role === 'publisher' || auth?.user?.role === 'admin';

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || 'all');
    const [readingNews, setReadingNews] = useState<NewsItem | null>(null);
    const [readingActiveImageIdx, setReadingActiveImageIdx] = useState<number>(0);
    const [newsViewCounts, setNewsViewCounts] = useState<Record<number, number>>({});

    const getNewsViews = (item: NewsItem): number => {
        return newsViewCounts[item.id] !== undefined ? newsViewCounts[item.id] : (item.views_count ?? 0);
    };

    const handleOpenNews = (item: NewsItem) => {
        setReadingActiveImageIdx(0);
        setReadingNews(item);

        const currentViews = getNewsViews(item);
        setNewsViewCounts((prev) => ({
            ...prev,
            [item.id]: currentViews + 1,
        }));

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const xsrfCookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];

        fetch(`/berita/${item.id}/view`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                ...(xsrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie) } : {}),
            },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data && typeof data.views_count === 'number') {
                    setNewsViewCounts((prev) => ({
                        ...prev,
                        [item.id]: data.views_count,
                    }));
                }
            })
            .catch(() => {
                // Ignore network error, optimistic count remains
            });
    };

    // Auto-open news if query parameter ?read=ID is provided (e.g. from WhatsApp share link)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const readId = params.get('read');
        if (readId && news?.data) {
            const found = news.data.find((item) => item.id.toString() === readId);
            if (found) {
                handleOpenNews(found);
            }
        }
    }, [news?.data]);

    const handleApplyFilters = (newCategory?: string) => {
        const cat = newCategory !== undefined ? newCategory : selectedCategory;
        router.get(
            '/berita',
            {
                search: search || undefined,
                category_id: cat !== 'all' ? cat : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleCategoryClick = (catId: string) => {
        setSelectedCategory(catId);
        router.get(
            '/berita',
            {
                search: search || undefined,
                category_id: catId !== 'all' ? catId : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedCategory('all');
        router.get('/berita', {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <>
            <Head title="Berita & Informasi" />
            <div className="flex min-h-screen flex-col bg-page-gradient text-[#1F2937] dark:text-neutral-100">
                <PublicHeader />

                <main className="flex-1 px-6 py-10 pb-24 md:pb-10 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        {/* Header Banner */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-200 pb-8 dark:border-gray-800">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-bold text-[#FF6B35] dark:border-orange-900 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                    <Newspaper className="size-3.5" />
                                    Arsip Publikasi & Warta Sekolah
                                </div>
                                <h1 className="mt-3 text-3xl font-black text-[#111827] sm:text-4xl dark:text-white leading-tight">
                                    Berita, Agenda & Surat Edaran Resmi
                                </h1>
                                <p className="mt-1.5 text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-2xl">
                                    Kumpulan informasi terkini kegiatan sekolah, prestasi siswa, dan dokumen edaran resmi yang dapat diunduh langsung.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                    Total {news.total} Berita Diterbitkan
                                </span>
                            </div>
                        </div>

                        {/* Search & Categories Bar */}
                        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                            {/* Categories Filter Pills */}
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
                                    Semua Kategori
                                </button>
                                {newsCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => handleCategoryClick(cat.id.toString())}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                            selectedCategory === cat.id.toString()
                                                ? 'bg-[#FF6B35] text-white shadow-xs shadow-[#FF6B35]/30'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                        }`}
                                    >
                                        {cat.name} ({cat.news_count ?? 0})
                                    </button>
                                ))}
                            </div>

                            {/* Search Box */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleApplyFilters();
                                }}
                                className="flex items-center gap-2"
                            >
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari berita atau edaran..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-8 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                router.get('/berita', { category_id: selectedCategory !== 'all' ? selectedCategory : undefined });
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

                        {/* News Grid */}
                        {news.data.length === 0 ? (
                            <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 p-16 text-center backdrop-blur-md dark:border-gray-800 dark:bg-[#18122B]/60">
                                <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35] dark:bg-orange-950/40">
                                    <Newspaper className="size-8" />
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                                    Tidak Ada Berita yang Sesuai
                                </h3>
                                <p className="mt-1 text-xs text-gray-500 max-w-sm dark:text-gray-400">
                                    Coba gunakan kata kunci pencarian lain atau pilih kategori berita yang berbeda.
                                </p>
                                {(search || selectedCategory !== 'all') && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="mt-4 rounded-xl text-xs font-bold"
                                    >
                                        Tampilkan Semua Berita
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {news.data.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-primary,#FF6B35)] hover:shadow-md dark:border-gray-800 dark:bg-[#18122B]"
                                    >
                                        {/* Cover Image or Graphic */}
                                        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-tr from-orange-100 via-amber-50 to-teal-50 dark:from-gray-900 dark:via-purple-950/30 dark:to-gray-800">
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : item.instagram_url ? (
                                                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-600/20 p-6 text-center dark:from-amber-900/30 dark:via-pink-900/30 dark:to-purple-900/30">
                                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-md">
                                                        <Instagram className="size-6" />
                                                    </div>
                                                    <span className="mt-2.5 text-xs font-extrabold text-pink-700 dark:text-pink-300">
                                                        Update Instagram Sekolah
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-white/80 text-[#FF6B35] shadow-xs backdrop-blur-sm dark:bg-gray-800/80">
                                                        <Newspaper className="size-6" />
                                                    </div>
                                                    <span className="mt-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                                                        Warta & Publikasi Sekolah
                                                    </span>
                                                </div>
                                            )}

                                            {/* Top Badges */}
                                            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                                                {item.category && (
                                                    <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-[#FF6B35] shadow-sm backdrop-blur-md dark:bg-gray-900/90 dark:text-[#FFA07A]">
                                                        {item.category.name}
                                                    </span>
                                                )}
                                                {item.instagram_url && (
                                                    <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-sm">
                                                        <Instagram className="size-3" />
                                                        <span>Instagram</span>
                                                    </span>
                                                )}
                                                {item.images_urls && item.images_urls.length > 1 && (
                                                    <span className="flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
                                                        <Images className="size-3" />
                                                        <span>{item.images_urls.length} Foto</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Attachment PDF Indicator */}
                                            {item.attachments_data && item.attachments_data.length > 1 ? (
                                                <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-red-600/95 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                                                    <FileText className="size-3" />
                                                    <span>{item.attachments_data.length} Lampiran PDF</span>
                                                </div>
                                            ) : item.attachment_url ? (
                                                <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-red-600/95 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                                                    <FileText className="size-3" />
                                                    <span>Lampiran PDF</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Card Body */}
                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <span>{item.formatted_date}</span>
                                                    <span>•</span>
                                                    <span>Oleh: {item.author?.name || 'Publisher'}</span>
                                                </div>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300" title="Jumlah dilihat">
                                                    <Eye className="size-3 text-[#FF6B35]" />
                                                    <span>{getNewsViews(item)} dilihat</span>
                                                </span>
                                            </div>

                                            <h3
                                                onClick={() => handleOpenNews(item)}
                                                className="mt-2 cursor-pointer text-base font-extrabold text-[#111827] line-clamp-2 leading-snug group-hover:text-[var(--brand-primary,#FF6B35)] transition-colors dark:text-white"
                                            >
                                                {item.title}
                                            </h3>

                                            <p className="mt-2 flex-1 text-xs text-[#6B7280] line-clamp-3 leading-relaxed dark:text-[#9CA3AF]">
                                                {item.excerpt || item.content.replace(/<[^>]*>?/gm, '').substring(0, 120)}
                                            </p>

                                            {/* Card Footer Action */}
                                            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenNews(item)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-primary,#FF6B35)] hover:text-[var(--brand-primary-dark,#e05622)] transition-colors"
                                                >
                                                    <span>Baca Selengkapnya</span>
                                                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                                </button>

                                                <div className="flex items-center gap-1.5">
                                                    <WhatsAppShareButton type="news" item={item} variant="icon" size="xs" />
                                                    {item.attachment_url && (
                                                        <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                                                            <FileText className="size-3" />
                                                            PDF
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination Bar */}
                        {news.total > 0 && (
                            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    <span>
                                        Menampilkan {news.from ?? 0} - {news.to ?? 0} dari total {news.total} berita
                                    </span>
                                    <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3 dark:border-gray-700">
                                        <span className="text-xs text-gray-400">Tampilkan:</span>
                                        <select
                                            value={filters.per_page ?? 9}
                                            onChange={(e) => {
                                                router.get(
                                                    '/berita',
                                                    {
                                                        search: search || undefined,
                                                        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
                                                        per_page: e.target.value,
                                                    },
                                                    { preserveState: true, preserveScroll: true }
                                                );
                                            }}
                                            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-700 focus:border-[var(--brand-primary,#FF6B35)] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
                                        >
                                            <option value={9}>9 / halaman (Default)</option>
                                            <option value={18}>18 / halaman</option>
                                            <option value={27}>27 / halaman</option>
                                        </select>
                                    </div>
                                </div>

                                {news.last_page > 1 && (
                                    <div className="flex items-center gap-1.5">
                                        {news.links.map((link, idx) => (
                                            <button
                                                key={idx}
                                                disabled={!link.url || link.active}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                                    link.active
                                                        ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                                        : link.url
                                                        ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                                                        : 'cursor-not-allowed opacity-40 text-gray-400'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="hidden md:block border-t border-[#E8E8E8] bg-white/70 py-6 text-center text-xs text-[#6B7280] backdrop-blur-md dark:border-[#2D234A] dark:bg-[#18122B]/70 dark:text-[#9CA3AF]">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                        <div>
                            &copy; {new Date().getFullYear()} {schoolName}. All rights reserved.
                        </div>
                    </div>
                </footer>

                <PwaInstallPrompt />

                {/* MODAL: Baca Berita Lengkap & Unduh PDF */}
                {readingNews && (() => {
                    const allImages = readingNews.images_urls && readingNews.images_urls.length > 0
                        ? readingNews.images_urls
                        : (readingNews.image_url ? [readingNews.image_url] : []);

                    const allAttachments = readingNews.attachments_data && readingNews.attachments_data.length > 0
                        ? readingNews.attachments_data
                        : (readingNews.attachment_url ? [{
                            path: readingNews.attachment_path || '',
                            name: readingNews.attachment_name || 'Dokumen-Lampiran.pdf',
                            size: readingNews.attachment_size || 0,
                            url: readingNews.attachment_url,
                            formatted_size: readingNews.formatted_attachment_size,
                        }] : []);

                    const currentImage = allImages[readingActiveImageIdx] || allImages[0];

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-[28px] bg-white shadow-2xl dark:bg-[#18122B] overflow-hidden">
                                <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {readingNews.category && (
                                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                                {readingNews.category.name}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {readingNews.formatted_date}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                            <Eye className="size-3.5 text-[#FF6B35]" />
                                            <span>{getNewsViews(readingNews)} kali dilihat</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <WhatsAppShareButton type="news" item={readingNews} variant="button" size="xs" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReadingNews(null);
                                                setReadingActiveImageIdx(0);
                                            }}
                                            className="flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                                        >
                                            <X className="size-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                                    {allImages.length > 0 && (
                                        <div className="space-y-2.5">
                                            <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-black/5 dark:border-gray-800">
                                                <img
                                                    src={currentImage}
                                                    alt={readingNews.title}
                                                    className="w-full max-h-85 object-cover"
                                                />
                                                {allImages.length > 1 && (
                                                    <>
                                                        <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur-xs">
                                                            {readingActiveImageIdx + 1} / {allImages.length} Foto
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setReadingActiveImageIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs hover:bg-black/80 transition-colors"
                                                        >
                                                            <ChevronLeft className="size-5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setReadingActiveImageIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs hover:bg-black/80 transition-colors"
                                                        >
                                                            <ChevronRight className="size-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {allImages.length > 1 && (
                                                <div className="flex items-center gap-2 overflow-x-auto py-1">
                                                    {allImages.map((img, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => setReadingActiveImageIdx(idx)}
                                                            className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                                                                readingActiveImageIdx === idx
                                                                    ? 'border-[#FF6B35] ring-2 ring-orange-200 dark:ring-orange-900'
                                                                    : 'border-transparent opacity-60 hover:opacity-100'
                                                            }`}
                                                        >
                                                            <img src={img} alt={`Foto ${idx + 1}`} className="size-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight dark:text-white">
                                            {readingNews.title}
                                        </h1>
                                        <div className="mt-2 text-xs text-gray-400">
                                            Diterbitkan oleh: <strong className="text-gray-700 dark:text-gray-300">{readingNews.author?.name || 'Publisher Berita'}</strong>
                                        </div>
                                    </div>

                                    <div
                                        className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed dark:text-gray-300 space-y-3 whitespace-pre-line"
                                        dangerouslySetInnerHTML={{ __html: readingNews.content }}
                                    />

                                    {/* Embed Postingan Instagram Sekolah */}
                                    {readingNews.instagram_url && (
                                        <div className="mt-6 rounded-2xl border-2 border-pink-200/80 bg-gradient-to-br from-pink-50/60 via-white to-orange-50/40 p-5 dark:border-pink-900/50 dark:from-pink-950/20 dark:via-gray-900 dark:to-orange-950/20 space-y-3.5">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-xs">
                                                        <Instagram className="size-4.5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase tracking-wider text-pink-950 dark:text-pink-200">
                                                            Postingan Instagram Resmi Sekolah
                                                        </h4>
                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                            Lihat unggahan asli langsung dari akun media sosial sekolah
                                                        </span>
                                                    </div>
                                                </div>
                                                <a
                                                    href={readingNews.instagram_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 transition-opacity"
                                                >
                                                    <ExternalLink className="size-3.5" />
                                                    Buka di Instagram
                                                </a>
                                            </div>

                                            {readingNews.instagram_embed_url && (
                                                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800">
                                                    <iframe
                                                        src={readingNews.instagram_embed_url}
                                                        title={readingNews.title}
                                                        className="w-full h-[520px] border-0"
                                                        allowTransparency={true}
                                                        allow="encrypted-media"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {allAttachments.length > 0 && (
                                        <div className="mt-8 rounded-2xl border-2 border-red-200 bg-red-50/70 p-5 dark:border-red-900/60 dark:bg-red-950/30 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <FileText className="size-5 text-red-600 dark:text-red-400" />
                                                <h4 className="text-xs font-black uppercase tracking-wider text-red-950 dark:text-red-300">
                                                    Lampiran Dokumen Resmi ({allAttachments.length})
                                                </h4>
                                            </div>

                                            <div className="divide-y divide-red-200/60 dark:divide-red-900/40">
                                                {allAttachments.map((att, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 first:pt-0"
                                                    >
                                                        <div className="flex items-center gap-3.5 min-w-0">
                                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300">
                                                                <FileText className="size-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h5 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                                                                    {att.name}
                                                                </h5>
                                                                <span className="text-[10px] text-gray-500 block">
                                                                    Ukuran: {att.formatted_size || formatFileSize(att.size)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {att.url && (
                                                                <>
                                                                    <a
                                                                        href={att.url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 shadow-xs hover:bg-red-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-300"
                                                                    >
                                                                        <Eye className="size-3.5" />
                                                                        Lihat PDF
                                                                    </a>
                                                                    <a
                                                                        href={att.url}
                                                                        download
                                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-colors"
                                                                    >
                                                                        <Download className="size-3.5" />
                                                                        Unduh PDF
                                                                    </a>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-100 p-4 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
                                    <WhatsAppShareButton type="news" item={readingNews} variant="button" size="sm" />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setReadingNews(null);
                                            setReadingActiveImageIdx(0);
                                        }}
                                        className="rounded-xl text-xs font-bold"
                                    >
                                        Tutup Berita
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </>
    );
}

PublicNewsIndex.layout = (page: React.ReactNode) => page;

