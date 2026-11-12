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
    ChevronLeft,
    ChevronRight,
    Images,
    FileCheck,
    Instagram,
    Sparkles,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import type { NewsAttachment, NewsCategory, NewsItem } from '@/types/news';

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

interface CompressedImageResult {
    file: File;
    base64: string;
    size: number;
}

function compressImageFile(file: File, maxWidth = 1200, maxHeight = 900, quality = 0.72): Promise<CompressedImageResult> {
    return new Promise((resolve) => {
        // If file is SVG, return as-is
        if (file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const b64 = (e.target?.result as string) || '';
                resolve({ file, base64: b64, size: file.size });
            };
            reader.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const rawBase64 = event.target?.result as string;
            const img = new Image();
            img.src = rawBase64;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Scale down proportionally
                if (width > maxWidth || height > maxHeight) {
                    if (width / height > maxWidth / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve({ file, base64: rawBase64, size: file.size });
                    return;
                }

                // Draw background white for transparent png conversion to jpeg
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Export as compressed JPEG
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

                canvas.toBlob(
                    (blob) => {
                        const blobSize = blob ? blob.size : Math.round((compressedBase64.length * 3) / 4);
                        const newName = file.name.replace(/\.[^/.]+$/, '.jpg');
                        const compressedFile = new File([blob || new Blob()], newName, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve({
                            file: compressedFile,
                            base64: compressedBase64,
                            size: blobSize,
                        });
                    },
                    'image/jpeg',
                    quality,
                );
            };
            img.onerror = () => resolve({ file, base64: rawBase64, size: file.size });
        };
        reader.onerror = () => resolve({ file, base64: '', size: file.size });
    });
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

export default function NewsManagement({ news, categories, stats, filters }: NewsPageProps) {
    const { flash, auth } = usePage<{ flash?: { success?: string; error?: string }; auth?: any }>().props;

    const permissions = auth?.permissions;
    const can = (action: string): boolean => {
        if (auth?.user?.role === 'admin' || permissions === '*') return true;
        if (!permissions || typeof permissions !== 'object') return false;
        return Boolean(permissions['news']?.[action]);
    };

    // Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    // Modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [previewNews, setPreviewNews] = useState<NewsItem | null>(null);
    const [previewActiveImageIdx, setPreviewActiveImageIdx] = useState(0);
    const [deletingNews, setDeletingNews] = useState<NewsItem | null>(null);

    // Multi-Image & Multi-Attachment States for Form
    const imageInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const [isCompressingImages, setIsCompressingImages] = useState(false);
    const [isConvertingPdf, setIsConvertingPdf] = useState(false);

    // Images state
    const [existingImages, setExistingImages] = useState<Array<{ path: string; url: string }>>([]);
    const [newImages, setNewImages] = useState<Array<{ id: string; file: File; base64: string }>>([]);

    // Attachments state
    const [existingAttachments, setExistingAttachments] = useState<NewsAttachment[]>([]);
    const [newAttachments, setNewAttachments] = useState<Array<{ id: string; file: File; base64: string; name: string; size: number }>>([]);
    const [isFetchingInstagram, setIsFetchingInstagram] = useState(false);
    const [lastFetchedInstagramUrl, setLastFetchedInstagramUrl] = useState('');
    const [instagramFetchNotice, setInstagramFetchNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

    // Form handler for News
    const form = useForm<{
        title: string;
        category_id: string | number;
        excerpt: string;
        content: string;
        instagram_url: string;
        is_published: boolean;
        existing_images: string[];
        images_base64: string[];
        existing_attachments: any[];
        attachments_base64: string[];
        attachments_names: string[];
    }>({
        title: '',
        category_id: categories[0]?.id || '',
        excerpt: '',
        content: '',
        instagram_url: '',
        is_published: true,
        existing_images: [],
        images_base64: [],
        existing_attachments: [],
        attachments_base64: [],
        attachments_names: [],
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
        setInstagramFetchNotice(null);
        setLastFetchedInstagramUrl('');
        form.reset();
        setExistingImages([]);
        setNewImages([]);
        setExistingAttachments([]);
        setNewAttachments([]);
        form.setData({
            title: '',
            category_id: categories[0]?.id || '',
            excerpt: '',
            content: '',
            instagram_url: '',
            is_published: true,
            existing_images: [],
            images_base64: [],
            existing_attachments: [],
            attachments_base64: [],
            attachments_names: [],
        });
        setIsFormModalOpen(true);
    };

    const openEditModal = (item: NewsItem) => {
        setEditingNews(item);
        setInstagramFetchNotice(null);
        setLastFetchedInstagramUrl(item.instagram_url || '');
        form.reset();

        // Existing images setup
        const curImages: Array<{ path: string; url: string }> = [];
        if (item.images && item.images.length > 0) {
            item.images.forEach((path, idx) => {
                const url = item.images_urls?.[idx] || `/storage/${path}`;
                curImages.push({ path, url });
            });
        } else if (item.image_path) {
            curImages.push({
                path: item.image_path,
                url: item.image_url || `/storage/${item.image_path}`,
            });
        }
        setExistingImages(curImages);
        setNewImages([]);

        // Existing attachments setup
        const curAttachments: NewsAttachment[] = [];
        if (item.attachments_data && item.attachments_data.length > 0) {
            item.attachments_data.forEach((att) => curAttachments.push(att));
        } else if (item.attachment_path) {
            curAttachments.push({
                path: item.attachment_path,
                name: item.attachment_name || 'Dokumen.pdf',
                size: item.attachment_size || 0,
                url: item.attachment_url || `/storage/${item.attachment_path}`,
                formatted_size: item.formatted_attachment_size,
            });
        }
        setExistingAttachments(curAttachments);
        setNewAttachments([]);

        form.setData({
            title: item.title,
            category_id: item.category_id || '',
            excerpt: item.excerpt || '',
            content: item.content,
            instagram_url: item.instagram_url || '',
            is_published: item.is_published,
            existing_images: curImages.map((i) => i.path),
            images_base64: [],
            existing_attachments: curAttachments,
            attachments_base64: [],
            attachments_names: [],
        });
        setIsFormModalOpen(true);
    };

    const handleFetchInstagramPost = async (overrideUrl?: string) => {
        const url = (overrideUrl !== undefined ? overrideUrl : form.data.instagram_url).trim();
        if (!url) {
            setInstagramFetchNotice({
                type: 'error',
                text: 'Masukkan tautan (URL) postingan atau reel Instagram terlebih dahulu.',
            });
            return;
        }

        if (isFetchingInstagram) return;

        setIsFetchingInstagram(true);
        setInstagramFetchNotice(null);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const xsrfCookie = document.cookie
                .split('; ')
                .find((row) => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];

            const res = await fetch('/news-management/fetch-instagram', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    ...(xsrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie) } : {}),
                },
                body: JSON.stringify({ url }),
            });

            const data = await res.json();
            if (!res.ok) {
                setInstagramFetchNotice({
                    type: 'error',
                    text: data.message || 'Gagal membaca tautan Instagram.',
                });
                return;
            }

            setLastFetchedInstagramUrl(data.clean_url || url);

            form.setData((prev) => ({
                ...prev,
                instagram_url: data.clean_url || url,
                title: data.title || prev.title || 'Update Informasi Instagram Sekolah',
                content: data.caption || prev.content || 'Simak informasi terbaru dari Instagram resmi sekolah melalui postingan terlampir.',
                excerpt: data.excerpt || prev.excerpt || '',
                category_id: data.suggested_category_id || prev.category_id,
            }));

            if (data.image_base64) {
                const addedImg = {
                    id: 'ig-cover-' + Math.random().toString(36).substring(2, 7),
                    file: new File([], 'instagram-post.jpg', { type: 'image/jpeg' }),
                    base64: data.image_base64,
                };
                setNewImages((prev) => {
                    const withoutOldIg = prev.filter((item) => !item.id.startsWith('ig-cover-'));
                    const updated = [addedImg, ...withoutOldIg];
                    form.setData('images_base64', updated.map((i) => i.base64));
                    return updated;
                });
            }

            if (data.fetched_automatically) {
                setInstagramFetchNotice({
                    type: 'success',
                    text: 'Judul, ringkasan, isi berita, dan foto sampul berhasil ditarik otomatis dari Instagram!',
                });
            } else {
                setInstagramFetchNotice({
                    type: 'info',
                    text: 'Tautan Embed Instagram berhasil dipasang! Silakan sesuaikan judul/caption atau foto sampul bila diperlukan.',
                });
            }
        } catch {
            setInstagramFetchNotice({
                type: 'error',
                text: 'Terjadi kesalahan saat menghubungi server untuk mengambil info Instagram.',
            });
        } finally {
            setIsFetchingInstagram(false);
        }
    };

    const handleInstagramUrlInputChange = (val: string) => {
        form.setData('instagram_url', val);
        const trimmed = val.trim();
        if (
            /instagram\.com\/(?:[^/]+\/)?(?:p|reel|tv)\/[A-Za-z0-9_-]+/i.test(trimmed) &&
            trimmed !== lastFetchedInstagramUrl
        ) {
            setLastFetchedInstagramUrl(trimmed);
            handleFetchInstagramPost(trimmed);
        }
    };

    const handleMultipleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsCompressingImages(true);
        try {
            const fileList = Array.from(files);
            const compressedResults: Array<{ id: string; file: File; base64: string }> = [];

            for (const f of fileList) {
                // Kompresi setiap gambar secara client-side
                const res = await compressImageFile(f);
                compressedResults.push({
                    id: Math.random().toString(36).substring(2, 9),
                    file: res.file,
                    base64: res.base64,
                });
            }

            setNewImages((prev) => {
                const updated = [...prev, ...compressedResults];
                form.setData('images_base64', updated.map((i) => i.base64));
                return updated;
            });
        } finally {
            setIsCompressingImages(false);
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
        }
    };

    const handleRemoveExistingImage = (path: string) => {
        setExistingImages((prev) => {
            const updated = prev.filter((i) => i.path !== path);
            form.setData('existing_images', updated.map((i) => i.path));
            return updated;
        });
    };

    const handleRemoveNewImage = (id: string) => {
        setNewImages((prev) => {
            const updated = prev.filter((i) => i.id !== id);
            form.setData('images_base64', updated.map((i) => i.base64));
            return updated;
        });
    };

    const handleMultipleAttachmentsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsConvertingPdf(true);
        try {
            const fileList = Array.from(files);
            const addedAttachments: Array<{ id: string; file: File; base64: string; name: string; size: number }> = [];

            for (const f of fileList) {
                if (f.size > 20 * 1024 * 1024) {
                    alert(`Berkas "${f.name}" melebihi batas 20 MB.`);
                    continue;
                }

                const base64Data = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => resolve('');
                    reader.readAsDataURL(f);
                });

                if (base64Data) {
                    addedAttachments.push({
                        id: Math.random().toString(36).substring(2, 9),
                        file: f,
                        base64: base64Data,
                        name: f.name,
                        size: f.size,
                    });
                }
            }

            setNewAttachments((prev) => {
                const updated = [...prev, ...addedAttachments];
                form.setData('attachments_base64', updated.map((a) => a.base64));
                form.setData('attachments_names', updated.map((a) => a.name));
                return updated;
            });
        } finally {
            setIsConvertingPdf(false);
            if (attachmentInputRef.current) {
                attachmentInputRef.current.value = '';
            }
        }
    };

    const handleRemoveExistingAttachment = (path: string) => {
        setExistingAttachments((prev) => {
            const updated = prev.filter((a) => a.path !== path);
            form.setData('existing_attachments', updated);
            return updated;
        });
    };

    const handleRemoveNewAttachment = (id: string) => {
        setNewAttachments((prev) => {
            const updated = prev.filter((a) => a.id !== id);
            form.setData('attachments_base64', updated.map((a) => a.base64));
            form.setData('attachments_names', updated.map((a) => a.name));
            return updated;
        });
    };

    const handleSaveNews = (e: React.FormEvent) => {
        e.preventDefault();

        // Sync final values before posting
        const payloadData = {
            ...form.data,
            existing_images: existingImages.map((i) => i.path),
            images_base64: newImages.map((i) => i.base64),
            existing_attachments: existingAttachments,
            attachments_base64: newAttachments.map((a) => a.base64),
            attachments_names: newAttachments.map((a) => a.name),
        };

        if (editingNews) {
            router.post(`/news-management/${editingNews.id}`, payloadData, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setEditingNews(null);
                },
            });
        } else {
            router.post('/news-management', payloadData, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    form.reset();
                    setExistingImages([]);
                    setNewImages([]);
                    setExistingAttachments([]);
                    setNewAttachments([]);
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
        <>
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
                        {can('create') && (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={openCreateModal}
                                className="rounded-xl px-4 text-xs font-bold shadow-sm"
                            >
                                <Plus className="mr-1.5 size-4" />
                                Tambah Berita Baru
                            </Button>
                        )}
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
                            {can('create') && (
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={openCreateModal}
                                    className="mt-4 rounded-xl text-xs font-bold"
                                >
                                    <Plus className="mr-1.5 size-4" />
                                    Tulis Berita Baru
                                </Button>
                            )}
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
                                        <th className="px-4 py-3.5">Dilihat</th>
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
                                                        <div className="relative shrink-0">
                                                            {item.image_url ? (
                                                                <img
                                                                    src={item.image_url}
                                                                    alt={item.title}
                                                                    className="size-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                                                                />
                                                            ) : (
                                                                <div className="flex size-14 items-center justify-center rounded-xl bg-gray-100 text-gray-400 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                                                    <ImageIcon className="size-6" />
                                                                </div>
                                                            )}
                                                            {((item.images_urls && item.images_urls.length > 1) || (item.images && item.images.length > 1)) && (
                                                                <span className="absolute -bottom-1.5 -right-1.5 flex items-center gap-0.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs backdrop-blur-xs">
                                                                    <Images className="size-2.5" />
                                                                    {item.images_urls?.length || item.images?.length}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <h4 className="font-extrabold text-gray-900 line-clamp-1 dark:text-white">
                                                                    {item.title}
                                                                </h4>
                                                                {item.instagram_url && (
                                                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 px-2 py-0.5 text-[9px] font-extrabold text-white shadow-xs">
                                                                        <Instagram className="size-2.5" />
                                                                        <span>IG</span>
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                    {item.attachments_data && item.attachments_data.length > 1 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setPreviewActiveImageIdx(0);
                                                                setPreviewNews(item);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
                                                        >
                                                            <FileText className="size-3.5 text-red-600" />
                                                            <span>{item.attachments_data.length} Dokumen PDF</span>
                                                        </button>
                                                    ) : item.attachment_url ? (
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
                                                <td className="px-4 py-3.5">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                                        <Eye className="size-3" />
                                                        <span>{item.views_count ?? 0}x</span>
                                                    </span>
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
                                                        {can('edit') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(item)}
                                                                className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400"
                                                                title="Edit Berita"
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </button>
                                                        )}
                                                        {can('delete') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingNews(item)}
                                                                className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-gray-700 dark:text-red-400"
                                                                title="Hapus Berita"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        )}
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
                            {/* Impor dari Postingan / Reel Instagram Sekolah */}
                            <div className="rounded-2xl border-2 border-pink-200/80 bg-gradient-to-r from-pink-50/70 via-purple-50/40 to-orange-50/60 p-4 dark:border-pink-900/50 dark:from-pink-950/30 dark:via-purple-950/20 dark:to-orange-950/20">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-xs">
                                            <Instagram className="size-4" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-extrabold uppercase tracking-wide text-pink-900 dark:text-pink-200">
                                                Impor / Tautkan dari Instagram Sekolah (Opsional)
                                            </label>
                                            <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                                Tempel link postingan atau reel Instagram sekolah untuk menarik caption & foto otomatis serta menampilkan embed Instagram di berita.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <input
                                        type="url"
                                        value={form.data.instagram_url}
                                        onChange={(e) => handleInstagramUrlInputChange(e.target.value)}
                                        placeholder="Tempel link Instagram (otomatis tarik judul, ringkasan & foto sampul)..."
                                        className="flex-1 rounded-xl border border-pink-200 bg-white px-3.5 py-2 text-xs font-semibold focus:border-pink-500 focus:outline-none dark:border-pink-900/60 dark:bg-gray-800 dark:text-white"
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={isFetchingInstagram || !form.data.instagram_url.trim()}
                                        onClick={() => handleFetchInstagramPost()}
                                        className="rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 px-4 py-2 text-xs font-bold text-white hover:opacity-95 border-0 shadow-xs shrink-0"
                                    >
                                        {isFetchingInstagram ? (
                                            <>
                                                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                                Menarik Data IG...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-1.5 size-3.5" />
                                                Tarik Otomatis dari IG
                                            </>
                                        )}
                                    </Button>
                                    {form.data.instagram_url && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                form.setData('instagram_url', '');
                                                setLastFetchedInstagramUrl('');
                                                setInstagramFetchNotice(null);
                                            }}
                                            className="rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-bold text-gray-500 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800"
                                            title="Hapus tautan Instagram"
                                        >
                                            Reset Link
                                        </button>
                                    )}
                                </div>

                                {instagramFetchNotice && (
                                    <div
                                        className={`mt-2.5 rounded-xl px-3 py-2 text-[11px] font-semibold ${
                                            instagramFetchNotice.type === 'success'
                                                ? 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200'
                                                : instagramFetchNotice.type === 'error'
                                                ? 'bg-rose-100/90 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200'
                                                : 'bg-blue-100/90 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200'
                                        }`}
                                    >
                                        {instagramFetchNotice.text}
                                    </div>
                                )}
                            </div>

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

                            {/* Upload Multiple Gambar Berita */}
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                                            Galeri Foto / Gambar Berita
                                        </label>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            Bisa memilih lebih dari 1 gambar. Gambar akan dikompresi otomatis sehingga ukuran sangat ringan.
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-bold text-[#FF6B35]">
                                        Total: {existingImages.length + newImages.length} Foto
                                    </span>
                                </div>

                                {/* Preview Grid Images */}
                                {(existingImages.length > 0 || newImages.length > 0) && (
                                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {/* Existing Images */}
                                        {existingImages.map((img, idx) => (
                                            <div key={`existing-${img.path}`} className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800 aspect-square">
                                                <img
                                                    src={img.url}
                                                    alt={`Foto ${idx + 1}`}
                                                    className="size-full object-cover"
                                                />
                                                {idx === 0 && (
                                                    <span className="absolute top-1 left-1 rounded bg-[#FF6B35] px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                                                        Utama
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExistingImage(img.path)}
                                                    className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 hover:scale-110 shadow-xs"
                                                    title="Hapus foto ini"
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* New Images */}
                                        {newImages.map((img, idx) => {
                                            const isPrimary = existingImages.length === 0 && idx === 0;
                                            return (
                                                <div key={`new-${img.id}`} className="group relative rounded-xl overflow-hidden border-2 border-emerald-400/80 bg-gray-100 dark:border-emerald-600 dark:bg-gray-800 aspect-square">
                                                    <img
                                                        src={img.base64}
                                                        alt="Foto Baru"
                                                        className="size-full object-cover"
                                                    />
                                                    {isPrimary ? (
                                                        <span className="absolute top-1 left-1 rounded bg-[#FF6B35] px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                                                            Utama
                                                        </span>
                                                    ) : (
                                                        <span className="absolute top-1 left-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                                                            Baru
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveNewImage(img.id)}
                                                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 hover:scale-110 shadow-xs"
                                                        title="Hapus foto ini"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="mt-3 flex items-center gap-3">
                                    <input
                                        type="file"
                                        ref={imageInputRef}
                                        accept="image/*"
                                        multiple
                                        onChange={handleMultipleImagesChange}
                                        className="hidden"
                                        id="news-images-upload"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isCompressingImages}
                                        onClick={() => imageInputRef.current?.click()}
                                        className="rounded-xl border-gray-300 text-xs font-bold"
                                    >
                                        <UploadCloud className="mr-1.5 size-4 text-[#FF6B35]" />
                                        {isCompressingImages
                                            ? 'Mengompresi Gambar...'
                                            : existingImages.length + newImages.length > 0
                                            ? '+ Tambah Foto Lainnya'
                                            : 'Pilih Foto / Gambar (Bisa Banyak)'}
                                    </Button>
                                    <span className="text-[11px] text-gray-400">
                                        Foto urutan pertama akan otomatis dijadikan sampul (cover).
                                    </span>
                                </div>
                            </div>

                            {/* Upload Multiple Lampiran Dokumen PDF */}
                            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4 dark:border-red-950/60 dark:bg-red-950/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="size-4 text-red-600 dark:text-red-400" />
                                        <label className="text-xs font-bold text-red-950 dark:text-red-300 uppercase">
                                            Lampiran Dokumen PDF (Opsional)
                                        </label>
                                    </div>
                                    <span className="text-[11px] font-bold text-red-700 dark:text-red-300">
                                        Total: {existingAttachments.length + newAttachments.length} Berkas
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                                    Bisa melampirkan beberapa dokumen PDF resmi sekaligus (Surat Edaran, Jadwal Ujian, Panduan, dsb). Maks 20MB per berkas.
                                </p>

                                {/* List Attachments */}
                                {(existingAttachments.length > 0 || newAttachments.length > 0) && (
                                    <div className="space-y-2 mb-3">
                                        {/* Existing Attachments */}
                                        {existingAttachments.map((att) => (
                                            <div
                                                key={`existing-att-${att.path}`}
                                                className="flex items-center justify-between rounded-xl border border-red-200 bg-white p-2.5 shadow-xs dark:border-red-900/50 dark:bg-gray-800"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                                                        <FileText className="size-3.5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                                                            {att.name}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 block">
                                                            {att.formatted_size || formatFileSize(att.size)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExistingAttachment(att.path)}
                                                    className="rounded-lg p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                    title="Hapus berkas ini"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* New Attachments */}
                                        {newAttachments.map((att) => (
                                            <div
                                                key={`new-att-${att.id}`}
                                                className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50/50 p-2.5 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/20"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                                        <FileCheck className="size-3.5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                                {att.name}
                                                            </span>
                                                            <span className="rounded bg-emerald-200/80 px-1 py-0.2 text-[9px] font-bold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                                                                Baru
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 block">
                                                            {formatFileSize(att.size)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveNewAttachment(att.id)}
                                                    className="rounded-lg p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                    title="Hapus berkas ini"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <input
                                        type="file"
                                        ref={attachmentInputRef}
                                        accept="application/pdf"
                                        multiple
                                        onChange={handleMultipleAttachmentsChange}
                                        className="hidden"
                                        id="news-attachments-upload"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isConvertingPdf}
                                        onClick={() => attachmentInputRef.current?.click()}
                                        className="rounded-xl border-red-200 bg-white text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-gray-800 dark:text-red-300"
                                    >
                                        <Paperclip className="mr-1.5 size-4" />
                                        {isConvertingPdf
                                            ? 'Menyiapkan Dokumen...'
                                            : existingAttachments.length + newAttachments.length > 0
                                            ? '+ Tambah Dokumen PDF Lain'
                                            : 'Pilih Dokumen PDF (Bisa Banyak)'}
                                    </Button>
                                </div>
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
                                    disabled={form.processing || isCompressingImages || isConvertingPdf}
                                    className="rounded-xl px-5 text-xs font-bold shadow-sm"
                                >
                                    {isCompressingImages
                                        ? 'Mengompresi Foto...'
                                        : isConvertingPdf
                                        ? 'Menyiapkan Lampiran...'
                                        : form.processing
                                        ? 'Menyimpan...'
                                        : editingNews
                                        ? 'Simpan Perubahan'
                                        : 'Terbitkan Berita'}
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
            {previewNews && (() => {
                const previewImages = previewNews.images_urls && previewNews.images_urls.length > 0
                    ? previewNews.images_urls
                    : (previewNews.image_url ? [previewNews.image_url] : []);

                const previewAttachments = previewNews.attachments_data && previewNews.attachments_data.length > 0
                    ? previewNews.attachments_data
                    : (previewNews.attachment_url ? [{
                        path: previewNews.attachment_path || '',
                        name: previewNews.attachment_name || 'Lampiran Berita.pdf',
                        size: previewNews.attachment_size || 0,
                        url: previewNews.attachment_url,
                        formatted_size: previewNews.formatted_attachment_size,
                    }] : []);

                const currentImage = previewImages[previewActiveImageIdx] || previewImages[0];

                return (
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

                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                {/* Galeri Gambar */}
                                {previewImages.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-black/5 dark:border-gray-800">
                                            <img
                                                src={currentImage}
                                                alt={previewNews.title}
                                                className="w-full max-h-80 object-cover"
                                            />
                                            {previewImages.length > 1 && (
                                                <>
                                                    <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-black text-white backdrop-blur-xs">
                                                        {previewActiveImageIdx + 1} / {previewImages.length} Foto
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewActiveImageIdx((prev) => (prev > 0 ? prev - 1 : previewImages.length - 1))}
                                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs hover:bg-black/80"
                                                    >
                                                        <ChevronLeft className="size-5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewActiveImageIdx((prev) => (prev < previewImages.length - 1 ? prev + 1 : 0))}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs hover:bg-black/80"
                                                    >
                                                        <ChevronRight className="size-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Thumbnail Strip jika lebih dari 1 foto */}
                                        {previewImages.length > 1 && (
                                            <div className="flex items-center gap-2 overflow-x-auto py-1">
                                                {previewImages.map((img, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setPreviewActiveImageIdx(idx)}
                                                        className={`relative size-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                                                            previewActiveImageIdx === idx
                                                                ? 'border-[#FF6B35] ring-2 ring-orange-200 dark:ring-orange-900'
                                                                : 'border-transparent opacity-60 hover:opacity-100'
                                                        }`}
                                                    >
                                                        <img src={img} alt={`Thumb ${idx + 1}`} className="size-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2">
                                    {previewNews.category && (
                                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                            {previewNews.category.name}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">
                                        {previewNews.formatted_date}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                        <Eye className="size-3.5" />
                                        <span>{previewNews.views_count ?? 0} kali dilihat</span>
                                    </span>
                                </div>

                                <h2 className="text-2xl font-black text-gray-900 leading-snug dark:text-white">
                                    {previewNews.title}
                                </h2>

                                <div
                                    className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 whitespace-pre-line"
                                    dangerouslySetInnerHTML={{ __html: previewNews.content }}
                                />

                                {/* Instagram Embed & Link di Pratinjau */}
                                {previewNews.instagram_url && (
                                    <div className="mt-5 rounded-2xl border-2 border-pink-200/80 bg-gradient-to-br from-pink-50/60 via-white to-orange-50/40 p-4 dark:border-pink-900/50 dark:from-pink-950/20 dark:via-gray-900 dark:to-orange-950/20 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-xs">
                                                    <Instagram className="size-4" />
                                                </div>
                                                <span className="text-xs font-extrabold text-pink-900 dark:text-pink-200">
                                                    Postingan Instagram Resmi Sekolah
                                                </span>
                                            </div>
                                            <a
                                                href={previewNews.instagram_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:opacity-95"
                                            >
                                                <ExternalLink className="size-3.5" />
                                                Buka di Instagram
                                            </a>
                                        </div>

                                        {previewNews.instagram_embed_url && (
                                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800">
                                                <iframe
                                                    src={previewNews.instagram_embed_url}
                                                    title={previewNews.title}
                                                    className="w-full h-[480px] border-0"
                                                    allowTransparency={true}
                                                    allow="encrypted-media"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Daftar Lampiran Dokumen PDF */}
                                {previewAttachments.length > 0 && (
                                    <div className="mt-6 rounded-2xl border-2 border-red-100 bg-red-50/50 p-4.5 dark:border-red-950 dark:bg-red-950/30 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="size-4.5 text-red-600 dark:text-red-400" />
                                                <h4 className="text-xs font-black uppercase tracking-wider text-red-950 dark:text-red-300">
                                                    Lampiran Dokumen Resmi ({previewAttachments.length})
                                                </h4>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-red-200/60 dark:divide-red-900/40">
                                            {previewAttachments.map((att, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 first:pt-0"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300">
                                                            <FileText className="size-4.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-extrabold text-gray-900 dark:text-white block truncate">
                                                                {att.name}
                                                            </span>
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
                                                                    className="inline-flex items-center gap-1 rounded-xl border border-red-300 bg-white px-2.5 py-1.5 text-xs font-bold text-red-700 shadow-xs hover:bg-red-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-300"
                                                                >
                                                                    <Eye className="size-3.5" />
                                                                    Lihat
                                                                </a>
                                                                <a
                                                                    href={att.url}
                                                                    download
                                                                    className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700"
                                                                >
                                                                    <Download className="size-3.5" />
                                                                    Unduh
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
                        </div>
                    </div>
                );
            })()}

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
        </>
    );
}

NewsManagement.layout = {
    breadcrumbs,
};

