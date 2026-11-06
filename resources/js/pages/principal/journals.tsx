import { useState, useRef } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    BookOpenCheck,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileDown,
    FileSpreadsheet,
    HardDrive,
    ImageIcon,
    Images,
    Loader2,
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

interface JournalItem {
    id: number;
    activity_date: string;
    activity_name: string;
    activity_content: string;
    image_path?: string | null;
    image_url?: string | null;
    images?: string[] | null;
    images_urls?: string[];
    file_size?: number;
    formatted_date?: string;
    formatted_size?: string;
    author?: {
        id: number;
        name: string;
        nip?: string | null;
    } | null;
    created_at?: string;
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

interface PrincipalJournalProps {
    journals: {
        data: JournalItem[];
    } & PaginationMeta;
    stats: {
        total_journals: number;
        this_month_journals: number;
        total_photos: number;
        total_size_formatted: string;
    };
    filters: {
        search: string;
        filter_type: string;
        month: number;
        year: number;
        date: string;
        start_date: string;
        end_date: string;
    };
    periodLabel: string;
    monthNames: Record<number, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Jurnal Kepala Sekolah',
        href: '/principal/journals',
    },
];

interface CompressedImageResult {
    file: File;
    base64: string;
    originalSize: number;
    compressedSize: number;
}

/**
 * Compress image file proportionally on client-side (NO CROP, preserves original aspect ratio)
 * so it saves server disk space.
 */
function compressImageProportionally(file: File, maxDimension = 1280, quality = 0.72): Promise<CompressedImageResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const rawBase64 = (event.target?.result as string) || '';
            const img = new Image();
            img.src = rawBase64;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Proportional scale down only (NO CROP)
                if (width > maxDimension || height > maxDimension) {
                    if (width >= height) {
                        height = Math.max(1, Math.round((height * maxDimension) / width));
                        width = maxDimension;
                    } else {
                        width = Math.max(1, Math.round((width * maxDimension) / height));
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve({
                        file,
                        base64: rawBase64,
                        originalSize: file.size,
                        compressedSize: file.size,
                    });
                    return;
                }

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

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
                            originalSize: file.size,
                            compressedSize: blobSize,
                        });
                    },
                    'image/jpeg',
                    quality,
                );
            };
            img.onerror = () =>
                resolve({
                    file,
                    base64: rawBase64,
                    originalSize: file.size,
                    compressedSize: file.size,
                });
        };
        reader.onerror = () =>
            resolve({
                file,
                base64: '',
                originalSize: file.size,
                compressedSize: file.size,
            });
    });
}

function formatFileSize(bytes: number): string {
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

export default function PrincipalJournalsPage({
    journals,
    stats,
    filters,
    periodLabel,
    monthNames,
}: PrincipalJournalProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    // Filter state
    const [search, setSearch] = useState(filters.search || '');
    const [filterType, setFilterType] = useState(filters.filter_type || 'monthly');
    const [month, setMonth] = useState<number>(filters.month || new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(filters.year || new Date().getFullYear());
    const [date, setDate] = useState(filters.date || new Date().toISOString().slice(0, 10));
    const [startDate, setStartDate] = useState(filters.start_date || new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(filters.end_date || new Date().toISOString().slice(0, 10));

    // Modal state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingJournal, setEditingJournal] = useState<JournalItem | null>(null);
    const [deletingJournal, setDeletingJournal] = useState<JournalItem | null>(null);
    const [previewJournal, setPreviewJournal] = useState<JournalItem | null>(null);
    const [previewPhotoIdx, setPreviewPhotoIdx] = useState(0);

    // Image upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [existingImages, setExistingImages] = useState<Array<{ path: string; url: string }>>([]);
    const [newImages, setNewImages] = useState<
        Array<{
            id: string;
            base64: string;
            originalSize: number;
            compressedSize: number;
        }>
    >([]);

    const form = useForm<{
        activity_date: string;
        activity_name: string;
        activity_content: string;
        existing_images: string[];
        images_base64: string[];
    }>({
        activity_date: new Date().toISOString().slice(0, 10),
        activity_name: '',
        activity_content: '',
        existing_images: [],
        images_base64: [],
    });

    const buildFilterParams = (overrideType?: string) => {
        const activeType = overrideType !== undefined ? overrideType : filterType;
        return {
            search: search || undefined,
            filter_type: activeType,
            month: activeType === 'monthly' ? month : undefined,
            year: activeType === 'monthly' ? year : undefined,
            date: activeType === 'date' ? date : undefined,
            start_date: activeType === 'range' ? startDate : undefined,
            end_date: activeType === 'range' ? endDate : undefined,
        };
    };

    const handleApplyFilters = (overrideType?: string) => {
        router.get('/principal/journals', buildFilterParams(overrideType), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilters = () => {
        const now = new Date();
        const curMonth = now.getMonth() + 1;
        const curYear = now.getFullYear();
        const todayStr = now.toISOString().slice(0, 10);

        setSearch('');
        setFilterType('monthly');
        setMonth(curMonth);
        setYear(curYear);
        setDate(todayStr);
        router.get(
            '/principal/journals',
            { filter_type: 'monthly', month: curMonth, year: curYear },
            { preserveState: true, preserveScroll: true },
        );
    };

    const getExportUrl = (type: 'pdf' | 'excel') => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        params.set('filter_type', filterType);
        if (filterType === 'monthly') {
            params.set('month', String(month));
            params.set('year', String(year));
        } else if (filterType === 'date') {
            params.set('date', date);
        } else if (filterType === 'range') {
            params.set('start_date', startDate);
            params.set('end_date', endDate);
        }

        const base =
            type === 'pdf'
                ? '/principal/journals/export/pdf'
                : '/principal/journals/export/excel';
        return `${base}?${params.toString()}`;
    };

    const openCreateModal = () => {
        setEditingJournal(null);
        setExistingImages([]);
        setNewImages([]);
        form.reset();
        form.setData({
            activity_date: new Date().toISOString().slice(0, 10),
            activity_name: '',
            activity_content: '',
            existing_images: [],
            images_base64: [],
        });
        setIsFormModalOpen(true);
    };

    const openEditModal = (item: JournalItem) => {
        setEditingJournal(item);
        const curImages: Array<{ path: string; url: string }> = [];
        if (item.images && item.images.length > 0) {
            item.images.forEach((p, idx) => {
                curImages.push({
                    path: p,
                    url: item.images_urls?.[idx] || `/storage/${p}`,
                });
            });
        } else if (item.image_path) {
            curImages.push({
                path: item.image_path,
                url: item.image_url || `/storage/${item.image_path}`,
            });
        }

        setExistingImages(curImages);
        setNewImages([]);
        form.setData({
            activity_date: item.activity_date ? item.activity_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
            activity_name: item.activity_name,
            activity_content: item.activity_content,
            existing_images: curImages.map((i) => i.path),
            images_base64: [],
        });
        setIsFormModalOpen(true);
    };

    const handlePhotosSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsCompressing(true);
        try {
            const added: Array<{
                id: string;
                base64: string;
                originalSize: number;
                compressedSize: number;
            }> = [];

            for (const f of Array.from(files)) {
                const res = await compressImageProportionally(f);
                if (res.base64) {
                    added.push({
                        id: Math.random().toString(36).substring(2, 9),
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

    const handleSaveJournal = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...form.data,
            existing_images: existingImages.map((i) => i.path),
            images_base64: newImages.map((i) => i.base64),
        };

        if (editingJournal) {
            router.post(`/principal/journals/${editingJournal.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setEditingJournal(null);
                },
            });
        } else {
            router.post('/principal/journals', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    form.reset();
                    setExistingImages([]);
                    setNewImages([]);
                },
            });
        }
    };

    const handleDeleteJournal = () => {
        if (!deletingJournal) return;
        router.delete(`/principal/journals/${deletingJournal.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingJournal(null),
        });
    };

    const yearOptions = Array.from({ length: 7 }, (_, idx) => new Date().getFullYear() - 3 + idx);

    return (
        <>
            <Head title="Jurnal Kepala Sekolah" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Flash Messages */}
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

                {/* Header & Action Buttons */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35] shadow-xs dark:bg-orange-950/60 dark:text-[#FFA07A]">
                            <BookOpenCheck className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#111827] dark:text-white">
                                Jurnal Kegiatan Kepala Sekolah
                            </h1>
                            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                Catatan agenda harian, kegiatan kedinasan, supervisi, dan dokumentasi Kepala Sekolah ({periodLabel}).
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <a
                            href={getExportUrl('pdf')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-extrabold text-rose-700 shadow-xs transition-colors hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
                        >
                            <FileDown className="size-4 text-rose-600" />
                            <span>Export PDF</span>
                        </a>
                        <a
                            href={getExportUrl('excel')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-extrabold text-emerald-700 shadow-xs transition-colors hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                        >
                            <FileSpreadsheet className="size-4 text-emerald-600" />
                            <span>Export Excel</span>
                        </a>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={openCreateModal}
                            className="rounded-xl px-4 py-2 text-xs font-bold shadow-sm"
                        >
                            <Plus className="mr-1.5 size-4" />
                            Isi Jurnal Baru
                        </Button>
                    </div>
                </div>

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                            Total Seluruh Jurnal
                        </span>
                        <div className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                            {stats.total_journals}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Kegiatan Bulan Ini
                        </span>
                        <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {stats.this_month_journals}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            Total Foto Dokumentasi
                        </span>
                        <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
                            {stats.total_photos} Foto
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <HardDrive className="size-3.5" />
                            Ukuran Disk (Terkompresi)
                        </span>
                        <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
                            {stats.total_size_formatted}
                        </div>
                    </div>
                </div>

                {/* Filters Bar: Mode Filter (Bulanan / Tanggal / Rentang / Semua) & Pencarian */}
                <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-gray-800">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="mr-1 text-xs font-extrabold text-gray-500 uppercase">
                                Filter Periode:
                            </span>
                            {[
                                { id: 'monthly', label: 'Filter Bulanan' },
                                { id: 'date', label: 'Filter Tanggal' },
                                { id: 'range', label: 'Rentang Tanggal' },
                                { id: 'all', label: 'Semua Data' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                        setFilterType(tab.id);
                                        if (tab.id === 'all') {
                                            handleApplyFilters('all');
                                        }
                                    }}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                        filterType === tab.id
                                            ? 'bg-[#FF6B35] text-white shadow-xs'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <span className="rounded-xl bg-orange-50 px-3 py-1 text-xs font-extrabold text-[#FF6B35] dark:bg-orange-950/50 dark:text-[#FFA07A]">
                            Periode Aktif: {periodLabel}
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Specific Period Inputs */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {filterType === 'monthly' && (
                                <>
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-xs font-bold text-gray-500">Bulan:</label>
                                        <select
                                            value={month}
                                            onChange={(e) => setMonth(Number(e.target.value))}
                                            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        >
                                            {Object.entries(monthNames).map(([mNum, mLabel]) => (
                                                <option key={mNum} value={mNum}>
                                                    {mLabel}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-xs font-bold text-gray-500">Tahun:</label>
                                        <select
                                            value={year}
                                            onChange={(e) => setYear(Number(e.target.value))}
                                            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        >
                                            {yearOptions.map((y) => (
                                                <option key={y} value={y}>
                                                    {y}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {filterType === 'date' && (
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-gray-500">Pilih Tanggal:</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            )}

                            {filterType === 'range' && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-xs font-bold text-gray-500">Dari:</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-xs font-bold text-gray-500">Sampai:</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search Input & Apply Button */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                    placeholder="Cari kegiatan atau isi jurnal..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-4 py-2 text-xs font-medium focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleApplyFilters()}
                                className="rounded-xl text-xs font-bold"
                            >
                                Terapkan Filter
                            </Button>

                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="rounded-xl px-2.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Journal Table (Default 10 per page) */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                    {journals.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-14 text-center">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35] dark:bg-orange-950/40">
                                <BookOpenCheck className="size-7" />
                            </div>
                            <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                                Belum Ada Data Jurnal Kepala Sekolah
                            </h3>
                            <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
                                Belum ada catatan jurnal kegiatan pada periode ({periodLabel}). Klik tombol di bawah untuk mulai mengisi jurnal.
                            </p>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={openCreateModal}
                                className="mt-4 rounded-xl text-xs font-bold"
                            >
                                <Plus className="mr-1.5 size-4" />
                                Isi Jurnal Kegiatan Baru
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                                        <th className="w-12 px-4 py-3.5 text-center">No</th>
                                        <th className="w-44 px-4 py-3.5">Hari / Tanggal</th>
                                        <th className="w-64 px-4 py-3.5">Kegiatan yang Diikuti</th>
                                        <th className="px-4 py-3.5">Isi Kegiatan</th>
                                        <th className="w-44 px-4 py-3.5">Dokumentasi</th>
                                        <th className="w-28 px-4 py-3.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {journals.data.map((item, idx) => {
                                        const rowNum = (journals.from || 1) + idx;
                                        const photos =
                                            item.images_urls && item.images_urls.length > 0
                                                ? item.images_urls
                                                : item.image_url
                                                ? [item.image_url]
                                                : [];

                                        return (
                                            <tr
                                                key={item.id}
                                                className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                                            >
                                                <td className="px-4 py-3.5 text-center font-extrabold text-gray-500">
                                                    {rowNum}
                                                </td>
                                                <td className="px-4 py-3.5 align-top">
                                                    <div className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                                                        <Calendar className="size-3.5 text-[#FF6B35]" />
                                                        <span>{item.formatted_date}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 align-top">
                                                    <h4 className="font-extrabold text-gray-900 dark:text-white leading-snug">
                                                        {item.activity_name}
                                                    </h4>
                                                </td>
                                                <td className="px-4 py-3.5 align-top">
                                                    <p className="line-clamp-3 whitespace-pre-line text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {item.activity_content}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5 align-top">
                                                    {photos.length > 0 ? (
                                                        <div
                                                            onClick={() => {
                                                                setPreviewPhotoIdx(0);
                                                                setPreviewJournal(item);
                                                            }}
                                                            className="group inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/80 p-1.5 pr-3 transition-all hover:border-[#FF6B35] dark:border-gray-700 dark:bg-gray-800"
                                                        >
                                                            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-white dark:bg-gray-900">
                                                                <img
                                                                    src={photos[0]}
                                                                    alt={item.activity_name}
                                                                    className="h-full w-full object-contain"
                                                                />
                                                            </div>
                                                            <div>
                                                                <span className="block text-[11px] font-extrabold text-gray-900 group-hover:text-[#FF6B35] dark:text-white">
                                                                    {photos.length} Foto
                                                                </span>
                                                                <span className="text-[10px] text-gray-400">
                                                                    {item.formatted_size}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-400">
                                                            Tanpa foto
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 align-top text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setPreviewPhotoIdx(0);
                                                                setPreviewJournal(item);
                                                            }}
                                                            className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300"
                                                            title="Lihat Detail & Dokumentasi"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(item)}
                                                            className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400"
                                                            title="Edit Jurnal"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingJournal(item)}
                                                            className="flex size-7 items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-gray-700 dark:text-red-400"
                                                            title="Hapus Jurnal"
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

                    {/* Pagination Bar (Default 10 per halaman) */}
                    {journals.data.length > 0 && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/50 px-4 py-3 sm:flex-row dark:border-gray-800 dark:bg-gray-800/40">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Menampilkan {journals.from ?? 1} - {journals.to ?? journals.data.length} dari total {journals.total} jurnal (10 per halaman)
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                                {journals.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={!link.url || link.active}
                                        onClick={() =>
                                            link.url &&
                                            router.get(link.url, {}, { preserveState: true, preserveScroll: true })
                                        }
                                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-[#FF6B35] text-white'
                                                : link.url
                                                ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                                                : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: Tambah / Edit Jurnal Kepala Sekolah */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-[#18122B]">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                    <BookOpenCheck className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                                        {editingJournal ? 'Edit Jurnal Kepala Sekolah' : 'Isi Jurnal Kepala Sekolah Baru'}
                                    </h3>
                                    <span className="text-[11px] text-gray-400">
                                        Foto dokumentasi dikompresi otomatis tanpa memotong (tanpa crop) rasio asli foto.
                                    </span>
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

                        {/* Form Body */}
                        <form onSubmit={handleSaveJournal} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                                        Tanggal Kegiatan <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={form.data.activity_date}
                                        onChange={(e) => form.setData('activity_date', e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {form.errors.activity_date && (
                                        <p className="mt-1 text-xs text-red-500">{form.errors.activity_date}</p>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-1 block text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                                        Kegiatan yang Diikuti <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.data.activity_name}
                                        onChange={(e) => form.setData('activity_name', e.target.value)}
                                        placeholder="Contoh: Rapat Koordinasi MKKS / Supervisi Akademik Kelas VI"
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {form.errors.activity_name && (
                                        <p className="mt-1 text-xs text-red-500">{form.errors.activity_name}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                                    Isi Kegiatan / Uraian Lengkap <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={6}
                                    required
                                    value={form.data.activity_content}
                                    onChange={(e) => form.setData('activity_content', e.target.value)}
                                    placeholder="Tuliskan uraian pelaksanaan kegiatan, hasil rapat/supervisi, tindak lanjut, atau catatan penting lainnya..."
                                    className="w-full rounded-xl border border-gray-200 p-3 text-xs leading-relaxed focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                                {form.errors.activity_content && (
                                    <p className="mt-1 text-xs text-red-500">{form.errors.activity_content}</p>
                                )}
                            </div>

                            {/* Dokumentasi Foto (Compress Size Tanpa Crop) */}
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                                            Foto Dokumentasi Kegiatan
                                        </label>
                                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                            Ukuran file otomatis diperkecil (compress) untuk menghemat penyimpanan server, <strong>tanpa di-crop</strong> (utuh sesuai proporsi asli).
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-extrabold text-[#FF6B35] dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                        {existingImages.length + newImages.length} Foto
                                    </span>
                                </div>

                                {(existingImages.length > 0 || newImages.length > 0) && (
                                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {existingImages.map((img, idx) => (
                                            <div
                                                key={`exist-${img.path}`}
                                                className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 dark:border-gray-700 dark:bg-gray-900"
                                            >
                                                <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                                    <img
                                                        src={img.url}
                                                        alt={`Dokumentasi ${idx + 1}`}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <span className="mt-1 text-center text-[10px] font-bold text-gray-500">
                                                    Foto Tersimpan #{idx + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExistingImage(img.path)}
                                                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-700"
                                                    title="Hapus foto ini"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}

                                        {newImages.map((img, idx) => (
                                            <div
                                                key={`new-${img.id}`}
                                                className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-emerald-400/80 bg-white p-1.5 dark:border-emerald-600 dark:bg-gray-900"
                                            >
                                                <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                                    <img
                                                        src={img.base64}
                                                        alt={`Foto Baru ${idx + 1}`}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <div className="mt-1 flex items-center justify-between px-1 text-[10px]">
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatFileSize(img.compressedSize)}
                                                    </span>
                                                    <span className="text-gray-400 line-through">
                                                        {formatFileSize(img.originalSize)}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveNewImage(img.id)}
                                                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-700"
                                                    title="Hapus foto ini"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        multiple
                                        onChange={handlePhotosSelected}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isCompressing}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="rounded-xl border-gray-300 text-xs font-bold"
                                    >
                                        {isCompressing ? (
                                            <>
                                                <Loader2 className="mr-1.5 size-4 animate-spin text-[#FF6B35]" />
                                                Mengompresi Foto...
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud className="mr-1.5 size-4 text-[#FF6B35]" />
                                                {existingImages.length + newImages.length > 0
                                                    ? '+ Tambah Foto Dokumentasi'
                                                    : 'Pilih Foto Dokumentasi (Bisa Banyak)'}
                                            </>
                                        )}
                                    </Button>
                                    <span className="text-[11px] text-gray-400">
                                        Orientasi portrait maupun landscape tetap utuh (tidak terpotong).
                                    </span>
                                </div>
                            </div>

                            {/* Footer */}
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
                                        : editingJournal
                                        ? 'Simpan Perubahan'
                                        : 'Simpan Jurnal'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Detail Jurnal & Lightbox Dokumentasi Utuh (Tanpa Crop) */}
            {previewJournal && (() => {
                const photos =
                    previewJournal.images_urls && previewJournal.images_urls.length > 0
                        ? previewJournal.images_urls
                        : previewJournal.image_url
                        ? [previewJournal.image_url]
                        : [];
                const currentPhoto = photos[previewPhotoIdx] || photos[0];

                return (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                        onClick={() => setPreviewJournal(null)}
                    >
                        <div
                            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#18122B]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                        <Calendar className="size-3.5" />
                                        {previewJournal.formatted_date}
                                    </span>
                                    {previewJournal.formatted_size && (
                                        <span className="text-xs text-gray-400">
                                            ({previewJournal.formatted_size})
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPreviewJournal(null)}
                                    className="flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B35]">
                                        Kegiatan yang Diikuti
                                    </span>
                                    <h2 className="mt-0.5 text-xl font-black text-gray-900 dark:text-white">
                                        {previewJournal.activity_name}
                                    </h2>
                                </div>

                                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                                        Isi / Uraian Kegiatan
                                    </span>
                                    <p className="whitespace-pre-line text-xs sm:text-sm text-gray-700 leading-relaxed dark:text-gray-200">
                                        {previewJournal.activity_content}
                                    </p>
                                </div>

                                {photos.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-extrabold uppercase text-gray-500">
                                                Dokumentasi Kegiatan ({photos.length} Foto Utuh Tanpa Crop)
                                            </span>
                                        </div>

                                        <div className="relative flex min-h-64 max-h-[440px] w-full items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-950/90 p-2 dark:border-gray-800">
                                            <img
                                                src={currentPhoto}
                                                alt={previewJournal.activity_name}
                                                className="max-h-[420px] max-w-full object-contain"
                                            />
                                            {photos.length > 1 && (
                                                <>
                                                    <span className="absolute bottom-3 right-3 rounded-lg bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white">
                                                        {previewPhotoIdx + 1} / {photos.length}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPreviewPhotoIdx((prev) =>
                                                                prev > 0 ? prev - 1 : photos.length - 1,
                                                            )
                                                        }
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                                    >
                                                        <ChevronLeft className="size-5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPreviewPhotoIdx((prev) =>
                                                                prev < photos.length - 1 ? prev + 1 : 0,
                                                            )
                                                        }
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                                    >
                                                        <ChevronRight className="size-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {photos.length > 1 && (
                                            <div className="flex items-center gap-2 overflow-x-auto py-1">
                                                {photos.map((url, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setPreviewPhotoIdx(idx)}
                                                        className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-gray-900 p-0.5 transition-all ${
                                                            previewPhotoIdx === idx
                                                                ? 'border-[#FF6B35] ring-2 ring-orange-200'
                                                                : 'border-transparent opacity-60 hover:opacity-100'
                                                        }`}
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Thumb ${idx + 1}`}
                                                            className="h-full w-full object-contain"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-gray-100 p-4 dark:border-gray-800">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setPreviewJournal(null)}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* MODAL: Konfirmasi Hapus Jurnal */}
            {deletingJournal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#18122B]">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                            <Trash2 className="size-6" />
                        </div>
                        <h3 className="mt-4 text-base font-black text-gray-900 dark:text-white">
                            Hapus Jurnal Kepala Sekolah?
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            Jurnal kegiatan{' '}
                            <strong className="text-gray-800 dark:text-gray-200">
                                "{deletingJournal.activity_name}"
                            </strong>{' '}
                            ({deletingJournal.formatted_date}) beserta foto dokumentasinya akan dihapus permanen.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setDeletingJournal(null)}
                                className="rounded-xl text-xs font-bold"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteJournal}
                                className="rounded-xl text-xs font-bold"
                            >
                                Ya, Hapus Jurnal
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

PrincipalJournalsPage.layout = {
    breadcrumbs,
};

