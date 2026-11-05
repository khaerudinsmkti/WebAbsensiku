import { useState, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Award,
    Building2,
    CheckCircle2,
    Eye,
    Globe,
    ImageIcon,
    Layers,
    Save,
    Sparkles,
    Target,
    UploadCloud,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

interface SchoolProfileData {
    name?: string;
    school_motto?: string | null;
    accreditation?: string | null;
    profile_description?: string | null;
    vision?: string | null;
    mission?: string | null;
    profile_image_url?: string | null;
    address?: string | null;
    city?: string | null;
    principal_name?: string | null;
}

interface SchoolProfilePageProps {
    profile: SchoolProfileData;
    school_name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profil Sekolah',
        href: '/manage/school-profile',
    },
];

export default function SchoolProfileEdit({ profile, school_name }: SchoolProfilePageProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(profile.profile_image_url || null);

    const form = useForm<{
        school_motto: string;
        accreditation: string;
        profile_description: string;
        vision: string;
        mission: string;
        profile_image: File | null;
        remove_image: boolean;
    }>({
        school_motto: profile.school_motto || '',
        accreditation: profile.accreditation || 'Akreditasi A (Unggul)',
        profile_description: profile.profile_description || '',
        vision: profile.vision || '',
        mission: profile.mission || '',
        profile_image: null,
        remove_image: false,
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        form.setData((prev) => ({
            ...prev,
            profile_image: file,
            remove_image: false,
        }));

        const reader = new FileReader();
        reader.onload = (ev) => {
            setImagePreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        form.setData((prev) => ({
            ...prev,
            profile_image: null,
            remove_image: true,
        }));
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/manage/school-profile', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    // Parse missions for preview
    const missionItems = form.data.mission
        ? form.data.mission
              .split('\n')
              .map((line) => line.replace(/^[\d+.-]\s*/, '').trim())
              .filter((line) => line.length > 0)
        : [];

    return (
        <>
            <Head title="Kelola Profil & Visi Misi" />

            <div className="min-h-screen bg-[#F8FAFC] pb-16 text-[#1E293B] dark:bg-[#0F172A] dark:text-[#E2E8F0]">
                {/* Header Sub-bar */}
                <div className="border-b border-[#E2E8F0] bg-white px-4 py-5 shadow-xs sm:px-6 lg:px-8 dark:border-[#1E293B] dark:bg-[#1E293B]/90">
                    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                <Building2 className="size-3.5" />
                                Informasi Identitas & Arah Kebijakan
                            </div>
                            <h1 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl dark:text-white">
                                Kelola Profil & Visi Misi Sekolah
                            </h1>
                            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Perbarui profil singkat, visi, misi, dan slogan sekolah yang tampil di menu Profil publik.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200"
                            >
                                <a href="/profil" target="_blank" rel="noreferrer">
                                    <Eye className="mr-1.5 size-3.5" />
                                    Lihat di Web Publik
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Form */}
                <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                            <span>{flash.success}</span>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200">
                            <AlertCircle className="size-5 shrink-0 text-rose-600" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        {/* Left: Input Form */}
                        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-7">
                            {/* Card 1: Identitas & Slogan */}
                            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm dark:border-[#1E293B] dark:bg-[#1E293B] space-y-4">
                                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-orange-300">
                                        <Award className="size-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-gray-900 dark:text-white">
                                            Slogan & Akreditasi
                                        </h2>
                                        <p className="text-xs text-gray-500">Motto resmi dan status akreditasi institusi.</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                        Slogan / Motto Sekolah
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.school_motto}
                                        onChange={(e) => form.setData('school_motto', e.target.value)}
                                        placeholder="Contoh: Membentuk Generasi Berkarakter, Cerdas, dan Berprestasi"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {form.errors.school_motto && (
                                        <p className="mt-1 text-xs text-rose-500">{form.errors.school_motto}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                        Status Akreditasi
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.accreditation}
                                        onChange={(e) => form.setData('accreditation', e.target.value)}
                                        placeholder="Contoh: Akreditasi A (Unggul)"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {form.errors.accreditation && (
                                        <p className="mt-1 text-xs text-rose-500">{form.errors.accreditation}</p>
                                    )}
                                </div>
                            </div>

                            {/* Card 2: Foto / Banner Profil Sekolah */}
                            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm dark:border-[#1E293B] dark:bg-[#1E293B] space-y-4">
                                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex size-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                                        <ImageIcon className="size-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-gray-900 dark:text-white">
                                            Foto / Ilustrasi Profil Sekolah
                                        </h2>
                                        <p className="text-xs text-gray-500">Foto gedung atau kegiatan sekolah (opsional, maks 5 MB).</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {imagePreview ? (
                                        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                                            <img
                                                src={imagePreview}
                                                alt="Preview Profil Sekolah"
                                                className="h-48 w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-xl bg-black/60 text-white hover:bg-rose-600 transition"
                                                title="Hapus gambar"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/60 p-6 text-center hover:border-[#FF6B35] hover:bg-orange-50/20 transition dark:border-gray-700 dark:bg-gray-800/40"
                                        >
                                            <UploadCloud className="size-8 text-[#FF6B35] mb-2" />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Klik untuk unggah foto profil sekolah
                                            </span>
                                            <span className="mt-1 text-[11px] text-gray-400">
                                                JPG, PNG, atau WEBP hingga 5 MB
                                            </span>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    {form.errors.profile_image && (
                                        <p className="text-xs text-rose-500">{form.errors.profile_image}</p>
                                    )}
                                </div>
                            </div>

                            {/* Card 3: Profil Singkat Sekolah */}
                            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm dark:border-[#1E293B] dark:bg-[#1E293B] space-y-4">
                                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                                        <Building2 className="size-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-gray-900 dark:text-white">
                                            Profil Singkat Sekolah <span className="text-rose-500">*</span>
                                        </h2>
                                        <p className="text-xs text-gray-500">Narasi pengantar, sejarah singkat, dan keunggulan institusi.</p>
                                    </div>
                                </div>

                                <div>
                                    <textarea
                                        rows={6}
                                        required
                                        value={form.data.profile_description}
                                        onChange={(e) => form.setData('profile_description', e.target.value)}
                                        placeholder="Ceritakan sejarah ringkas, semangat, dan pencapaian sekolah kami..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs font-semibold leading-relaxed focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {form.errors.profile_description && (
                                        <p className="mt-1 text-xs text-rose-500">{form.errors.profile_description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Card 4: Visi & Misi */}
                            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm dark:border-[#1E293B] dark:bg-[#1E293B] space-y-4">
                                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                                        <Target className="size-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-gray-900 dark:text-white">
                                            Visi & Misi Sekolah <span className="text-rose-500">*</span>
                                        </h2>
                                        <p className="text-xs text-gray-500">Arah strategis dan langkah operasional sekolah.</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                        Visi Sekolah <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={form.data.vision}
                                        onChange={(e) => form.setData('vision', e.target.value)}
                                        placeholder="Contoh: Terwujudnya peserta didik yang beriman, bertakwa, berakhlak mulia, cerdas, dan terampil..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs font-semibold leading-relaxed focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {form.errors.vision && (
                                        <p className="mt-1 text-xs text-rose-500">{form.errors.vision}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                        Misi Sekolah <span className="text-rose-500">*</span>
                                    </label>
                                    <p className="text-[11px] text-gray-400 mb-2">
                                        Tuliskan setiap poin misi dalam baris baru (bisa dengan nomor seperti: 1. Melaksanakan... atau tanda strip).
                                    </p>
                                    <textarea
                                        rows={7}
                                        required
                                        value={form.data.mission}
                                        onChange={(e) => form.setData('mission', e.target.value)}
                                        placeholder="1. Menanamkan nilai keimanan dan budi pekerti...&#10;2. Melaksanakan pembelajaran aktif berbasis teknologi...&#10;3. Mengembangkan potensi bakat dan minat siswa..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs font-semibold leading-relaxed focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {form.errors.mission && (
                                        <p className="mt-1 text-xs text-rose-500">{form.errors.mission}</p>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D26] px-8 py-3 text-xs font-black text-white shadow-md shadow-orange-500/25 hover:from-[#E85D26] hover:to-[#D94F1A]"
                                >
                                    <Save className="mr-1.5 size-4" />
                                    {form.processing ? 'Menyimpan Perubahan...' : 'Simpan Profil & Visi Misi'}
                                </Button>
                            </div>
                        </form>

                        {/* Right: Live Preview Panel */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="sticky top-24 rounded-3xl border border-[#E2E8F0] bg-gradient-to-br from-white via-orange-50/20 to-amber-50/20 p-6 shadow-sm dark:border-[#1E293B] dark:from-[#1E293B] dark:via-[#1E293B] dark:to-[#17112E]">
                                <div className="flex items-center justify-between pb-4 border-b border-orange-100/80 dark:border-gray-800">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="size-4 text-[#FF6B35]" />
                                        <span className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                                            Pratinjau Langsung
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-[#FF6B35] dark:bg-orange-950 dark:text-orange-300">
                                        Live Preview
                                    </span>
                                </div>

                                <div className="mt-5 space-y-5">
                                    {/* Preview Banner */}
                                    {imagePreview && (
                                        <div className="overflow-hidden rounded-2xl border border-orange-100 shadow-2xs dark:border-gray-800">
                                            <img
                                                src={imagePreview}
                                                alt="Banner Sekolah"
                                                className="h-32 w-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Slogan & Akreditasi */}
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-[#FF6B35] dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                            <Award className="size-3" />
                                            {form.data.accreditation || 'Akreditasi A'}
                                        </div>
                                        <h3 className="mt-2 text-base font-black text-gray-900 dark:text-white">
                                            {school_name}
                                        </h3>
                                        <p className="mt-1 text-xs italic text-[#FF6B35] font-semibold dark:text-orange-300">
                                            "{form.data.school_motto || 'Motto Sekolah'}"
                                        </p>
                                    </div>

                                    {/* Profil Singkat */}
                                    <div className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-800/60">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                                            Profil Singkat
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4">
                                            {form.data.profile_description || 'Deskripsi profil sekolah akan tampil di sini.'}
                                        </p>
                                    </div>

                                    {/* Visi */}
                                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
                                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-200">
                                            <Target className="size-3.5 text-amber-600" />
                                            <span>Visi Sekolah</span>
                                        </div>
                                        <p className="mt-1.5 text-xs italic text-amber-950 font-medium leading-relaxed dark:text-amber-100">
                                            "{form.data.vision || 'Visi sekolah akan tampil di sini.'}"
                                        </p>
                                    </div>

                                    {/* Misi Preview */}
                                    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 dark:text-emerald-200 mb-2">
                                            <Layers className="size-3.5 text-emerald-600" />
                                            <span>Misi Sekolah</span>
                                        </div>
                                        {missionItems.length > 0 ? (
                                            <ul className="space-y-1.5">
                                                {missionItems.slice(0, 3).map((item, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-xs text-emerald-950 dark:text-emerald-100">
                                                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="line-clamp-2">{item}</span>
                                                    </li>
                                                ))}
                                                {missionItems.length > 3 && (
                                                    <li className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 pl-6">
                                                        +{missionItems.length - 3} misi lainnya
                                                    </li>
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-gray-500 italic">Poin misi akan tampil di sini.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

