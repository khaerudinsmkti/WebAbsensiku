import { useState, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Eye,
    GraduationCap,
    ImageIcon,
    MessageSquareQuote,
    Save,
    Sparkles,
    UploadCloud,
    User,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

interface GreetingData {
    principal_name: string;
    principal_nip?: string | null;
    principal_greeting_title: string;
    principal_greeting?: string | null;
    principal_greeting_active: boolean;
    principal_photo_url?: string | null;
}

interface GreetingPageProps {
    greeting: GreetingData;
    school_name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sambutan Kepala Sekolah',
        href: '/publisher/principal-greeting',
    },
];

function compressImageFile(file: File, maxWidth = 1000, maxHeight = 1200, quality = 0.8): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const raw = event.target?.result as string;
            const img = new Image();
            img.src = raw;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

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
                    resolve(raw);
                    return;
                }
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(raw);
        };
        reader.onerror = () => resolve('');
    });
}

export default function PrincipalGreetingEdit({ greeting, school_name }: GreetingPageProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(greeting.principal_photo_url || null);

    const form = useForm<{
        principal_name: string;
        principal_nip: string;
        principal_greeting_title: string;
        principal_greeting: string;
        principal_greeting_active: boolean;
        principal_photo_base64: string | null;
        remove_photo: boolean;
    }>({
        principal_name: greeting.principal_name || '',
        principal_nip: greeting.principal_nip || '',
        principal_greeting_title: greeting.principal_greeting_title || 'Sambutan Hangat Kepala Sekolah',
        principal_greeting: greeting.principal_greeting || '',
        principal_greeting_active: greeting.principal_greeting_active,
        principal_photo_base64: null,
        remove_photo: false,
    });

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCompressing(true);
        try {
            const base64Data = await compressImageFile(file);
            setPhotoPreview(base64Data);
            form.setData((prev) => ({
                ...prev,
                principal_photo_base64: base64Data,
                remove_photo: false,
            }));
        } finally {
            setIsCompressing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemovePhoto = () => {
        setPhotoPreview(null);
        form.setData((prev) => ({
            ...prev,
            principal_photo_base64: null,
            remove_photo: true,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/publisher/principal-greeting', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Kelola Sambutan Kepala Sekolah" />

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

                {/* Page Title */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35] shadow-xs dark:bg-orange-950 dark:text-[#FFA07A]">
                            <MessageSquareQuote className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                                Sambutan Kepala Sekolah
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Atur foto profil, identitas, dan pesan sambutan kepala sekolah yang ditampilkan di portal publik.
                            </p>
                        </div>
                    </div>

                    <a
                        href="/#sambutan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] transition-colors shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                        <Eye className="size-4" />
                        <span>Lihat di Portal Publik</span>
                    </a>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Form Left Side */}
                    <div className="lg:col-span-7">
                        <form
                            onSubmit={handleSubmit}
                            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-[#18122B] space-y-5"
                        >
                            {/* Status Tampilkan Toggle */}
                            <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-4 dark:border-orange-900/40 dark:bg-orange-950/20">
                                <div>
                                    <span className="text-xs font-extrabold text-gray-900 dark:text-white block">
                                        Tampilkan di Dashboard Publik
                                    </span>
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                                        Sambutan akan tampil di atas Kabar & Warta Sekolah pada halaman utama.
                                    </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.data.principal_greeting_active}
                                        onChange={(e) => form.setData('principal_greeting_active', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B35] dark:bg-gray-700"></div>
                                </label>
                            </div>

                            {/* Upload Foto Kepala Sekolah */}
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4.5 dark:border-gray-700 dark:bg-gray-800/40">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Foto Resmi Kepala Sekolah
                                </label>
                                <p className="text-[11px] text-gray-400 mb-3">
                                    Format: JPG, PNG, atau WEBP. Disarankan foto portrait formal berlatar belakang rapi.
                                </p>

                                <div className="flex items-center gap-5">
                                    {photoPreview ? (
                                        <div className="relative shrink-0">
                                            <img
                                                src={photoPreview}
                                                alt="Foto Kepala Sekolah"
                                                className="size-24 rounded-2xl object-cover border-2 border-orange-200 shadow-sm dark:border-gray-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemovePhoto}
                                                className="absolute -top-1.5 -right-1.5 flex size-5.5 items-center justify-center rounded-full bg-red-600 text-white shadow-sm hover:bg-red-700"
                                                title="Hapus foto"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800">
                                            <User className="size-10 text-gray-300 dark:text-gray-600" />
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                            id="principal-photo-upload"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isCompressing}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="rounded-xl border-gray-300 text-xs font-bold"
                                        >
                                            <UploadCloud className="mr-1.5 size-4 text-[#FF6B35]" />
                                            {isCompressing
                                                ? 'Mengompresi...'
                                                : photoPreview
                                                ? 'Ganti Foto'
                                                : 'Pilih Foto Kepala Sekolah'}
                                        </Button>
                                        <span className="block text-[11px] text-gray-400 mt-1">
                                            Foto otomatis dikompresi agar ringan dan tajam.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Nama & NIP */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Nama Lengkap & Gelar <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.principal_name}
                                        onChange={(e) => form.setData('principal_name', e.target.value)}
                                        placeholder="Contoh: Drs. H. Mulyadi, M.Pd."
                                        required
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {form.errors.principal_name && (
                                        <p className="mt-1 text-xs text-red-500">{form.errors.principal_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        NIP (Nomor Induk Pegawai)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.principal_nip}
                                        onChange={(e) => form.setData('principal_nip', e.target.value)}
                                        placeholder="Contoh: 197205121998031004"
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {form.errors.principal_nip && (
                                        <p className="mt-1 text-xs text-red-500">{form.errors.principal_nip}</p>
                                    )}
                                </div>
                            </div>

                            {/* Judul Sambutan */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Judul / Tema Sambutan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.data.principal_greeting_title}
                                    onChange={(e) => form.setData('principal_greeting_title', e.target.value)}
                                    placeholder="Contoh: Membangun Karakter, Meraih Prestasi Bersama"
                                    required
                                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                                {form.errors.principal_greeting_title && (
                                    <p className="mt-1 text-xs text-red-500">{form.errors.principal_greeting_title}</p>
                                )}
                            </div>

                            {/* Isi Sambutan */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Pesan & Teks Sambutan <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={8}
                                    value={form.data.principal_greeting}
                                    onChange={(e) => form.setData('principal_greeting', e.target.value)}
                                    placeholder="Tuliskan pesan pembuka, visi pendidikan, dan sambutan hangat kepada para siswa, guru, dan orang tua..."
                                    required
                                    className="w-full rounded-xl border border-gray-200 p-3.5 text-xs leading-relaxed focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                                {form.errors.principal_greeting && (
                                    <p className="mt-1 text-xs text-red-500">{form.errors.principal_greeting}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={form.processing || isCompressing}
                                    className="rounded-xl px-6 py-2.5 text-xs font-bold shadow-md shadow-[#FF6B35]/25"
                                >
                                    <Save className="mr-1.5 size-4" />
                                    {form.processing ? 'Menyimpan...' : 'Simpan Perubahan Sambutan'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Live Preview Right Side */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-[#FF6B35]" />
                            <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Pratinjau Tampilan di Dashboard Publik
                            </span>
                        </div>

                        {/* Live Preview Card */}
                        <div className="overflow-hidden rounded-3xl border-2 border-orange-200/80 bg-gradient-to-br from-white via-orange-50/40 to-amber-50/30 p-6 shadow-sm dark:border-orange-950/60 dark:bg-gradient-to-br dark:from-[#18122B] dark:to-gray-900">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                    Pesan Pimpinan
                                </span>
                                {!form.data.principal_greeting_active && (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                                        Nonaktif di Publik
                                    </span>
                                )}
                            </div>

                            <h3 className="mt-3 text-lg font-black text-gray-900 dark:text-white leading-snug">
                                {form.data.principal_greeting_title || 'Sambutan Hangat Kepala Sekolah'}
                            </h3>

                            <div className="mt-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                <div className="relative shrink-0">
                                    {photoPreview ? (
                                        <img
                                            src={photoPreview}
                                            alt={form.data.principal_name}
                                            className="size-24 rounded-2xl object-cover border-2 border-white shadow-md dark:border-gray-700"
                                        />
                                    ) : (
                                        <div className="flex size-24 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35] border-2 border-white shadow-sm dark:bg-orange-950">
                                            <User className="size-10" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 text-center sm:text-left">
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                                        {form.data.principal_name || 'Nama Kepala Sekolah'}
                                    </h4>
                                    <span className="text-[11px] font-semibold text-[#FF6B35] block mt-0.5">
                                        Kepala {school_name}
                                    </span>
                                    {form.data.principal_nip && (
                                        <span className="text-[10px] text-gray-400 block mt-0.5">
                                            NIP. {form.data.principal_nip}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 border-t border-orange-100 pt-3 dark:border-gray-800">
                                <p className="text-xs text-gray-600 leading-relaxed dark:text-gray-300 line-clamp-6 italic">
                                    "{form.data.principal_greeting || 'Belum ada pesan sambutan yang ditulis...'}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

PrincipalGreetingEdit.layout = {
    breadcrumbs,
};

