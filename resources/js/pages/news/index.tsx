import { useState, useRef, useMemo } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowUpDown,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileText,
    FolderPlus,
    ImageIcon,
    Layers,
    Newspaper,
    Paperclip,
    Pencil,
    Plus,
    Search,
    Trash2,
    UploadCloud,
    X,
    ExternalLink,
    AlertCircle,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import type { NewsCategory, NewsItem } from '@/types/news';

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

interface NewsPageProps {
    news: {
        data: NewsItem[];
    } & PaginationMeta;
    categories: NewsCategory[];
    stats: {
        total: number;
        published: number;
        draft: number;
        total_views: number;
    };
    filters: {
        search: string;
        category_id: string;
        status: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Berita',
        href: '/news-management',
    },
];

const categoryColorMap: Record<string, { bg: string; text: string; border: string }> = {
    amber: { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
    rose: { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
    sky: { bg: 'bg-sky-100 dark:bg-sky-950/60', text: 'text-sky-800 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
};

export default function NewsManagement({ news, categories, stats, filters }: NewsPageProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    // Modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [previewNews, setPreviewNews] = useState<NewsItem | null>(null);
    const [deletingNews, setDeletingNews] = useState<NewsItem | null>(null);

    // Image & File upload refs
    const imageInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Form handler for News
    const form = useForm<{
        title: string;
        category_id: string | number;
        excerpt: string;
        content: string;
        is_published: boolean;
        image: File | null;
        remove_image: boolean;
        attachment: File | null;
        remove_attachment: boolean;
    }>({
        title: '',
        category_id: categories[0]?.id || '',
        excerpt: '',
        content: '',
        is_published: true,
        image: null,
        remove_image: false,
        attachment: null,
        remove_attachment: false,
    });

    // Form handler for Category
    const categoryForm = useForm<{
        name: string;
        color: string;
        description: string;
    }>({
        name: '',
        color: 'blue',
        description: '',
    });

    const handleApplyFilters = () => {
        router.get(
            '/news-management',
            {
                search: search || undefined,
                category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedCategory('all');
        setSelectedStatus('all');
        router.get('/news-management', {}, { preserveState: true, preserveScroll: true });
    };

    const openCreateModal = () => {
        setEditingNews(null);
        form.reset();
        form.setData({
            title: '',
            category_id: categories[0]?.id || '',
            excerpt: '',
            content: '',
            is_published: true,
            image: null,
            remove_image: false,
            attachment: null,
            remove_attachment: false,
        });
        setImagePreview(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (item: NewsItem) => {
        setEditingNews(item);
        form.reset();
        form.setData({
            title: item.title,
            category_id: item.category_id || '',
            excerpt: item.excerpt || '',
            content: item.content,
            is_published: item.is_published,
            image: null,
            remove_image: false,
            attachment: null,
            remove_attachment: false,
        });
        setImagePreview(item.image_url || null);
        setIsFormModalOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setData('image', file);
            form.setData('remove_image', false);
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveSelectedImage = () => {
        form.setData('image', null);
        form.setData('remove_image', true);
        setImagePreview(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setData('attachment', file);
            form.setData('remove_attachment', false);
        }
    };

    const handleRemoveSelectedAttachment = () => {
        form.setData('attachment', null);
        form.setData('remove_attachment', true);
        if (attachmentInputRef.current) {
            attachmentInputRef.current.value = '';
        }
    };

    const handleSaveNews = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingNews) {
            // Using POST with multipart form data
            form.post(`/news-management/${editingNews.id}`, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setEditingNews(null);
                },
            });
        } else {
            form.post('/news-management', {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    form.reset();
                    setImagePreview(null);
                },
            });
        }
    };

    const handleDeleteNews = () => {
        if (!deletingNews) return;
        router.delete(`/news-management/${deletingNews.id}`, {
            onSuccess: () => {
                setDeletingNews(null);
            },
        });
    };

    const handleSaveCategory = (e: React.FormEvent) => {
        e.preventDefault();
        categoryForm.post('/news-management/categories', {
            onSuccess: () => {
                categoryForm.reset();
            },
        });
    };

    const handleDeleteCategory = (catId: number) => {
        if (confirm('Yakin ingin menghapus kategori ini? Berita yang terkait akan dipindahkan ke tanpa kategori.')) {
            router.delete(`/news-management/categories/${catId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Berita & Informasi Sekolah" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Flash Notice */}
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

                {/* Top Action Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                <Newspaper className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-[#111827] dark:text-white">
                                    Pengelolaan Berita & Pengumuman
                                </h1>
                                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                    Publikasikan informasi, kegiatan sekolah, dan lampiran edaran resmi ke portal publik.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="rounded-xl border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200"
                        >
                            <Layers className="mr-1.5 size-4 text-[#FF6B35]" />
                            Kategori ({categories.length})
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={openCreateModal}
                            className="rounded-xl px-4 text-xs font-bold shadow-sm"
                        >
                            <Plus className="mr-1.5 size-4" />
                            Tambah Berita Baru
                        </Button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Berita</span>
                        <div className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{stats.total}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Telah Terbit</span>
                        <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.published}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Draf / Simpanan</span>
                        <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">{stats.draft}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Total Pembaca</span>
                        <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">{stats.total_views}</div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center dark:border-gray-800 dark:bg-[#18122B]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                            placeholder="Cari judul atau isi berita..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-4 py-2 text-xs font-medium focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="all">Semua Kategori</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.news_count ?? 0})
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="all">Semua Status</option>
                            <option value="published">Terbit Saja</option>
                            <option value="draft">Draf Saja</option>
                        </select>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleApplyFilters}
                            className="rounded-xl text-xs font-bold"
                        >
                            Terapkan
                        </Button>

                        {(search || selectedCategory !== 'all' || selectedStatus !== 'all') && (
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

                {/* News Table / List */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                    {news.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35] dark:bg-orange-950/40">
                                <Newspaper className="size-7" />
                            </div>
                            <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                                Belum Ada Berita
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 max-w-sm dark:text-gray-400">
                                Mulai buat dan publikasikan berita sekolah pertama Anda untuk ditampilkan di portal publik.
                            </p>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={openCreateModal}
                                className="mt-4 rounded-xl text-xs font-bold"
                            >
                                <Plus className="mr-1.5 size-4" />
                                Tulis Berita Baru
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                                        <th className="px-4 py-3.5">Berita & Ringkasan</th>
                                        <th className="px-4 py-3.5">Kategori</th>
                                        <th className="px-4 py-3.5">Lampiran PDF</th>
                                        <th className="px-4 py-3.5">Status</th>
                                        <th className="px-4 py-3.5">Tanggal Terbit</th>
                                        <th className="px-4 py-3.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {news.data.map((item) => {
                                        const catColor = item.category?.color && categoryColorMap[item.category.color]
                                            ? categoryColorMap[item.category.color]
                                            : categoryColorMap.blue;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                                            >
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-start gap-3 max-w-md">
                                                        {item.image_url ? (
                                                            <img
                                                                src={item.image_url}
                                                                alt={item.title}
                                                                className="size-14 shrink-0 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                                                            />
                                                        ) : (
                                                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                                                <ImageIcon className="size-6" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 className="font-extrabold text-gray-900 line-clamp-1 dark:text-white">
                                                                {item.title}
                                                            </h4>
                                                            <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2 dark:text-gray-400 leading-snug">
                                                                {item.excerpt || item.content.replace(/<[^>]*>?/gm, '').substring(0, 100)}
                                                            </p>
                                                            <span className="mt-1 inline-block text-[10px] text-gray-400">
                                                                Oleh: {item.author?.name || 'Publisher'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {item.category ? (
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}
                                                        >
                                                            {item.category.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-[11px]">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {item.attachment_url ? (
                                                        <a
                                                            href={item.attachment_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
                                                        >
                                                            <FileText className="size-3.5" />
                                                            <span className="max-w-[120px] truncate">
                                                                {item.attachment_name || 'Lampiran.pdf'}
                                                            </span>
                                                            {item.formatted_attachment_size && (
                                                                <span className="text-[9px] opacity-75">
                                                                    ({item.formatted_attachment_size})
                                                                </span>
                                                            )}
                                                        </a>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-400">Tidak ada</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {item.is_published ? (
                                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                            Terbit
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                            Draf
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 font-medium text-gray-600 dark:text-gray-400 text-[11px]">
                                                    {item.formatted_date || '-'}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewNews(item)}
                                                            className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300"
                                                            title="Pratinjau Berita"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(item)}
                                                            className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400"
                                                            title="Edit Berita"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingNews(item)}
                                                            className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-gray-700 dark:text-red-400"
                                                            title="Hapus Berita"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {news.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
                            <span className="text-xs text-gray-500">
                                Halaman {news.current_page} dari {news.last_page} (Total {news.total} berita)
                            </span>
                            <div className="flex items-center gap-1">
                                {news.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                            link.active
                                                ? 'bg-[#FF6B35] text-white'
                                                : link.url
                                                ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                                                : 'text-gray-300 cursor-not-allowed dark:text-gray-600'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: Tambah / Edit Berita */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-[#18122B]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                    <Newspaper className="size-5" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    {editingNews ? 'Edit Berita Sekolah' : 'Tulis Berita Baru'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormModalOpen(false)}
                                className="flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Modal Form Content */}
                        <form onSubmit={handleSaveNews} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Judul Berita */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Judul Berita <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    placeholder="Contoh: Jadwal Ujian Akhir Semester Gasal 2026/2027"
                                    required
                                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                                {form.errors.title && (
                                    <p className="mt-1 text-xs text-red-500">{form.errors.title}</p>
                                )}
                            </div>

                            {/* Kategori & Status */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Kategori Berita
                                    </label>
                                    <select
                                        value={form.data.category_id}
                                        onChange={(e) => form.setData('category_id', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="">Tanpa Kategori</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Status Publikasi
                                    </label>
                                    <div className="flex items-center gap-3 pt-1.5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.data.is_published}
                                                onChange={(e) => form.setData('is_published', e.target.checked)}
                                                className="size-4 rounded text-[#FF6B35] focus:ring-[#FF6B35]"
                                            />
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                Terbitkan langsung ke publik
                                            </span>
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Jika tidak dicentang, berita akan tersimpan sebagai draf dan tidak tampil di publik.
                                    </p>
                                </div>
                            </div>

                            {/* Ringkasan Singkat / Excerpt */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Ringkasan Singkat (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.data.excerpt}
                                    onChange={(e) => form.setData('excerpt', e.target.value)}
                                    placeholder="Ringkasan 1-2 kalimat untuk kartu berita di dashboard publik..."
                                    className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            {/* Isi Berita Lengkap */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Isi Berita Lengkap <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={7}
                                    value={form.data.content}
                                    onChange={(e) => form.setData('content', e.target.value)}
                                    placeholder="Tuliskan isi berita, pengumuman, atau informasi lengkap di sini..."
                                    required
                                    className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                                {form.errors.content && (
                                    <p className="mt-1 text-xs text-red-500">{form.errors.content}</p>
                                )}
                            </div>

                            {/* Upload Gambar Berita */}
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Gambar Berita (Cover)
                                </label>
                                <p className="text-[11px] text-gray-500 mb-3">
                                    Format: JPG, PNG, WEBP. Maksimal 5MB.
                                </p>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    {imagePreview ? (
                                        <div className="relative group">
                                            <img
                                                src={imagePreview}
                                                alt="Preview Berita"
                                                className="size-24 rounded-2xl object-cover border-2 border-orange-200 shadow-sm dark:border-gray-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveSelectedImage}
                                                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
                                                title="Hapus gambar"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex size-24 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800">
                                            <ImageIcon className="size-8" />
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            ref={imageInputRef}
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="news-image-upload"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => imageInputRef.current?.click()}
                                            className="rounded-xl border-gray-300 text-xs font-bold"
                                        >
                                            <UploadCloud className="mr-1.5 size-4 text-[#FF6B35]" />
                                            {imagePreview ? 'Ganti Gambar' : 'Pilih File Gambar'}
                                        </Button>
                                        {form.errors.image && (
                                            <p className="mt-1 text-xs text-red-500">{form.errors.image}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Upload Lampiran Dokumen PDF */}
                            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4 dark:border-red-950/60 dark:bg-red-950/20">
                                <div className="flex items-center gap-2">
                                    <FileText className="size-4 text-red-600 dark:text-red-400" />
                                    <label className="text-xs font-bold text-red-950 dark:text-red-300 uppercase">
                                        Lampiran Dokumen PDF (Opsional)
                                    </label>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                                    Gunakan untuk melampirkan berkas resmi seperti Surat Edaran, Jadwal Ujian, Panduan, dll. Maks 20MB.
                                </p>

                                {(form.data.attachment || (editingNews?.attachment_path && !form.data.remove_attachment)) ? (
                                    <div className="flex items-center justify-between rounded-xl border border-red-200 bg-white p-3 shadow-xs dark:border-red-900/50 dark:bg-gray-800">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                                                <FileText className="size-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-extrabold text-gray-900 dark:text-white max-w-xs block truncate">
                                                    {form.data.attachment
                                                        ? form.data.attachment.name
                                                        : editingNews?.attachment_name || 'Lampiran.pdf'}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    {form.data.attachment
                                                        ? `${(form.data.attachment.size / 1024 / 1024).toFixed(2)} MB`
                                                        : editingNews?.formatted_attachment_size}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveSelectedAttachment}
                                            className="rounded-lg p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                            title="Hapus lampiran PDF"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="file"
                                            ref={attachmentInputRef}
                                            accept="application/pdf"
                                            onChange={handleAttachmentChange}
                                            className="hidden"
                                            id="news-attachment-upload"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => attachmentInputRef.current?.click()}
                                            className="rounded-xl border-red-200 bg-white text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-gray-800 dark:text-red-300"
                                        >
                                            <Paperclip className="mr-1.5 size-4" />
                                            Pilih Berkas PDF
                                        </Button>
                                    </div>
                                )}
                                {form.errors.attachment && (
                                    <p className="mt-1 text-xs text-red-500">{form.errors.attachment}</p>
                                )}
                            </div>

                            {/* Modal Footer Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
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
                                    disabled={form.processing}
                                    className="rounded-xl px-5 text-xs font-bold shadow-sm"
                                >
                                    {form.processing ? 'Menyimpan...' : (editingNews ? 'Simpan Perubahan' : 'Terbitkan Berita')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Kelola Kategori Berita */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl dark:bg-[#18122B]">
                        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                    <Layers className="size-5" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    Kategori Berita
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            {/* Form Tambah Kategori */}
                            <form onSubmit={handleSaveCategory} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3 dark:border-gray-700 dark:bg-gray-800/40">
                                <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
                                    Tambah Kategori Baru
                                </span>
                                <div>
                                    <input
                                        type="text"
                                        value={categoryForm.data.name}
                                        onChange={(e) => categoryForm.setData('name', e.target.value)}
                                        placeholder="Nama Kategori (misal: Info Beasiswa)"
                                        required
                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                                            Warna Badge:
                                        </label>
                                        <select
                                            value={categoryForm.data.color}
                                            onChange={(e) => categoryForm.setData('color', e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        >
                                            <option value="blue">Biru (Blue)</option>
                                            <option value="emerald">Hijau (Emerald)</option>
                                            <option value="amber">Kuning/Emas (Amber)</option>
                                            <option value="purple">Ungu (Purple)</option>
                                            <option value="rose">Merah Muda (Rose)</option>
                                            <option value="sky">Biru Muda (Sky)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                                            Keterangan:
                                        </label>
                                        <input
                                            type="text"
                                            value={categoryForm.data.description}
                                            onChange={(e) => categoryForm.setData('description', e.target.value)}
                                            placeholder="Deskripsi singkat"
                                            className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={categoryForm.processing}
                                    className="w-full rounded-xl text-xs font-bold py-2"
                                >
                                    <Plus className="mr-1.5 size-4" />
                                    Simpan Kategori
                                </Button>
                            </form>

                            {/* Daftar Kategori */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">
                                    Daftar Kategori Tersedia ({categories.length})
                                </span>
                                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white overflow-hidden dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-800">
                                    {categories.map((cat) => {
                                        const catColor = categoryColorMap[cat.color] || categoryColorMap.blue;
                                        return (
                                            <div
                                                key={cat.id}
                                                className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}
                                                    >
                                                        {cat.name}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400">
                                                        ({cat.news_count ?? 0} berita)
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                                    title="Hapus Kategori"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Pratinjau Berita (Preview) */}
            {previewNews && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-[#18122B]">
                        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Pratinjau Tampilan Berita
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreviewNews(null)}
                                className="flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {previewNews.image_url && (
                                <img
                                    src={previewNews.image_url}
                                    alt={previewNews.title}
                                    className="w-full max-h-72 rounded-2xl object-cover border border-gray-100 shadow-sm dark:border-gray-700"
                                />
                            )}

                            <div className="flex items-center gap-2">
                                {previewNews.category && (
                                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                        {previewNews.category.name}
                                    </span>
                                )}
                                <span className="text-xs text-gray-400">
                                    {previewNews.formatted_date}
                                </span>
                            </div>

                            <h2 className="text-2xl font-black text-gray-900 leading-snug dark:text-white">
                                {previewNews.title}
                            </h2>

                            <div
                                className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed space-y-3"
                                dangerouslySetInnerHTML={{ __html: previewNews.content }}
                            />

                            {previewNews.attachment_url && (
                                <div className="mt-6 flex items-center justify-between rounded-2xl border-2 border-red-100 bg-red-50/50 p-4 dark:border-red-950 dark:bg-red-950/30">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300">
                                            <FileText className="size-5" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                                                {previewNews.attachment_name || 'Lampiran Berita.pdf'}
                                            </span>
                                            {previewNews.formatted_attachment_size && (
                                                <span className="text-[10px] text-gray-500 block">
                                                    Ukuran: {previewNews.formatted_attachment_size}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <a
                                        href={previewNews.attachment_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700"
                                    >
                                        <Download className="size-4" />
                                        Unduh PDF
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Konfirmasi Hapus Berita */}
            {deletingNews && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#18122B]">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                            <Trash2 className="size-6" />
                        </div>
                        <h3 className="mt-4 text-base font-black text-gray-900 dark:text-white">
                            Hapus Berita Ini?
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 leading-relaxed dark:text-gray-400">
                            Berita <strong className="text-gray-800 dark:text-gray-200">"{deletingNews.title}"</strong> beserta gambar dan lampirannya akan dihapus secara permanen.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setDeletingNews(null)}
                                className="rounded-xl text-xs font-bold"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteNews}
                                className="rounded-xl text-xs font-bold"
                            >
                                Ya, Hapus Berita
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

