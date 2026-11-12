import { useState, useRef } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    HardDrive,
    ImageIcon,
    Images,
    Pencil,
    Plus,
    Search,
    Sparkles,
    Trash2,
    UploadCloud,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { WhatsAppShareButton } from '@/components/whatsapp-share-button';

export interface GalleryItem {
    id: number;
    title: string;
    slug?: string;
    category: string;
    description?: string | null;
    activity_date?: string | null;
    image_path?: string | null;
    image_url?: string | null;
    images?: string[] | null;
    images_urls?: string[];
    file_size?: number;
    formatted_size?: string;
    formatted_date?: string;
    is_published: boolean;
    author?: {
        id: number;
        name: string;
        role?: string;
    } | null;
}

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

interface GalleryPageProps {
    galleries: {
        data: GalleryItem[];
    } & PaginationMeta;
    categories: string[];
    stats: {
        total_albums: number;
        published_albums: number;
        total_photos: number;
        total_size_formatted: string;
    };
    filters: {
        search: string;
        category: string;
        status: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Galeri Kegiatan',
        href: '/manage/galleries',
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

/**
 * Compress and resize image on the client side before upload (max 1280px, JPEG 72% quality)
 * so server disk usage and upload bandwidth remain minimal.
 */
function compressGalleryImage(
    file: File,
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.72,
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

                // Fill white background for transparent PNGs
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

export default function GalleryManagement({ galleries, categories, stats, filters }: GalleryPageProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
    const [previewGallery, setPreviewGallery] = useState<GalleryItem | null>(null);
    const [previewActiveIdx, setPreviewActiveIdx] = useState(0);
    const [deletingGallery, setDeletingGallery] = useState<GalleryItem | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [existingImages, setExistingImages] = useState<Array<{ path: string; url: string }>>([]);
    const [newImages, setNewImages] = useState<
        Array<{
            id: string;
            name: string;
            base64: string;
            originalSize: number;
            compressedSize: number;
        }>
    >([]);

    const form = useForm<{
        title: string;
        category: string;
        description: string;
        activity_date: string;
        is_published: boolean;
        existing_images: string[];
        images_base64: string[];
    }>({
        title: '',
        category: categories[0] || 'Kegiatan Sekolah',
        description: '',
        activity_date: new Date().toISOString().slice(0, 10),
        is_published: true,
        existing_images: [],
        images_base64: [],
    });

    const handleApplyFilters = () => {
        router.get(
            '/manage/galleries',
            {
                search: search || undefined,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedCategory('all');
        setSelectedStatus('all');
        router.get('/manage/galleries', {}, { preserveState: true, preserveScroll: true });
    };

    const openCreateModal = () => {
        setEditingGallery(null);
        setExistingImages([]);
        setNewImages([]);
        form.setData({
            title: '',
            category: categories[0] || 'Kegiatan Sekolah',
            description: '',
            activity_date: new Date().toISOString().slice(0, 10),
            is_published: true,
            existing_images: [],
            images_base64: [],
        });
        setIsFormModalOpen(true);
    };

    const openEditModal = (item: GalleryItem) => {
        setEditingGallery(item);
        const curImgs: Array<{ path: string; url: string }> = [];
        if (item.images && item.images.length > 0) {
            item.images.forEach((path, idx) => {
                curImgs.push({
                    path,
                    url: item.images_urls?.[idx] || `/storage/${path}`,
                });
            });
        } else if (item.image_path) {
            curImgs.push({
                path: item.image_path,
                url: item.image_url || `/storage/${item.image_path}`,
            });
        }
        setExistingImages(curImgs);
        setNewImages([]);

        form.setData({
            title: item.title,
            category: item.category || 'Kegiatan Sekolah',
            description: item.description || '',
            activity_date: item.activity_date ? item.activity_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
            is_published: item.is_published,
            existing_images: curImgs.map((i) => i.path),
            images_base64: [],
        });
        setIsFormModalOpen(true);
    };

    const handleSelectPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsCompressing(true);
        try {
            const added: Array<{
                id: string;
                name: string;
                base64: string;
                originalSize: number;
                compressedSize: number;
            }> = [];

            for (const file of Array.from(files)) {
                const res = await compressGalleryImage(file);
                if (res.base64) {
                    added.push({
                        id: Math.random().toString(36).substring(2, 9),
                        name: file.name,
                        base64: res.base64,
                        originalSize: res.originalSize,
                        compressedSize: res.compressedSize,
                    });
                }
            }

            setNewImages((prev) => {
                const updated = [...prev, ...added];
                form.setData(
                    'images_base64',
                    updated.map((i) => i.base64),
                );
                return updated;
            });
        } finally {
            setIsCompressing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveExistingImage = (path: string) => {
        setExistingImages((prev) => {
            const updated = prev.filter((i) => i.path !== path);
            form.setData(
                'existing_images',
                updated.map((i) => i.path),
            );
            return updated;
        });
    };

    const handleRemoveNewImage = (id: string) => {
        setNewImages((prev) => {
            const updated = prev.filter((i) => i.id !== id);
            form.setData(
                'images_base64',
                updated.map((i) => i.base64),
            );
            return updated;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...form.data,
            existing_images: existingImages.map((i) => i.path),
            images_base64: newImages.map((i) => i.base64),
        };

        if (editingGallery) {
            router.post(`/manage/galleries/${editingGallery.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setEditingGallery(null);
                },
            });
        } else {
            router.post('/manage/galleries', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setExistingImages([]);
                    setNewImages([]);
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (!deletingGallery) return;
        router.delete(`/manage/galleries/${deletingGallery.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingGallery(null),
        });
    };

    const totalOriginalSelected = newImages.reduce((acc, i) => acc + i.originalSize, 0);
    const totalCompressedSelected = newImages.reduce((acc, i) => acc + i.compressedSize, 0);
    const savedPercent =
        totalOriginalSelected > 0
            ? Math.max(0, Math.round(((totalOriginalSelected - totalCompressedSelected) / totalOriginalSelected) * 100))
            : 0;

    return (
        <>
            <Head title="Kelola Galeri Foto Kegiatan" />

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

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950/60 dark:text-[#FFA07A]">
                            <Images className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#111827] dark:text-white">
                                Galeri Foto Kegiatan Sekolah
                            </h1>
                            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                Unggah dan kelola dokumentasi foto kegiatan sekolah. Setiap foto otomatis dikompresi agar hemat ruang hardisk server.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="primary"
                        onClick={openCreateModal}
                        className="rounded-xl px-4 text-xs font-bold shadow-sm"
                    >
                        <Plus className="mr-1.5 size-4" />
                        Tambah Galeri Kegiatan
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Album Kegiatan</span>
                        <div className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{stats.total_albums}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Ditampilkan di Publik</span>
                        <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.published_albums}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Total Foto Tersimpan</span>
                        <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">{stats.total_photos} Foto</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400">
                            <HardDrive className="size-3.5" />
                            Kapasitas Disk Terpakai
                        </span>
                        <div className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">
                            {stats.total_size_formatted}
                        </div>
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
                            placeholder="Cari judul kegiatan atau keterangan..."
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
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="all">Semua Status</option>
                            <option value="published">Terbit</option>
                            <option value="draft">Sembunyikan (Draf)</option>
                        </select>

                        <Button type="button" variant="secondary" onClick={handleApplyFilters} className="rounded-xl text-xs font-bold">
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

                {/* Gallery Grid */}
                {galleries.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white p-14 text-center dark:border-gray-800 dark:bg-[#18122B]">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35] dark:bg-orange-950/40">
                            <Images className="size-8" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                            Belum Ada Galeri Foto Kegiatan
                        </h3>
                        <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
                            Tambahkan foto dokumentasi kegiatan sekolah. Sistem otomatis memperkecil ukuran file foto agar hemat penyimpanan.
                        </p>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={openCreateModal}
                            className="mt-4 rounded-xl text-xs font-bold"
                        >
                            <Plus className="mr-1.5 size-4" />
                            Unggah Foto Kegiatan Pertama
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {galleries.data.map((item) => {
                            const photoCount = item.images_urls?.length || (item.image_url ? 1 : 0);
                            return (
                                <div
                                    key={item.id}
                                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary,#FF6B35)] hover:shadow-md dark:border-gray-800 dark:bg-[#18122B]"
                                >
                                    <div
                                        onClick={() => {
                                            setPreviewActiveIdx(0);
                                            setPreviewGallery(item);
                                        }}
                                        className="relative h-48 w-full cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-900"
                                    >
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

                                        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                                            <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-extrabold text-[#FF6B35] shadow-xs backdrop-blur-md dark:bg-gray-900/90 dark:text-[#FFA07A]">
                                                {item.category}
                                            </span>
                                            {!item.is_published && (
                                                <span className="rounded-full bg-amber-500/95 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                                    Draf
                                                </span>
                                            )}
                                        </div>

                                        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                                            <span className="flex items-center gap-1 rounded-lg bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                                                <Images className="size-3" />
                                                {photoCount} Foto
                                            </span>
                                            <span className="rounded-lg bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                                                {item.formatted_size}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col p-4">
                                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="size-3" />
                                                {item.formatted_date}
                                            </span>
                                            <span>Oleh: {item.author?.name || 'Admin'}</span>
                                        </div>

                                        <h3 className="mt-1.5 line-clamp-1 text-sm font-extrabold text-gray-900 dark:text-white">
                                            {item.title}
                                        </h3>

                                        {item.description && (
                                            <p className="mt-1 line-clamp-2 flex-1 text-xs text-gray-500 dark:text-gray-400">
                                                {item.description}
                                            </p>
                                        )}

                                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPreviewActiveIdx(0);
                                                    setPreviewGallery(item);
                                                }}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-[#FF6B35] dark:text-gray-300"
                                            >
                                                <Eye className="size-3.5" />
                                                Lihat Foto
                                            </button>

                                            <div className="flex items-center gap-1.5">
                                                <WhatsAppShareButton type="gallery" item={item} variant="icon" size="xs" />
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(item)}
                                                    className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400"
                                                    title="Edit Galeri"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingGallery(item)}
                                                    className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:bg-red-50 dark:border-gray-700 dark:text-red-400"
                                                    title="Hapus Galeri"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {galleries.last_page > 1 && (
                    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs text-gray-500">
                            Halaman {galleries.current_page} dari {galleries.last_page} (Total {galleries.total} album)
                        </span>
                        <div className="flex items-center gap-1">
                            {galleries.links.map((link, idx) => (
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

            {/* MODAL: Tambah / Edit Galeri Kegiatan */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-[#18122B]">
                        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                    <Images className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                                        {editingGallery ? 'Edit Galeri Kegiatan' : 'Tambah Galeri Foto Kegiatan'}
                                    </h3>
                                    <p className="text-[11px] text-gray-500">
                                        Foto otomatis diperkecil (maks. 1280px, kompresi pintar) agar hemat hardisk server.
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
                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-1">
                                    Judul Kegiatan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    placeholder="Contoh: Kegiatan Pramuka & Perkemahan Sabtu Minggu"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                                {form.errors.title && <p className="mt-1 text-xs text-red-500">{form.errors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-1">
                                        Kategori Kegiatan <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        list="gallery-categories-list"
                                        required
                                        value={form.data.category}
                                        onChange={(e) => form.setData('category', e.target.value)}
                                        placeholder="Pilih atau ketik kategori..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <datalist id="gallery-categories-list">
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-1">
                                        Tanggal Kegiatan
                                    </label>
                                    <input
                                        type="date"
                                        value={form.data.activity_date}
                                        onChange={(e) => form.setData('activity_date', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-1">
                                    Deskripsi Singkat Kegiatan
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="Tuliskan keterangan singkat mengenai dokumentasi kegiatan ini..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 text-xs font-medium focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            {/* Upload & Automatic Compression Section */}
                            <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 p-4 dark:border-orange-900/50 dark:bg-orange-950/20 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <span className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                                            <Sparkles className="size-3.5 text-[#FF6B35]" />
                                            Foto Dokumentasi Kegiatan (Auto-Compress)
                                        </span>
                                        <p className="text-[11px] text-gray-500">
                                            Bisa pilih banyak foto sekaligus. Ukuran file otomatis diperkecil hingga ~80% sebelum disimpan.
                                        </p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/jpg"
                                        multiple
                                        onChange={handleSelectPhotos}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isCompressing}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="rounded-xl border-[#FF6B35] text-xs font-bold text-[#FF6B35] hover:bg-orange-50 shrink-0"
                                    >
                                        <UploadCloud className="mr-1.5 size-4" />
                                        {isCompressing ? 'Mengompresi Foto...' : '+ Pilih Foto Kegiatan'}
                                    </Button>
                                </div>

                                {/* Compression savings badge */}
                                {newImages.length > 0 && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
                                        <span>
                                            Kompresi Aktif: {formatBytes(totalOriginalSelected)} → {formatBytes(totalCompressedSelected)}
                                        </span>
                                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white">
                                            Hemat {savedPercent}% Ruang Server
                                        </span>
                                    </div>
                                )}

                                {/* Existing + New Photos Grid */}
                                {(existingImages.length > 0 || newImages.length > 0) && (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
                                        {existingImages.map((img, idx) => (
                                            <div
                                                key={img.path}
                                                className="group relative aspect-4/3 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700"
                                            >
                                                <img src={img.url} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                                                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                    Tersimpan
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExistingImage(img.path)}
                                                    className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-700"
                                                    title="Hapus foto ini"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}

                                        {newImages.map((img) => (
                                            <div
                                                key={img.id}
                                                className="group relative aspect-4/3 overflow-hidden rounded-xl border-2 border-emerald-400 bg-white dark:border-emerald-700"
                                            >
                                                <img src={img.base64} alt={img.name} className="h-full w-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/75 px-1.5 py-1 text-[9px] font-bold text-white flex items-center justify-between">
                                                    <span className="line-clamp-1">{formatBytes(img.compressedSize)}</span>
                                                    <span className="text-emerald-300">Ter-kompres</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveNewImage(img.id)}
                                                    className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-700"
                                                    title="Batal unggah foto ini"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2.5 pt-1">
                                <input
                                    type="checkbox"
                                    id="gallery-is-published"
                                    checked={form.data.is_published}
                                    onChange={(e) => form.setData('is_published', e.target.checked)}
                                    className="size-4 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                                />
                                <label htmlFor="gallery-is-published" className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                    Tampilkan langsung di halaman Galeri Publik
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
                                    disabled={form.processing || isCompressing || (existingImages.length === 0 && newImages.length === 0)}
                                    className="rounded-xl px-5 text-xs font-bold shadow-sm"
                                >
                                    {isCompressing
                                        ? 'Mengompresi Foto...'
                                        : form.processing
                                        ? 'Menyimpan...'
                                        : editingGallery
                                        ? 'Simpan Perubahan'
                                        : 'Unggah & Simpan Galeri'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Lightbox Preview */}
            {previewGallery && (() => {
                const allPhotos =
                    previewGallery.images_urls && previewGallery.images_urls.length > 0
                        ? previewGallery.images_urls
                        : previewGallery.image_url
                        ? [previewGallery.image_url]
                        : [];
                const currentPhoto = allPhotos[previewActiveIdx] || allPhotos[0];

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                        <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#18122B]">
                            <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-orange-100 px-3 py-0.5 text-xs font-bold text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                        {previewGallery.category}
                                    </span>
                                    <span className="text-xs text-gray-400">{previewGallery.formatted_date}</span>
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                        Total ukuran: {previewGallery.formatted_size}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <WhatsAppShareButton type="gallery" item={previewGallery} variant="button" size="xs" />
                                    <button
                                        type="button"
                                        onClick={() => setPreviewGallery(null)}
                                        className="flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {currentPhoto && (
                                    <div className="relative overflow-hidden rounded-2xl bg-black/5 dark:bg-black/40">
                                        <img
                                            src={currentPhoto}
                                            alt={previewGallery.title}
                                            className="mx-auto max-h-[55vh] w-full object-contain"
                                        />
                                        {allPhotos.length > 1 && (
                                            <>
                                                <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-bold text-white">
                                                    {previewActiveIdx + 1} / {allPhotos.length} Foto
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPreviewActiveIdx((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))
                                                    }
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                                >
                                                    <ChevronLeft className="size-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPreviewActiveIdx((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))
                                                    }
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                                >
                                                    <ChevronRight className="size-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {allPhotos.length > 1 && (
                                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                                        {allPhotos.map((url, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setPreviewActiveIdx(idx)}
                                                className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                                                    previewActiveIdx === idx
                                                        ? 'border-[#FF6B35] ring-2 ring-orange-200'
                                                        : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                            >
                                                <img src={url} alt={`Thumb ${idx + 1}`} className="size-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex-1">
                                        <h2 className="text-lg font-black text-gray-900 dark:text-white">{previewGallery.title}</h2>
                                        {previewGallery.description && (
                                            <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                                                {previewGallery.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="shrink-0">
                                        <WhatsAppShareButton type="gallery" item={previewGallery} variant="button" size="sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* MODAL: Konfirmasi Hapus */}
            {deletingGallery && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#18122B]">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                            <Trash2 className="size-6" />
                        </div>
                        <h3 className="mt-4 text-base font-black text-gray-900 dark:text-white">
                            Hapus Album Galeri Ini?
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 leading-relaxed dark:text-gray-400">
                            Album <strong className="text-gray-800 dark:text-gray-200">"{deletingGallery.title}"</strong> beserta seluruh file fotonya ({deletingGallery.formatted_size}) akan dihapus permanen dari penyimpanan server.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setDeletingGallery(null)}
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
                                Ya, Hapus Galeri
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

GalleryManagement.layout = {
    breadcrumbs,
};

