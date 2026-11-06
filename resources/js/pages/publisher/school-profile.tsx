import { useState, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Award,
    Building2,
    CheckCircle2,
    Compass,
    Eye,
    GraduationCap,
    HeartHandshake,
    ImageIcon,
    Layers,
    LayoutTemplate,
    Plus,
    RotateCcw,
    Save,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    Trash2,
    UploadCloud,
    Users,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

export interface ValuePillarItem {
    title: string;
    description: string;
}

interface SchoolProfileData {
    name?: string;
    school_motto?: string | null;
    accreditation?: string | null;
    profile_description?: string | null;
    vision?: string | null;
    mission?: string | null;
    profile_image_url?: string | null;
    hero_badge?: string | null;
    hero_title?: string | null;
    hero_highlight?: string | null;
    hero_description?: string | null;
    hero_image_url?: string | null;
    hero_pillars?: ValuePillarItem[] | null;
    core_values?: ValuePillarItem[] | null;
    address?: string | null;
    city?: string | null;
    principal_name?: string | null;
}

interface SchoolProfilePageProps {
    profile: SchoolProfileData;
    school_name: string;
}

const DEFAULT_HERO_PILLARS: ValuePillarItem[] = [
    {
        title: 'Pendidikan Karakter',
        description: 'Membina akhlak mulia, kemandirian, empati, dan budi pekerti luhur sejak dini.',
    },
    {
        title: 'Belajar Aktif & Ceria',
        description: 'Pembelajaran kontekstual yang menyenangkan dan menumbuhkan daya nalar kritis.',
    },
    {
        title: 'Wadah Prestasi Siswa',
        description: 'Mendukung minat seni, olahraga, sains, serta kejuaraan akademik dan non-akademik.',
    },
    {
        title: 'Sinergi Orang Tua',
        description: 'Komunikasi transparan dan kemitraan hangat antara sekolah dan keluarga.',
    },
];

const DEFAULT_CORE_VALUES: ValuePillarItem[] = [
    {
        title: 'Budi Pekerti Luhur',
        description: 'Membiasakan 5S (Senyum, Salam, Sapa, Sopan, Santun) serta integritas dalam bersikap.',
    },
    {
        title: 'Cerdas & Terampil',
        description: 'Mengasah literasi, numerasi, dan keterampilan berpikir kritis menghadapi tantangan era modern.',
    },
    {
        title: 'Gotong Royong',
        description: 'Membangun semangat empati, kerja sama kelompok, serta kepedulian terhadap sesama dan lingkungan.',
    },
    {
        title: 'Melek Digital',
        description: 'Pemanfaatan teknologi edukasi yang ramah anak, bijak, dan aman untuk memperluas wawasan dunia.',
    },
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profil Sekolah',
        href: '/manage/school-profile',
    },
];

export default function SchoolProfileEdit({ profile, school_name }: SchoolProfilePageProps) {
    const { flash, errors = {} } = usePage<{
        flash?: { success?: string; error?: string };
        errors?: Record<string, string>;
    }>().props;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const heroFileInputRef = useRef<HTMLInputElement>(null);

    const [imagePreview, setImagePreview] = useState<string | null>(profile.profile_image_url || null);
    const [heroImagePreview, setHeroImagePreview] = useState<string | null>(profile.hero_image_url || null);
    const [processing, setProcessing] = useState(false);

    const [schoolMotto, setSchoolMotto] = useState(profile.school_motto || '');
    const [accreditation, setAccreditation] = useState(profile.accreditation || 'Akreditasi A (Unggul)');
    const [profileDescription, setProfileDescription] = useState(profile.profile_description || '');
    const [vision, setVision] = useState(profile.vision || '');
    const [mission, setMission] = useState(profile.mission || '');
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [removeImage, setRemoveImage] = useState(false);

    // Hero Banner States
    const [heroBadge, setHeroBadge] = useState(
        profile.hero_badge || `Selamat Datang di Portal Resmi ${school_name}`,
    );
    const [heroTitle, setHeroTitle] = useState(profile.hero_title || 'Mewujudkan Generasi Cerdas,');
    const [heroHighlight, setHeroHighlight] = useState(
        profile.hero_highlight || 'Kreatif, Ceria & Berakhlak Mulia',
    );
    const [heroDescription, setHeroDescription] = useState(
        profile.hero_description ||
            `Selamat datang di pusat informasi dan warta sekolah resmi ${school_name}. Kami berdedikasi membangun lingkungan belajar yang ramah anak, berbudaya positif, dan menginspirasi setiap siswa untuk berkembang menjadi pribadi berprestasi.`,
    );
    const [heroImage, setHeroImage] = useState<File | null>(null);
    const [removeHeroImage, setRemoveHeroImage] = useState(false);
    const [heroPillars, setHeroPillars] = useState<ValuePillarItem[]>(
        profile.hero_pillars && profile.hero_pillars.length > 0
            ? profile.hero_pillars
            : DEFAULT_HERO_PILLARS,
    );

    // Nilai-Nilai Utama States
    const [coreValues, setCoreValues] = useState<ValuePillarItem[]>(
        profile.core_values && profile.core_values.length > 0
            ? profile.core_values
            : DEFAULT_CORE_VALUES,
    );

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProfileImage(file);
        setRemoveImage(false);

        const reader = new FileReader();
        reader.onload = (ev) => {
            setImagePreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setProfileImage(null);
        setRemoveImage(true);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setHeroImage(file);
        setRemoveHeroImage(false);

        const reader = new FileReader();
        reader.onload = (ev) => {
            setHeroImagePreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveHeroImage = () => {
        setHeroImage(null);
        setRemoveHeroImage(true);
        setHeroImagePreview(null);
        if (heroFileInputRef.current) {
            heroFileInputRef.current.value = '';
        }
    };

    const handleCoreValueChange = (index: number, field: 'title' | 'description', value: string) => {
        setCoreValues((prev) =>
            prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
        );
    };

    const handleAddCoreValue = () => {
        if (coreValues.length >= 8) return;
        setCoreValues((prev) => [...prev, { title: '', description: '' }]);
    };

    const handleRemoveCoreValue = (index: number) => {
        if (coreValues.length <= 1) return;
        setCoreValues((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleHeroPillarChange = (index: number, field: 'title' | 'description', value: string) => {
        setHeroPillars((prev) =>
            prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.post(
            '/manage/school-profile',
            {
                school_motto: schoolMotto,
                accreditation,
                profile_description: profileDescription,
                vision,
                mission,
                profile_image: profileImage,
                remove_image: removeImage,
                hero_badge: heroBadge,
                hero_title: heroTitle,
                hero_highlight: heroHighlight,
                hero_description: heroDescription,
                hero_image: heroImage,
                remove_hero_image: removeHeroImage,
                hero_pillars: JSON.stringify(heroPillars),
                core_values: JSON.stringify(coreValues),
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    // Parse missions for preview
    const missionItems = mission
        ? mission
              .split('\n')
              .map((line) => line.replace(/^[\d+.-]\s*/, '').trim())
              .filter((line) => line.length > 0)
        : [];

    const coreValueIcons = [HeartHandshake, GraduationCap, Users, Compass, ShieldCheck, Star, Award, Sparkles];

    return (
        <>
            <Head title="Kelola Profil, Nilai Utama & Hero Banner" />

            <div className="min-h-screen bg-[#F8FAFC] pb-16 text-[#1E293B] dark:bg-[#0F172A] dark:text-[#E2E8F0]">
                {/* Header Sub-bar */}
                <div className="border-b border-[#E2E8F0] bg-white px-4 py-5 shadow-xs sm:px-6 lg:px-8 dark:border-[#1E293B] dark:bg-[#1E293B]/90">
                    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                <Building2 className="size-3.5" />
                                Informasi Identitas, Hero Banner & Nilai Utama
                            </div>
                            <h1 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl dark:text-white">
                                Kelola Profil, Nilai-Nilai Utama & Hero Banner
                            </h1>
                            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Perbarui tampilan Hero Banner di beranda publik, profil singkat, visi-misi, serta Nilai-Nilai Utama sekolah.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200"
                            >
                                <a href="/" target="_blank" rel="noreferrer">
                                    <Eye className="mr-1.5 size-3.5 text-[#FF6B35]" />
                                    Lihat Beranda Publik
                                </a>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200"
                            >
                                <a href="/profil" target="_blank" rel="noreferrer">
                                    <Eye className="mr-1.5 size-3.5" />
                                    Lihat Profil Publik
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
                            {/* Card 0: Hero Banner Beranda Publik */}
                            <div
                                id="hero-banner"
                                className="rounded-3xl border-2 border-orange-200/80 bg-white p-6 shadow-sm dark:border-orange-900/50 dark:bg-[#1E293B] space-y-4"
                            >
                                <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-orange-300">
                                            <LayoutTemplate className="size-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-gray-900 dark:text-white">
                                                Hero Banner Beranda Publik
                                            </h2>
                                            <p className="text-xs text-gray-500">
                                                Atur judul utama, teks sorotan, deskripsi, gambar banner, dan 4 kartu pilar di halaman depan.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHeroBadge(`Selamat Datang di Portal Resmi ${school_name}`);
                                            setHeroTitle('Mewujudkan Generasi Cerdas,');
                                            setHeroHighlight('Kreatif, Ceria & Berakhlak Mulia');
                                            setHeroDescription(
                                                `Selamat datang di pusat informasi dan warta sekolah resmi ${school_name}. Kami berdedikasi membangun lingkungan belajar yang ramah anak, berbudaya positif, dan menginspirasi setiap siswa untuk berkembang menjadi pribadi berprestasi.`,
                                            );
                                            setHeroPillars(DEFAULT_HERO_PILLARS);
                                        }}
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                                        title="Kembalikan teks default Hero Banner"
                                    >
                                        <RotateCcw className="size-3" />
                                        Reset Default
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                        Teks Lencana (Badge Atas)
                                    </label>
                                    <input
                                        type="text"
                                        value={heroBadge}
                                        onChange={(e) => setHeroBadge(e.target.value)}
                                        placeholder={`Selamat Datang di Portal Resmi ${school_name}`}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {errors.hero_badge && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.hero_badge}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                            Judul Utama (Baris 1) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={heroTitle}
                                            onChange={(e) => setHeroTitle(e.target.value)}
                                            placeholder="Mewujudkan Generasi Cerdas,"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                        {errors.hero_title && (
                                            <p className="mt-1 text-xs text-rose-500">{errors.hero_title}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                            Teks Sorotan (Warna Gradasi) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={heroHighlight}
                                            onChange={(e) => setHeroHighlight(e.target.value)}
                                            placeholder="Kreatif, Ceria & Berakhlak Mulia"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                        {errors.hero_highlight && (
                                            <p className="mt-1 text-xs text-rose-500">{errors.hero_highlight}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                        Deskripsi / Sub-judul Hero Banner <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={heroDescription}
                                        onChange={(e) => setHeroDescription(e.target.value)}
                                        placeholder="Tuliskan deskripsi sambutan singkat pada Hero Banner..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs font-semibold leading-relaxed focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {errors.hero_description && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.hero_description}</p>
                                    )}
                                </div>

                                {/* Optional Hero Banner Image */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                        Gambar / Foto Banner Beranda (Opsional)
                                    </label>
                                    {heroImagePreview ? (
                                        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                                            <img
                                                src={heroImagePreview}
                                                alt="Preview Hero Banner"
                                                className="h-44 w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveHeroImage}
                                                className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-xl bg-black/60 text-white hover:bg-rose-600 transition"
                                                title="Hapus gambar hero"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => heroFileInputRef.current?.click()}
                                            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/60 p-5 text-center hover:border-[#FF6B35] hover:bg-orange-50/20 transition dark:border-gray-700 dark:bg-gray-800/40"
                                        >
                                            <UploadCloud className="size-7 text-[#FF6B35] mb-1.5" />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Klik untuk unggah gambar Hero Banner (Opsional)
                                            </span>
                                            <span className="mt-0.5 text-[11px] text-gray-400">
                                                JPG, PNG, atau WEBP hingga 5 MB
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        ref={heroFileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleHeroImageChange}
                                        className="hidden"
                                    />
                                    {errors.hero_image && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.hero_image}</p>
                                    )}
                                </div>

                                {/* 4 Pilar Keunggulan di Hero Banner */}
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">
                                        4 Kartu Pilar Keunggulan di Bawah Hero Banner
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {heroPillars.map((pillar, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3 space-y-2 dark:border-gray-700 dark:bg-gray-800/50"
                                            >
                                                <div className="text-[11px] font-extrabold text-[#FF6B35]">
                                                    Pilar #{idx + 1}
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={pillar.title}
                                                    onChange={(e) =>
                                                        handleHeroPillarChange(idx, 'title', e.target.value)
                                                    }
                                                    placeholder="Judul Pilar"
                                                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                />
                                                <textarea
                                                    rows={2}
                                                    required
                                                    value={pillar.description}
                                                    onChange={(e) =>
                                                        handleHeroPillarChange(idx, 'description', e.target.value)
                                                    }
                                                    placeholder="Deskripsi singkat pilar..."
                                                    className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs leading-snug focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

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
                                        value={schoolMotto}
                                        onChange={(e) => setSchoolMotto(e.target.value)}
                                        placeholder="Contoh: Membentuk Generasi Berkarakter, Cerdas, dan Berprestasi"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {errors.school_motto && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.school_motto}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                        Status Akreditasi
                                    </label>
                                    <input
                                        type="text"
                                        value={accreditation}
                                        onChange={(e) => setAccreditation(e.target.value)}
                                        placeholder="Contoh: Akreditasi A (Unggul)"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {errors.accreditation && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.accreditation}</p>
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
                                        <p className="text-xs text-gray-500">Foto gedung atau kegiatan sekolah pada halaman Profil (opsional, maks 5 MB).</p>
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
                                    {errors.profile_image && (
                                        <p className="text-xs text-rose-500">{errors.profile_image}</p>
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
                                        value={profileDescription}
                                        onChange={(e) => setProfileDescription(e.target.value)}
                                        placeholder="Ceritakan sejarah ringkas, semangat, dan pencapaian sekolah kami..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs font-semibold leading-relaxed focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {errors.profile_description && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.profile_description}</p>
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
                                        value={vision}
                                        onChange={(e) => setVision(e.target.value)}
                                        placeholder="Contoh: Terwujudnya peserta didik yang beriman, bertakwa, berakhlak mulia, cerdas, dan terampil..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs font-semibold leading-relaxed focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {errors.vision && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.vision}</p>
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
                                        value={mission}
                                        onChange={(e) => setMission(e.target.value)}
                                        placeholder="1. Menanamkan nilai keimanan dan budi pekerti...&#10;2. Melaksanakan pembelajaran aktif berbasis teknologi...&#10;3. Mengembangkan potensi bakat dan minat siswa..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs font-semibold leading-relaxed focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {errors.mission && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.mission}</p>
                                    )}
                                </div>
                            </div>

                            {/* Card 5: Nilai-Nilai Utama (Karakter & Budaya Sekolah) */}
                            <div
                                id="nilai-utama"
                                className="rounded-3xl border-2 border-purple-200/80 bg-white p-6 shadow-sm dark:border-purple-900/50 dark:bg-[#1E293B] space-y-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                                            <ShieldCheck className="size-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-gray-900 dark:text-white">
                                                Nilai-Nilai Utama Sekolah <span className="text-rose-500">*</span>
                                            </h2>
                                            <p className="text-xs text-gray-500">
                                                Nilai dasar karakter & budaya sekolah yang ditampilkan pada halaman Profil Sekolah.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCoreValues(DEFAULT_CORE_VALUES)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                                            title="Kembalikan Nilai-Nilai Utama ke default"
                                        >
                                            <RotateCcw className="size-3" />
                                            Reset
                                        </button>
                                        {coreValues.length < 8 && (
                                            <button
                                                type="button"
                                                onClick={handleAddCoreValue}
                                                className="inline-flex items-center gap-1 rounded-lg bg-orange-50 border border-orange-200 px-2.5 py-1 text-[11px] font-bold text-[#FF6B35] hover:bg-orange-100 dark:bg-orange-950/50 dark:border-orange-800"
                                            >
                                                <Plus className="size-3.5" />
                                                Tambah Nilai
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {coreValues.map((valItem, idx) => {
                                        const ValIcon = coreValueIcons[idx % coreValueIcons.length];
                                        return (
                                            <div
                                                key={idx}
                                                className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-2.5 dark:border-gray-700 dark:bg-gray-800/50"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#FF6B35]">
                                                        <ValIcon className="size-3.5" />
                                                        <span>Nilai Utama #{idx + 1}</span>
                                                    </div>
                                                    {coreValues.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveCoreValue(idx)}
                                                            className="text-gray-400 hover:text-rose-600 transition-colors"
                                                            title="Hapus nilai ini"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                                                        Judul Nilai <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={valItem.title}
                                                        onChange={(e) =>
                                                            handleCoreValueChange(idx, 'title', e.target.value)
                                                        }
                                                        placeholder="Contoh: Budi Pekerti Luhur"
                                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                                                        Deskripsi Nilai <span className="text-rose-500">*</span>
                                                    </label>
                                                    <textarea
                                                        rows={3}
                                                        required
                                                        value={valItem.description}
                                                        onChange={(e) =>
                                                            handleCoreValueChange(idx, 'description', e.target.value)
                                                        }
                                                        placeholder="Jelaskan penerapan nilai utama ini..."
                                                        className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs leading-relaxed focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D26] px-8 py-3 text-xs font-black text-white shadow-md shadow-orange-500/25 hover:from-[#E85D26] hover:to-[#D94F1A]"
                                >
                                    <Save className="mr-1.5 size-4" />
                                    {processing ? 'Menyimpan Perubahan...' : 'Simpan Semua Perubahan'}
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
                                    {/* Hero Banner Preview */}
                                    <div className="rounded-2xl border border-orange-200/80 bg-white/90 p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900/70 space-y-2">
                                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF6B35]">
                                            Preview Hero Banner Beranda
                                        </div>
                                        <div className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-[#FF6B35] border border-orange-200/60 dark:bg-orange-950/60 dark:border-orange-800">
                                            <Sparkles className="size-2.5" />
                                            <span className="truncate max-w-[240px]">{heroBadge}</span>
                                        </div>
                                        <div className="text-sm font-black text-gray-900 dark:text-white leading-snug">
                                            {heroTitle}{' '}
                                            <span className="bg-gradient-to-r from-[#FF6B35] via-[#F59E0B] to-[#10B981] bg-clip-text text-transparent">
                                                {heroHighlight}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                            {heroDescription}
                                        </p>
                                        {heroImagePreview && (
                                            <img
                                                src={heroImagePreview}
                                                alt="Hero Preview"
                                                className="mt-2 h-24 w-full rounded-xl object-cover border border-orange-100 dark:border-gray-800"
                                            />
                                        )}
                                    </div>

                                    {/* Preview Banner Profil */}
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
                                            {accreditation || 'Akreditasi A'}
                                        </div>
                                        <h3 className="mt-2 text-base font-black text-gray-900 dark:text-white">
                                            {school_name}
                                        </h3>
                                        <p className="mt-1 text-xs italic text-[#FF6B35] font-semibold dark:text-orange-300">
                                            "{schoolMotto || 'Motto Sekolah'}"
                                        </p>
                                    </div>

                                    {/* Visi */}
                                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
                                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-200">
                                            <Target className="size-3.5 text-amber-600" />
                                            <span>Visi Sekolah</span>
                                        </div>
                                        <p className="mt-1.5 text-xs italic text-amber-950 font-medium leading-relaxed dark:text-amber-100">
                                            "{vision || 'Visi sekolah akan tampil di sini.'}"
                                        </p>
                                    </div>

                                    {/* Nilai-Nilai Utama Preview */}
                                    <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-4 dark:border-purple-900/50 dark:bg-purple-950/30 space-y-2.5">
                                        <div className="flex items-center gap-1.5 text-xs font-black text-purple-900 dark:text-purple-200">
                                            <ShieldCheck className="size-3.5 text-purple-600" />
                                            <span>Nilai-Nilai Utama ({coreValues.length})</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {coreValues.map((cv, idx) => (
                                                <div
                                                    key={idx}
                                                    className="rounded-xl bg-white/90 p-2.5 border border-purple-100 dark:bg-gray-900/80 dark:border-gray-800"
                                                >
                                                    <div className="text-[11px] font-black text-gray-900 dark:text-white truncate">
                                                        {cv.title || `Nilai #${idx + 1}`}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                                                        {cv.description || '-'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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

SchoolProfileEdit.layout = {
    breadcrumbs,
};
