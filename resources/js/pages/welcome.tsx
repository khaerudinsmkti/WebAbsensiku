import { useState, useRef, useMemo, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Calendar,
    CalendarCheck,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Eye,
    FileText,
    ImageIcon,
    Info,
    Newspaper,
    Paperclip,
    Plus,
    Search,
    Sparkles,
    Tag,
    UploadCloud,
    X,
    FileCheck,
    Images,
    BookOpen,
    Award,
    HeartHandshake,
    Smile,
    Star,
    GraduationCap,
    Quote,
    MessageSquareQuote,
    Sparkle,
    Phone,
    PhoneCall,
    Mail,
    MapPin,
    Send,
    CheckCircle2,
    MessageSquare,
    Instagram,
    Facebook,
    Youtube,
    ExternalLink,
    Loader2,
    LogIn,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/public-header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { dashboard, login } from '@/routes';
import type { NewsAttachment, NewsCategory, NewsItem } from '@/types/news';

interface SchoolProp {
    name?: string;
    logo_url?: string | null;
}

interface HeroPillarItem {
    title: string;
    description: string;
}

interface WelcomeProps {
    news?: NewsItem[];
    newsCategories?: NewsCategory[];
    totalNewsCount?: number;
    principalGreeting?: {
        name: string;
        nip?: string | null;
        title: string;
        content?: string | null;
        is_active: boolean;
        photo_url?: string | null;
    };
    heroBanner?: {
        badge?: string | null;
        title?: string | null;
        highlight?: string | null;
        description?: string | null;
        image_url?: string | null;
        pillars?: HeroPillarItem[] | null;
    };
    galleries?: Array<{
        id: number;
        title: string;
        category: string;
        description?: string | null;
        image_url?: string | null;
        images_urls?: string[];
        formatted_date?: string;
    }>;
    totalGalleriesCount?: number;
}

const DEFAULT_HERO_PILLARS: HeroPillarItem[] = [
    {
        title: 'Pendidikan Karakter',
        description:
            'Membina akhlak mulia, kemandirian, empati, dan budi pekerti luhur sejak dini.',
    },
    {
        title: 'Belajar Aktif & Ceria',
        description:
            'Pembelajaran kontekstual yang menyenangkan dan menumbuhkan daya nalar kritis.',
    },
    {
        title: 'Wadah Prestasi Siswa',
        description:
            'Mendukung minat seni, olahraga, sains, serta kejuaraan akademik dan non-akademik.',
    },
    {
        title: 'Sinergi Orang Tua',
        description:
            'Komunikasi transparan dan kemitraan hangat antara sekolah dan keluarga.',
    },
];

interface CompressedImageResult {
    file: File;
    base64: string;
    size: number;
}

function compressImageFile(file: File, maxWidth = 1200, maxHeight = 900, quality = 0.72): Promise<CompressedImageResult> {
    return new Promise((resolve) => {
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

export default function Welcome({ news = [], newsCategories = [], totalNewsCount, principalGreeting, heroBanner, galleries = [], totalGalleriesCount }: WelcomeProps) {
    const { auth, school } = usePage<{ auth: any; school?: SchoolProp }>().props;
    const schoolName = school?.name || 'AbsensiKu SD';
    const logoUrl = school?.logo_url;
    const isPublisher = auth?.user?.role === 'publisher';
    const isPublisherOrAdmin = auth?.user?.role === 'publisher' || auth?.user?.role === 'admin';
    const canManageGreeting = auth?.user?.role === 'publisher' || auth?.user?.role === 'admin' || auth?.user?.role === 'principal';

    // Hero Banner Edit Modal State (Available for Publisher, Admin & Principal)
    const [isHeroModalOpen, setIsHeroModalOpen] = useState<boolean>(false);
    const [heroSaving, setHeroSaving] = useState<boolean>(false);
    const heroImageRef = useRef<HTMLInputElement>(null);
    const [editHeroBadge, setEditHeroBadge] = useState<string>(
        heroBanner?.badge || `Selamat Datang di Portal Resmi ${schoolName}`,
    );
    const [editHeroTitle, setEditHeroTitle] = useState<string>(
        heroBanner?.title || 'Mewujudkan Generasi Cerdas,',
    );
    const [editHeroHighlight, setEditHeroHighlight] = useState<string>(
        heroBanner?.highlight || 'Kreatif, Ceria & Berakhlak Mulia',
    );
    const [editHeroDescription, setEditHeroDescription] = useState<string>(
        heroBanner?.description ||
            `Selamat datang di pusat informasi dan warta sekolah resmi ${schoolName}. Kami berdedikasi membangun lingkungan belajar yang ramah anak, berbudaya positif, dan menginspirasi setiap siswa untuk berkembang menjadi pribadi berprestasi.`,
    );
    const [editHeroImage, setEditHeroImage] = useState<File | null>(null);
    const [editHeroImagePreview, setEditHeroImagePreview] = useState<string | null>(
        heroBanner?.image_url || null,
    );
    const [removeHeroImage, setRemoveHeroImage] = useState<boolean>(false);
    const [editHeroPillars, setEditHeroPillars] = useState<HeroPillarItem[]>(
        heroBanner?.pillars && heroBanner.pillars.length > 0
            ? heroBanner.pillars
            : DEFAULT_HERO_PILLARS,
    );

    const handleHeroSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setHeroSaving(true);
        router.post(
            '/manage/hero-banner',
            {
                hero_badge: editHeroBadge,
                hero_title: editHeroTitle,
                hero_highlight: editHeroHighlight,
                hero_description: editHeroDescription,
                hero_image: editHeroImage,
                remove_hero_image: removeHeroImage,
                hero_pillars: JSON.stringify(editHeroPillars),
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsHeroModalOpen(false);
                },
                onFinish: () => setHeroSaving(false),
            },
        );
    };

    const heroPillarsList: HeroPillarItem[] =
        heroBanner?.pillars && heroBanner.pillars.length > 0
            ? heroBanner.pillars
            : DEFAULT_HERO_PILLARS;

    const heroPillarStyles = [
        {
            icon: Star,
            cardBorder: 'border-orange-100 hover:border-orange-300 dark:border-gray-800',
            iconBg: 'bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]',
        },
        {
            icon: BookOpen,
            cardBorder: 'border-teal-100 hover:border-teal-300 dark:border-gray-800',
            iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-300',
        },
        {
            icon: Award,
            cardBorder: 'border-amber-100 hover:border-amber-300 dark:border-gray-800',
            iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
        },
        {
            icon: HeartHandshake,
            cardBorder: 'border-rose-100 hover:border-rose-300 dark:border-gray-800',
            iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300',
        },
    ];

    // State for News on Public Dashboard
    const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('all');
    const [newsSearch, setNewsSearch] = useState<string>('');
    const [newsPage, setNewsPage] = useState<number>(1);
    const [newsPerPage, setNewsPerPage] = useState<number>(6);
    const [readingNews, setReadingNews] = useState<NewsItem | null>(null);
    const [readingActiveImageIdx, setReadingActiveImageIdx] = useState<number>(0);
    const [activeGallery, setActiveGallery] = useState<NonNullable<WelcomeProps['galleries']>[number] | null>(null);
    const [activeGalleryPhotoIdx, setActiveGalleryPhotoIdx] = useState<number>(0);
    const [galleryPage, setGalleryPage] = useState<number>(1);
    const [galleryPerPage, setGalleryPerPage] = useState<number>(6);
    const totalGalleryPages = Math.max(1, Math.ceil(galleries.length / galleryPerPage));
    const paginatedGalleries = useMemo(() => {
        return galleries.slice(
            (galleryPage - 1) * galleryPerPage,
            galleryPage * galleryPerPage,
        );
    }, [galleries, galleryPage, galleryPerPage]);
    const [newsViewCounts, setNewsViewCounts] = useState<Record<number, number>>({});
    const [isGreetingExpanded, setIsGreetingExpanded] = useState<boolean>(false);

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

    // Quick Add News Modal (Available for Publisher & Admin)
    const [isCreateNewsModalOpen, setIsCreateNewsModalOpen] = useState<boolean>(false);
    const [quickImages, setQuickImages] = useState<Array<{ id: string; file: File; base64: string }>>([]);
    const [quickAttachments, setQuickAttachments] = useState<Array<{ id: string; file: File; base64: string; name: string; size: number }>>([]);
    const [isCompressingImages, setIsCompressingImages] = useState<boolean>(false);
    const [isConvertingPdf, setIsConvertingPdf] = useState<boolean>(false);
    const [isFetchingQuickInstagram, setIsFetchingQuickInstagram] = useState<boolean>(false);
    const [lastFetchedQuickInstagramUrl, setLastFetchedQuickInstagramUrl] = useState<string>('');
    const [quickInstagramNotice, setQuickInstagramNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    const quickNewsForm = useForm<{
        title: string;
        category_id: string | number;
        excerpt: string;
        content: string;
        instagram_url: string;
        is_published: boolean;
        images_base64: string[];
        attachments_base64: string[];
        attachments_names: string[];
    }>({
        title: '',
        category_id: newsCategories[0]?.id || '',
        excerpt: '',
        content: '',
        instagram_url: '',
        is_published: true,
        images_base64: [],
        attachments_base64: [],
        attachments_names: [],
    });

    const handleFetchQuickInstagramPost = async (overrideUrl?: string) => {
        const url = (overrideUrl !== undefined ? overrideUrl : quickNewsForm.data.instagram_url).trim();
        if (!url) {
            setQuickInstagramNotice({
                type: 'error',
                text: 'Masukkan tautan (URL) postingan atau reel Instagram terlebih dahulu.',
            });
            return;
        }

        if (isFetchingQuickInstagram) return;

        setIsFetchingQuickInstagram(true);
        setQuickInstagramNotice(null);

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
                setQuickInstagramNotice({
                    type: 'error',
                    text: data.message || 'Gagal membaca tautan Instagram.',
                });
                return;
            }

            setLastFetchedQuickInstagramUrl(data.clean_url || url);

            quickNewsForm.setData((prev) => ({
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
                setQuickImages((prev) => {
                    const withoutOldIg = prev.filter((item) => !item.id.startsWith('ig-cover-'));
                    const updated = [addedImg, ...withoutOldIg];
                    quickNewsForm.setData('images_base64', updated.map((i) => i.base64));
                    return updated;
                });
            }

            if (data.fetched_automatically) {
                setQuickInstagramNotice({
                    type: 'success',
                    text: 'Judul, ringkasan, isi berita, dan foto sampul berhasil ditarik otomatis dari Instagram!',
                });
            } else {
                setQuickInstagramNotice({
                    type: 'info',
                    text: 'Tautan Embed Instagram berhasil dipasang! Silakan sesuaikan judul/caption atau foto sampul bila diperlukan.',
                });
            }
        } catch {
            setQuickInstagramNotice({
                type: 'error',
                text: 'Terjadi kesalahan saat menghubungi server untuk mengambil info Instagram.',
            });
        } finally {
            setIsFetchingQuickInstagram(false);
        }
    };

    const handleQuickInstagramUrlChange = (val: string) => {
        quickNewsForm.setData('instagram_url', val);
        const trimmed = val.trim();
        if (
            /instagram\.com\/(?:[^/]+\/)?(?:p|reel|tv)\/[A-Za-z0-9_-]+/i.test(trimmed) &&
            trimmed !== lastFetchedQuickInstagramUrl
        ) {
            setLastFetchedQuickInstagramUrl(trimmed);
            handleFetchQuickInstagramPost(trimmed);
        }
    };

    const handleQuickNewsSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payloadData = {
            ...quickNewsForm.data,
            images_base64: quickImages.map((i) => i.base64),
            attachments_base64: quickAttachments.map((a) => a.base64),
            attachments_names: quickAttachments.map((a) => a.name),
        };

        router.post('/news-management', payloadData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateNewsModalOpen(false);
                quickNewsForm.reset();
                setQuickImages([]);
                setQuickAttachments([]);
                setQuickInstagramNotice(null);
            },
        });
    };

    const handleQuickImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsCompressingImages(true);
        try {
            const fileList = Array.from(files);
            const compressedResults: Array<{ id: string; file: File; base64: string }> = [];

            for (const f of fileList) {
                const res = await compressImageFile(f);
                compressedResults.push({
                    id: Math.random().toString(36).substring(2, 9),
                    file: res.file,
                    base64: res.base64,
                });
            }

            setQuickImages((prev) => {
                const updated = [...prev, ...compressedResults];
                quickNewsForm.setData('images_base64', updated.map((i) => i.base64));
                return updated;
            });
        } finally {
            setIsCompressingImages(false);
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
        }
    };

    const handleRemoveQuickImage = (id: string) => {
        setQuickImages((prev) => {
            const updated = prev.filter((i) => i.id !== id);
            quickNewsForm.setData('images_base64', updated.map((i) => i.base64));
            return updated;
        });
    };

    const handleQuickAttachmentsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

            setQuickAttachments((prev) => {
                const updated = [...prev, ...addedAttachments];
                quickNewsForm.setData('attachments_base64', updated.map((a) => a.base64));
                quickNewsForm.setData('attachments_names', updated.map((a) => a.name));
                return updated;
            });
        } finally {
            setIsConvertingPdf(false);
            if (attachmentInputRef.current) {
                attachmentInputRef.current.value = '';
            }
        }
    };

    const handleRemoveQuickAttachment = (id: string) => {
        setQuickAttachments((prev) => {
            const updated = prev.filter((a) => a.id !== id);
            quickNewsForm.setData('attachments_base64', updated.map((a) => a.base64));
            quickNewsForm.setData('attachments_names', updated.map((a) => a.name));
            return updated;
        });
    };

    // Filtered news items
    const filteredNews = useMemo(() => {
        return news.filter((item) => {
            const matchesCategory =
                selectedNewsCategory === 'all' ||
                item.category_id?.toString() === selectedNewsCategory;
            const matchesSearch =
                !newsSearch ||
                item.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
                (item.excerpt && item.excerpt.toLowerCase().includes(newsSearch.toLowerCase())) ||
                item.content.toLowerCase().includes(newsSearch.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [news, selectedNewsCategory, newsSearch]);

    // News Pagination state (Default 9 per page)
    const totalNewsPages = Math.max(1, Math.ceil(filteredNews.length / newsPerPage));
    const paginatedNews = useMemo(() => {
        return filteredNews.slice(
            (newsPage - 1) * newsPerPage,
            newsPage * newsPerPage,
        );
    }, [filteredNews, newsPage, newsPerPage]);

    useEffect(() => {
        setNewsPage(1);
    }, [selectedNewsCategory, newsSearch, newsPerPage]);

    return (
        <>
            <Head title="Beranda" />
            <div className="flex min-h-screen flex-col bg-page-gradient text-[#1F2937] dark:text-neutral-100">
                <PublicHeader onOpenCreateNews={() => setIsCreateNewsModalOpen(true)} />

                {/* Hero Section */}
                <main className="flex-1 pb-20 md:pb-0">
                    <section className="relative overflow-hidden px-6 pt-12 pb-16 lg:px-12 lg:pt-16 lg:pb-24 hero-banner-wrapper">
                        {/* Modern Theme-Adaptive Ambient Mesh Background */}
                        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            {/* Top Central Aurora Beam */}
                            <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[850px] sm:w-[1100px] h-[550px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--brand-primary-light,#FFF0EB)_0%,transparent_70%)] opacity-90 blur-3xl dark:opacity-25" />

                            {/* Left Soft Floating Orb */}
                            <div className="absolute -top-16 -left-20 size-[480px] rounded-full bg-[var(--brand-primary,#FF6B35)]/12 blur-[100px] dark:bg-[var(--brand-primary,#FF6B35)]/15" />

                            {/* Right Complementary Orb */}
                            <div className="absolute top-1/4 -right-20 size-[480px] rounded-full bg-[var(--brand-primary-dark,#FF8C5A)]/10 blur-[100px] dark:bg-[var(--brand-primary-dark,#FF8C5A)]/15" />

                            {/* Subtle Modern Dot-Matrix Grid Texture */}
                            <div
                                className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
                                style={{
                                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                                    backgroundSize: '24px 24px',
                                }}
                            />
                        </div>

                        <div className="relative z-10 mx-auto max-w-5xl text-center">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary,#FF6B35)]/30 bg-[var(--brand-primary-light,#FFF0EB)] px-4 py-1.5 text-xs font-bold text-[var(--brand-primary,#FF6B35)] shadow-xs dark:border-[var(--brand-primary,#FF6B35)]/30 dark:bg-[var(--brand-primary,#FF6B35)]/15 dark:text-white">
                                    <Sparkles className="size-4" />
                                    {heroBanner?.badge || `Selamat Datang di Portal Resmi ${schoolName}`}
                                </div>

                                {canManageGreeting && (
                                    <button
                                        type="button"
                                        onClick={() => setIsHeroModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--brand-primary,#FF6B35)] bg-white/90 px-3.5 py-1.5 text-xs font-extrabold text-[var(--brand-primary,#FF6B35)] shadow-xs hover:bg-[var(--brand-primary-light,#FFF0EB)] transition-all dark:bg-gray-800 dark:hover:bg-gray-700"
                                    >
                                        <Sparkles className="size-3.5" />
                                        Kelola Hero Banner
                                    </button>
                                )}
                            </div>

                            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[#111827] sm:text-6xl dark:text-white leading-[1.18]">
                                {heroBanner?.title || 'Mewujudkan Generasi Cerdas,'}{' '}
                                <span className="hero-headline-gradient font-black">
                                    {heroBanner?.highlight || 'Kreatif, Ceria & Berakhlak Mulia'}
                                </span>
                            </h1>

                            <p className="mx-auto mt-6 max-w-2xl text-base text-[#6B7280] sm:text-lg dark:text-[#9CA3AF] leading-relaxed">
                                {heroBanner?.description ||
                                    `Selamat datang di pusat informasi dan warta sekolah resmi ${schoolName}. Kami berdedikasi membangun lingkungan belajar yang ramah anak, berbudaya positif, dan menginspirasi setiap siswa untuk berkembang menjadi pribadi berprestasi.`}
                            </p>

                            {heroBanner?.image_url && (
                                <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-3xl border-2 border-orange-100/80 shadow-xl dark:border-gray-800">
                                    <img
                                        src={heroBanner.image_url}
                                        alt={schoolName}
                                        className="max-h-[380px] w-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                                <Button
                                    asChild
                                    size="lg"
                                    variant="primary"
                                    className="rounded-2xl px-6 py-3 font-extrabold text-white shadow-brand hover:brightness-105 active:scale-95 transition-all duration-200"
                                >
                                    <Link href="/berita">
                                        <Newspaper className="mr-2 size-5" />
                                        <span>Lihat Warta & Berita</span>
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    size="lg"
                                    className="rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] px-6 py-3 font-black text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/30 hover:brightness-105 active:scale-95 transition-all duration-200 cursor-pointer"
                                >
                                    <a href="/kalender">
                                        <CalendarDays className="mr-2 size-5 text-white" />
                                        <span>Kalender Akademik</span>
                                    </a>
                                </Button>

                                {auth.user ? (
                                    <Button
                                        asChild
                                        size="lg"
                                        className="rounded-2xl bg-gradient-to-r from-[#20B2AA] to-[#4ECDC4] hover:from-[#179B94] hover:to-[#3DBDB4] px-6 py-3 font-black text-white shadow-md shadow-teal-500/25 ring-2 ring-teal-300/30 hover:brightness-105 active:scale-95 transition-all duration-200 cursor-pointer"
                                    >
                                        <Link href={auth.user?.role === 'publisher' ? '/news-management' : dashboard()}>
                                            <BarChart3 className="mr-2 size-5 text-white" />
                                            <span>{auth.user?.role === 'publisher' ? 'Panel Berita' : 'Buka Dashboard'}</span>
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        asChild
                                        size="lg"
                                        className="rounded-2xl bg-gradient-to-r from-[#20B2AA] to-[#4ECDC4] hover:from-[#179B94] hover:to-[#3DBDB4] px-6 py-3 font-black text-white shadow-md shadow-teal-500/25 ring-2 ring-teal-300/30 hover:brightness-105 active:scale-95 transition-all duration-200 cursor-pointer"
                                    >
                                        <Link href={login()}>
                                            <LogIn className="mr-2 size-5 text-white" />
                                            <span>Masuk Portal Guru & Staf</span>
                                        </Link>
                                    </Button>
                                )}
                            </div>

                            {/* 4 Pilar Keunggulan Sekolah Ceria & Modern */}
                            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                                {heroPillarsList.map((pillar, idx) => {
                                    const style = heroPillarStyles[idx % heroPillarStyles.length];
                                    const PillarIcon = style.icon;
                                    return (
                                        <div
                                            key={idx}
                                            className={`group rounded-2xl border bg-white/85 p-5 shadow-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-[#18122B]/80 ${style.cardBorder}`}
                                        >
                                            <div
                                                className={`flex size-11 items-center justify-center rounded-xl shadow-xs group-hover:scale-110 transition-transform ${style.iconBg}`}
                                            >
                                                <PillarIcon className="size-5.5" />
                                            </div>
                                            <h3 className="mt-3.5 text-sm font-black text-gray-900 dark:text-white">
                                                {pillar.title}
                                            </h3>
                                            <p className="mt-1 text-xs text-gray-500 leading-relaxed dark:text-gray-400">
                                                {pillar.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SECTION: Sambutan Kepala Sekolah (Publik) */}
                        {principalGreeting?.is_active && (principalGreeting?.content || principalGreeting?.name) && (
                            <div id="sambutan" className="relative z-10 mx-auto mt-16 max-w-6xl">
                                <div className="relative overflow-hidden rounded-3xl border border-[var(--brand-primary,#FF6B35)]/20 bg-gradient-to-br from-white/95 via-[var(--brand-primary-light,#FFF0EB)]/30 to-white/90 p-6 sm:p-10 shadow-xl shadow-[var(--brand-primary,#FF6B35)]/5 backdrop-blur-md dark:border-gray-800 dark:from-[#18122B]/90 dark:via-[#1e1738]/80 dark:to-[#18122B]/90">
                                    {/* Decorative subtle background elements */}
                                    <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-[var(--brand-primary,#FF6B35)]/10 blur-3xl" />
                                    <div className="pointer-events-none absolute -left-12 -bottom-12 size-64 rounded-full bg-[var(--brand-primary-dark,#FF8C5A)]/10 blur-3xl" />

                                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12">
                                        {/* Kolom Kiri: Foto Kepala Sekolah & Info */}
                                        <div className="flex w-full md:w-72 shrink-0 flex-col items-center text-center">
                                            <div className="relative group">
                                                {/* Halo Glow */}
                                                <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-[#FF6B35] to-[#FFA07A] opacity-30 blur-md group-hover:opacity-50 transition duration-300" />

                                                {/* Image Frame */}
                                                <div className="relative h-64 w-52 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md dark:border-gray-800 dark:bg-gray-800">
                                                    {principalGreeting?.photo_url ? (
                                                        <img
                                                            src={principalGreeting.photo_url}
                                                            alt={principalGreeting.name || 'Kepala Sekolah'}
                                                            className="h-full w-full object-cover object-top"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 p-4 text-orange-600 dark:from-gray-800 dark:to-gray-700 dark:text-orange-400">
                                                            <GraduationCap className="size-16 stroke-[1.5]" />
                                                            <span className="mt-2 text-xs font-bold text-gray-500 dark:text-gray-400">Foto Kepala Sekolah</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Lencana Jabatan */}
                                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] px-3.5 py-1 text-[11px] font-black tracking-wider text-white shadow-brand">
                                                    KEPALA SEKOLAH
                                                </div>
                                            </div>

                                            <div className="mt-6 w-full">
                                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                                    {principalGreeting?.name || 'Kepala Sekolah'}
                                                </h3>
                                                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-orange-100/70 px-2.5 py-1 text-[11px] font-bold text-[#FF6B35] dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                                    <Sparkles className="size-3" />
                                                    {schoolName}
                                                </div>
                                            </div>

                                            {/* Shortcut Edit Sambutan untuk Role Publisher, Admin & Kepala Sekolah */}
                                            {canManageGreeting && (
                                                <div className="mt-4 w-full">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full rounded-xl border-dashed border-[#FF6B35]/50 bg-white/60 text-xs font-bold text-[#FF6B35] hover:bg-orange-50 hover:border-[#FF6B35] dark:bg-gray-800/80 dark:hover:bg-gray-800"
                                                    >
                                                        <Link href="/publisher/principal-greeting">
                                                            <MessageSquareQuote className="mr-1.5 size-3.5" />
                                                            Kelola Sambutan
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Kolom Kanan: Pesan & Teks Sambutan */}
                                        <div className="flex-1 flex flex-col justify-between pt-2">
                                            <div>
                                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100/80 pb-3 dark:border-gray-800">
                                                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                                        <MessageSquareQuote className="size-3.5" />
                                                        Sambutan Pimpinan Sekolah
                                                    </div>
                                                    {canManageGreeting && (
                                                        <Link
                                                            href="/publisher/principal-greeting"
                                                            className="text-xs font-semibold text-gray-400 hover:text-[#FF6B35] transition-colors"
                                                        >
                                                            Ubah Konten &rarr;
                                                        </Link>
                                                    )}
                                                </div>

                                                <h2 className="mt-4 text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                                    {principalGreeting?.title || 'Sambutan Hangat Kepala Sekolah'}
                                                </h2>

                                                <div className="relative mt-4">
                                                    <Quote className="absolute -top-3 -left-3 size-10 text-orange-200/50 dark:text-orange-950/50 pointer-events-none -z-10" />
                                                    <div className="relative z-10 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-normal whitespace-pre-line space-y-2">
                                                        {principalGreeting?.content ? (
                                                            principalGreeting.content.length > 500 && !isGreetingExpanded ? (
                                                                <>
                                                                    <p>{principalGreeting.content.slice(0, 500)}...</p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setIsGreetingExpanded(true)}
                                                                        className="mt-2 inline-flex items-center gap-1 font-bold text-[#FF6B35] hover:underline"
                                                                    >
                                                                        Baca Selengkapnya
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <p>{principalGreeting.content}</p>
                                                                    {principalGreeting.content.length > 500 && isGreetingExpanded && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setIsGreetingExpanded(false)}
                                                                            className="mt-2 inline-flex items-center gap-1 font-bold text-[#FF6B35] hover:underline"
                                                                        >
                                                                            Tutup Sebagian
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )
                                                        ) : (
                                                            <p className="italic text-gray-400">
                                                                Selamat datang di portal resmi kami. Kami berkomitmen mewujudkan lingkungan belajar yang menyenangkan, aman, dan berdaya saing bagi seluruh putra-putri tercinta.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Salam Penutup */}
                                            <div className="mt-6 pt-4 border-t border-orange-100/60 dark:border-gray-800 flex items-center justify-between">
                                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                    Salam Hangat & Sukses Selalu,
                                                </div>
                                                <div className="flex items-center gap-1 text-xs font-bold text-[#FF6B35]">
                                                    <Smile className="size-4" />
                                                    <span>Keluarga Besar {schoolName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECTION: Berita & Pengumuman Sekolah (Publik) */}
                        <div id="berita" className="relative z-10 mx-auto mt-16 max-w-6xl">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:border-orange-900 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                        <Newspaper className="size-3.5" />
                                        Kabar & Warta Sekolah
                                    </div>
                                    <h2 className="mt-2 text-2xl font-black text-[#111827] sm:text-3xl dark:text-white">
                                        Berita, Agenda & Surat Edaran Resmi
                                    </h2>
                                    <p className="mt-1 text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                        Informasi kegiatan terkini, prestasi siswa, dan dokumen edaran penting dari pihak sekolah.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="rounded-xl border-orange-200 bg-orange-50/50 text-xs font-extrabold text-[#FF6B35] hover:bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-[#FFA07A]"
                                    >
                                        <Link href="/berita">
                                            <span>Lihat Semua Berita ({totalNewsCount ?? news.length})</span>
                                            <ArrowRight className="ml-1 size-3.5" />
                                        </Link>
                                    </Button>

                                    {isPublisherOrAdmin && (
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={() => setIsCreateNewsModalOpen(true)}
                                            className="rounded-xl px-4 text-xs font-bold shadow-md shadow-[#FF6B35]/20"
                                        >
                                            <Plus className="mr-1.5 size-4" />
                                            Tambah Berita
                                        </Button>
                                    )}
                                    {isPublisherOrAdmin && (
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="rounded-xl border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200"
                                        >
                                            <Link href="/news-management">
                                                Panel Berita
                                                <ArrowRight className="ml-1 size-3.5" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Filters Bar: Search & Categories */}
                            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                                {/* Categories Filter Pills */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedNewsCategory('all')}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                            selectedNewsCategory === 'all'
                                                ? 'bg-[#FF6B35] text-white shadow-xs shadow-[#FF6B35]/30'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                        }`}
                                    >
                                        Semua ({news.length})
                                    </button>
                                    {newsCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedNewsCategory(cat.id.toString())}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                                selectedNewsCategory === cat.id.toString()
                                                    ? 'bg-[#FF6B35] text-white shadow-xs shadow-[#FF6B35]/30'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                            }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Search Input */}
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={newsSearch}
                                        onChange={(e) => setNewsSearch(e.target.value)}
                                        placeholder="Cari topik berita..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-8.5 pr-8 py-1.5 text-xs font-medium focus:border-[#FF6B35] focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {newsSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setNewsSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* News Cards Grid */}
                            {filteredNews.length === 0 ? (
                                <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 p-12 text-center backdrop-blur-md dark:border-gray-800 dark:bg-[#18122B]/60">
                                    <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35] dark:bg-orange-950/40">
                                        <Newspaper className="size-7" />
                                    </div>
                                    <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                                        Tidak Ada Berita yang Sesuai
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500 max-w-sm dark:text-gray-400">
                                        Coba gunakan kata kunci pencarian lain atau pilih kategori berita yang berbeda.
                                    </p>
                                    {(newsSearch || selectedNewsCategory !== 'all') && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setNewsSearch('');
                                                setSelectedNewsCategory('all');
                                            }}
                                            className="mt-4 rounded-xl text-xs font-bold"
                                        >
                                            Tampilkan Semua Berita
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedNews.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-primary,#FF6B35)] hover:shadow-md dark:border-gray-800 dark:bg-[#18122B]"
                                        >
                                            {/* Cover Image or Themed Graphic */}
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
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B35] hover:text-[#e05622] transition-colors"
                                                    >
                                                        <span>Baca Selengkapnya</span>
                                                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                                    </button>

                                                    {item.attachment_url && (
                                                        <a
                                                            href={item.attachment_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            download
                                                            className="flex size-7 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                                                            title={`Unduh ${item.attachment_name || 'Lampiran.pdf'}`}
                                                        >
                                                            <Download className="size-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Berita di Beranda (Default 9 per halaman) */}
                                {filteredNews.length > 0 && (
                                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                            <span>
                                                Menampilkan {(newsPage - 1) * newsPerPage + 1} -{' '}
                                                {Math.min(newsPage * newsPerPage, filteredNews.length)} dari total {filteredNews.length} berita & edaran
                                            </span>
                                            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3 dark:border-gray-700">
                                                <span className="text-xs text-gray-400">Tampilkan:</span>
                                                <select
                                                    value={newsPerPage}
                                                    onChange={(e) => {
                                                        setNewsPerPage(Number(e.target.value));
                                                        setNewsPage(1);
                                                    }}
                                                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-700 focus:border-[var(--brand-primary,#FF6B35)] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
                                                >
                                                    <option value={6}>6 / halaman (Default)</option>
                                                    <option value={12}>12 / halaman</option>
                                                    <option value={18}>18 / halaman</option>
                                                </select>
                                            </div>
                                        </div>

                                        {totalNewsPages > 1 && (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    disabled={newsPage <= 1}
                                                    onClick={() => {
                                                        setNewsPage((p) => Math.max(1, p - 1));
                                                        document.getElementById('berita')?.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                                        newsPage > 1
                                                            ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer'
                                                            : 'cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-400 opacity-60 dark:border-gray-800 dark:bg-gray-900'
                                                    }`}
                                                >
                                                    &laquo; Sebelumnya
                                                </button>

                                                {Array.from({ length: totalNewsPages }, (_, idx) => idx + 1).map((pageNum) => (
                                                    <button
                                                        key={pageNum}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewsPage(pageNum);
                                                            document.getElementById('berita')?.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                                            newsPage === pageNum
                                                                ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                                                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                ))}

                                                <button
                                                    type="button"
                                                    disabled={newsPage >= totalNewsPages}
                                                    onClick={() => {
                                                        setNewsPage((p) => Math.min(totalNewsPages, p + 1));
                                                        document.getElementById('berita')?.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                                        newsPage < totalNewsPages
                                                            ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer'
                                                            : 'cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-400 opacity-60 dark:border-gray-800 dark:bg-gray-900'
                                                    }`}
                                                >
                                                    Berikutnya &raquo;
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                            {/* Banner CTA Lihat Semua Berita dengan Pagination */}
                            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-orange-200/80 bg-orange-50/60 p-5 backdrop-blur-sm dark:border-orange-900/40 dark:bg-orange-950/20">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35] shadow-xs dark:bg-orange-900/50">
                                        <Newspaper className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 dark:text-white">
                                            Ingin membaca seluruh arsip warta & berita sekolah?
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Buka halaman arsip berita dengan pencarian, filter kategori lengkap, dan penomoran halaman (pagination).
                                        </p>
                                    </div>
                                </div>
                                <Button asChild variant="primary" className="rounded-xl px-5 text-xs font-bold shadow-md shadow-[#FF6B35]/20 shrink-0">
                                    <Link href="/berita">
                                        <span>Buka Halaman Berita ({totalNewsCount ?? news.length})</span>
                                        <ArrowRight className="ml-1.5 size-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* SECTION: Galeri Foto Kegiatan Sekolah */}
                        <div id="galeri" className="relative z-10 mx-auto mt-16 max-w-6xl">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-200/80 pb-5 dark:border-gray-800">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:border-orange-900 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                        <Images className="size-3.5" />
                                        Dokumentasi & Momen Sekolah
                                    </div>
                                    <h2 className="mt-2.5 text-2xl font-black text-[#111827] sm:text-3xl dark:text-white">
                                        Galeri Foto Kegiatan
                                    </h2>
                                    <p className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                        Kumpulan dokumentasi foto kegiatan belajar, ekstrakurikuler, dan momen berkesan warga sekolah.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button asChild variant="secondary" size="sm" className="rounded-xl text-xs font-bold">
                                        <Link href="/galeri">
                                            <span>Lihat Semua Galeri ({totalGalleriesCount ?? galleries.length})</span>
                                            <ArrowRight className="ml-1.5 size-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {galleries.length === 0 ? (
                                <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 p-10 text-center backdrop-blur-md dark:border-gray-800 dark:bg-[#18122B]/60">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35] dark:bg-orange-950/40">
                                        <Images className="size-6" />
                                    </div>
                                    <h3 className="mt-3 text-sm font-bold text-gray-900 dark:text-white">
                                        Belum Ada Foto Kegiatan
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500 max-w-sm dark:text-gray-400">
                                        Dokumentasi foto kegiatan sekolah yang diunggah akan tampil di bagian ini.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                        {paginatedGalleries.map((gItem) => {
                                            const photoCount = gItem.images_urls?.length || (gItem.image_url ? 1 : 0);
                                            return (
                                                <div
                                                    key={gItem.id}
                                                    onClick={() => {
                                                        setActiveGalleryPhotoIdx(0);
                                                        setActiveGallery(gItem);
                                                    }}
                                                    className="group cursor-pointer flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-primary,#FF6B35)] hover:shadow-md dark:border-gray-800 dark:bg-[#18122B]"
                                                >
                                                    <div className="relative h-52 w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                                                        {gItem.image_url ? (
                                                            <img
                                                                src={gItem.image_url}
                                                                alt={gItem.title}
                                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                                <ImageIcon className="size-10" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-3 left-3">
                                                            <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-[#FF6B35] shadow-sm backdrop-blur-md dark:bg-gray-900/90 dark:text-[#FFA07A]">
                                                                {gItem.category}
                                                            </span>
                                                        </div>
                                                        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
                                                            <Images className="size-3 text-[#FF6B35]" />
                                                            <span>{photoCount} Foto</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-1 flex-col p-4">
                                                        <span className="text-[11px] text-gray-400">{gItem.formatted_date}</span>
                                                        <h3 className="mt-1 line-clamp-1 text-sm font-extrabold text-gray-900 group-hover:text-[var(--brand-primary,#FF6B35)] transition-colors dark:text-white">
                                                            {gItem.title}
                                                        </h3>
                                                        {gItem.description && (
                                                            <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                                                                {gItem.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Galeri di Beranda (Default 6 per halaman) */}
                                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                            <span>
                                                Menampilkan {(galleryPage - 1) * galleryPerPage + 1} -{' '}
                                                {Math.min(galleryPage * galleryPerPage, galleries.length)} dari total {galleries.length} album kegiatan
                                            </span>
                                            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3 dark:border-gray-700">
                                                <span className="text-xs text-gray-400">Tampilkan:</span>
                                                <select
                                                    value={galleryPerPage}
                                                    onChange={(e) => {
                                                        setGalleryPerPage(Number(e.target.value));
                                                        setGalleryPage(1);
                                                    }}
                                                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-700 focus:border-[var(--brand-primary,#FF6B35)] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
                                                >
                                                    <option value={6}>6 / halaman (Default)</option>
                                                    <option value={12}>12 / halaman</option>
                                                    <option value={18}>18 / halaman</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                disabled={galleryPage <= 1}
                                                onClick={() => {
                                                    setGalleryPage((p) => Math.max(1, p - 1));
                                                    document.getElementById('galeri')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                                    galleryPage > 1
                                                        ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer'
                                                        : 'cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-400 opacity-60 dark:border-gray-800 dark:bg-gray-900'
                                                }`}
                                            >
                                                &laquo; Sebelumnya
                                            </button>

                                            {Array.from({ length: totalGalleryPages }, (_, idx) => idx + 1).map((pageNum) => (
                                                <button
                                                    key={pageNum}
                                                    type="button"
                                                    onClick={() => {
                                                        setGalleryPage(pageNum);
                                                        document.getElementById('galeri')?.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                                        galleryPage === pageNum
                                                            ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            ))}

                                            <button
                                                type="button"
                                                disabled={galleryPage >= totalGalleryPages}
                                                onClick={() => {
                                                    setGalleryPage((p) => Math.min(totalGalleryPages, p + 1));
                                                    document.getElementById('galeri')?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                                    galleryPage < totalGalleryPages
                                                        ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer'
                                                        : 'cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-400 opacity-60 dark:border-gray-800 dark:bg-gray-900'
                                                }`}
                                            >
                                                Berikutnya &raquo;
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* SECTION: Pintasan Halaman Kalender & Kontak Kami */}
                        <div className="relative z-10 mx-auto mt-16 max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Card Kalender */}
                            <div className="group rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/20 p-6 sm:p-7 shadow-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-[#18122B]/80 flex flex-col justify-between">
                                <div>
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-xs group-hover:scale-105 transition-transform dark:bg-blue-950 dark:text-blue-300">
                                        <CalendarDays className="size-6" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-black text-gray-900 dark:text-white">
                                        Kalender Akademik Sekolah
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500 leading-relaxed dark:text-gray-400">
                                        Pantau jadwal hari efektif belajar, agenda libur resmi, cuti bersama, dan perhitungan pekan belajar dalam tampilan kalender akademik interaktif.
                                    </p>
                                </div>
                                <div className="mt-6">
                                    <Button asChild variant="outline" className="rounded-xl border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900 dark:text-blue-300">
                                        <Link href="/kalender">
                                            <span>Buka Kalender Akademik</span>
                                            <ArrowRight className="ml-1.5 size-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Card Kontak */}
                            <div className="group rounded-3xl border border-orange-100 bg-gradient-to-br from-white via-orange-50/40 to-amber-50/20 p-6 sm:p-7 shadow-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-md dark:border-gray-800 dark:bg-[#18122B]/80 flex flex-col justify-between">
                                <div>
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35] shadow-xs group-hover:scale-105 transition-transform dark:bg-orange-950 dark:text-[#FFA07A]">
                                        <PhoneCall className="size-6" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-black text-gray-900 dark:text-white">
                                        Layanan & Kontak Kami
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500 leading-relaxed dark:text-gray-400">
                                        Hubungi kami secara langsung melalui WhatsApp, telepon, email, atau sampaikan aspirasi dan pertanyaan Anda melalui formulir kontak kami.
                                    </p>
                                </div>
                                <div className="mt-6">
                                    <Button asChild variant="outline" className="rounded-xl border-orange-200 text-xs font-bold text-[#FF6B35] hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900 dark:text-[#FFA07A]">
                                        <Link href="/kontak">
                                            <span>Hubungi Kami</span>
                                            <ArrowRight className="ml-1.5 size-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </section>
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

                {/* MODAL: Lightbox Galeri Foto Kegiatan */}
                {activeGallery && (() => {
                    const allGalleryPhotos =
                        activeGallery.images_urls && activeGallery.images_urls.length > 0
                            ? activeGallery.images_urls
                            : activeGallery.image_url
                            ? [activeGallery.image_url]
                            : [];
                    const currentGalleryPhoto = allGalleryPhotos[activeGalleryPhotoIdx] || allGalleryPhotos[0];

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-[#18122B]">
                                <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                            {activeGallery.category}
                                        </span>
                                        <span className="text-xs text-gray-400">{activeGallery.formatted_date}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveGallery(null);
                                            setActiveGalleryPhotoIdx(0);
                                        }}
                                        className="flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                    {currentGalleryPhoto && (
                                        <div className="relative overflow-hidden rounded-2xl bg-black/90">
                                            <img
                                                src={currentGalleryPhoto}
                                                alt={activeGallery.title}
                                                className="mx-auto max-h-[58vh] w-full object-contain"
                                            />
                                            {allGalleryPhotos.length > 1 && (
                                                <>
                                                    <span className="absolute bottom-3 right-3 rounded-lg bg-black/75 px-3 py-1 text-xs font-black text-white">
                                                        {activeGalleryPhotoIdx + 1} / {allGalleryPhotos.length} Foto
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveGalleryPhotoIdx((prev) =>
                                                                prev > 0 ? prev - 1 : allGalleryPhotos.length - 1,
                                                            )
                                                        }
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                                    >
                                                        <ChevronLeft className="size-5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveGalleryPhotoIdx((prev) =>
                                                                prev < allGalleryPhotos.length - 1 ? prev + 1 : 0,
                                                            )
                                                        }
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                                    >
                                                        <ChevronRight className="size-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {allGalleryPhotos.length > 1 && (
                                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                                            {allGalleryPhotos.map((imgUrl, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setActiveGalleryPhotoIdx(idx)}
                                                    className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                                                        activeGalleryPhotoIdx === idx
                                                            ? 'border-[#FF6B35] ring-2 ring-orange-200'
                                                            : 'border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img src={imgUrl} alt={`Foto ${idx + 1}`} className="size-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 dark:text-white">{activeGallery.title}</h2>
                                        {activeGallery.description && (
                                            <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                                {activeGallery.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

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
                                {/* Modal Header */}
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

                                {/* Modal Body */}
                                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                                    {/* Galeri Gambar */}
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

                                            {/* Thumbnail Strip jika lebih dari 1 foto */}
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

                                    {/* Content */}
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

                                    {/* Lampiran Dokumen PDF */}
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
                                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-colors"
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

                                {/* Modal Footer */}
                                <div className="flex items-center justify-end border-t border-gray-100 p-4 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
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

                {/* MODAL: Tambah Berita Cepat dari Dashboard Publik */}
                {isCreateNewsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[28px] bg-white shadow-2xl dark:bg-[#18122B] overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                        <Newspaper className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-gray-900 dark:text-white">
                                            Tambah Berita ke Dashboard Publik
                                        </h3>
                                        <span className="text-[11px] text-gray-400">
                                            Hak Akses: Publisher Berita
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateNewsModalOpen(false)}
                                    className="flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleQuickNewsSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Impor Cepat dari Instagram Sekolah */}
                                <div className="rounded-2xl border-2 border-pink-200/80 bg-gradient-to-r from-pink-50/70 via-purple-50/40 to-orange-50/60 p-4 dark:border-pink-900/50 dark:from-pink-950/30 dark:via-purple-950/20 dark:to-orange-950/20">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-xs">
                                            <Instagram className="size-4" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-extrabold uppercase tracking-wide text-pink-900 dark:text-pink-200">
                                                Impor / Tautkan dari Instagram Sekolah (Opsional)
                                            </label>
                                            <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                                Tempel link postingan atau reel Instagram untuk menarik caption & foto otomatis.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <input
                                            type="url"
                                            value={quickNewsForm.data.instagram_url}
                                            onChange={(e) => handleQuickInstagramUrlChange(e.target.value)}
                                            placeholder="Tempel link Instagram (otomatis tarik judul, ringkasan & foto sampul)..."
                                            className="flex-1 rounded-xl border border-pink-200 bg-white px-3.5 py-2 text-xs font-semibold focus:border-pink-500 focus:outline-none dark:border-pink-900/60 dark:bg-gray-800 dark:text-white"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={isFetchingQuickInstagram || !quickNewsForm.data.instagram_url.trim()}
                                            onClick={() => handleFetchQuickInstagramPost()}
                                            className="rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 px-3.5 py-2 text-xs font-bold text-white hover:opacity-95 border-0 shadow-xs shrink-0"
                                        >
                                            {isFetchingQuickInstagram ? (
                                                <>
                                                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                                    Menarik...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-1.5 size-3.5" />
                                                    Tarik dari IG
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {quickInstagramNotice && (
                                        <div
                                            className={`mt-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold ${
                                                quickInstagramNotice.type === 'success'
                                                    ? 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200'
                                                    : quickInstagramNotice.type === 'error'
                                                    ? 'bg-rose-100/90 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200'
                                                    : 'bg-blue-100/90 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200'
                                            }`}
                                        >
                                            {quickInstagramNotice.text}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Judul Berita <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={quickNewsForm.data.title}
                                        onChange={(e) => quickNewsForm.setData('title', e.target.value)}
                                        placeholder="Judul pengumuman atau berita sekolah..."
                                        required
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                            Kategori Berita
                                        </label>
                                        <select
                                            value={quickNewsForm.data.category_id}
                                            onChange={(e) => quickNewsForm.setData('category_id', e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        >
                                            <option value="">Tanpa Kategori</option>
                                            {newsCategories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                            Status
                                        </label>
                                        <div className="flex items-center gap-2 pt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={quickNewsForm.data.is_published}
                                                    onChange={(e) => quickNewsForm.setData('is_published', e.target.checked)}
                                                    className="size-4 rounded text-[#FF6B35] focus:ring-[#FF6B35]"
                                                />
                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                    Terbitkan sekarang di halaman publik
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Ringkasan Singkat (Opsional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={quickNewsForm.data.excerpt}
                                        onChange={(e) => quickNewsForm.setData('excerpt', e.target.value)}
                                        placeholder="Ringkasan singkat untuk kartu berita di dashboard..."
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Isi Berita Lengkap <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={quickNewsForm.data.content}
                                        onChange={(e) => quickNewsForm.setData('content', e.target.value)}
                                        placeholder="Ketik isi berita selengkapnya di sini..."
                                        required
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                {/* Upload Multiple Gambar Berita */}
                                <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                                            Galeri Foto Berita (Bisa Pilih Banyak)
                                        </label>
                                        <span className="text-[11px] font-bold text-[#FF6B35]">
                                            {quickImages.length} Foto
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Gambar otomatis dikompresi sehingga ukuran file sangat hemat kuota dan cepat dimuat.
                                    </p>

                                    {quickImages.length > 0 && (
                                        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                                            {quickImages.map((img, idx) => (
                                                <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                                                    <img src={img.base64} alt={`Foto ${idx + 1}`} className="size-full object-cover" />
                                                    {idx === 0 && (
                                                        <span className="absolute top-1 left-1 rounded bg-[#FF6B35] px-1.5 py-0.5 text-[8px] font-black text-white">
                                                            Utama
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveQuickImage(img.id)}
                                                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-red-600 text-white"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-3">
                                        <input
                                            type="file"
                                            ref={imageInputRef}
                                            accept="image/*"
                                            multiple
                                            onChange={handleQuickImagesChange}
                                            className="hidden"
                                            id="quick-image-upload"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isCompressingImages}
                                            onClick={() => imageInputRef.current?.click()}
                                            className="rounded-xl border-gray-300 text-xs font-bold"
                                        >
                                            <UploadCloud className="mr-1.5 size-3.5 text-[#FF6B35]" />
                                            {isCompressingImages
                                                ? 'Mengompresi...'
                                                : quickImages.length > 0
                                                ? '+ Tambah Foto Lain'
                                                : 'Pilih Foto (Bisa Banyak)'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Upload Multiple PDF */}
                                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 dark:border-red-950/60 dark:bg-red-950/20">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-red-950 dark:text-red-300 uppercase">
                                            Lampiran Dokumen PDF (Bisa Banyak, Maks 20MB/berkas)
                                        </label>
                                        <span className="text-[11px] font-bold text-red-700 dark:text-red-400">
                                            {quickAttachments.length} Dokumen
                                        </span>
                                    </div>

                                    {quickAttachments.length > 0 && (
                                        <div className="mt-2.5 space-y-2">
                                            {quickAttachments.map((att) => (
                                                <div
                                                    key={att.id}
                                                    className="flex items-center justify-between rounded-xl border border-red-200 bg-white p-2.5 shadow-xs dark:border-red-900/50 dark:bg-gray-800"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <FileText className="size-4 shrink-0 text-red-600" />
                                                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                            {att.name}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 shrink-0">
                                                            ({formatFileSize(att.size)})
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveQuickAttachment(att.id)}
                                                        className="text-red-600 p-1 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <X className="size-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-2.5">
                                        <input
                                            type="file"
                                            ref={attachmentInputRef}
                                            accept="application/pdf"
                                            multiple
                                            onChange={handleQuickAttachmentsChange}
                                            className="hidden"
                                            id="quick-attachment-upload"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isConvertingPdf}
                                            onClick={() => attachmentInputRef.current?.click()}
                                            className="rounded-xl border-red-200 bg-white text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-gray-800 dark:text-red-300"
                                        >
                                            <Paperclip className="mr-1.5 size-3.5" />
                                            {isConvertingPdf
                                                ? 'Menyiapkan...'
                                                : quickAttachments.length > 0
                                                ? '+ Tambah Dokumen Lain'
                                                : 'Pilih Berkas PDF (Bisa Banyak)'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setIsCreateNewsModalOpen(false)}
                                        className="rounded-xl text-xs font-bold"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={quickNewsForm.processing || isCompressingImages || isConvertingPdf}
                                        className="rounded-xl px-5 text-xs font-bold"
                                    >
                                        {isCompressingImages
                                            ? 'Mengompresi Foto...'
                                            : isConvertingPdf
                                            ? 'Menyiapkan Lampiran...'
                                            : quickNewsForm.processing
                                            ? 'Menyimpan...'
                                            : 'Terbitkan Berita'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Kelola Hero Banner (Available for Publisher, Admin & Principal) */}
                {isHeroModalOpen && canManageGreeting && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsHeroModalOpen(false)}
                    >
                        <div
                            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#18122B] dark:border dark:border-gray-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                        <Sparkles className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-gray-900 dark:text-white">
                                            Kelola Hero Banner Beranda Publik
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Sesuaikan tampilan judul, deskripsi, foto banner, dan 4 pilar keunggulan di beranda.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsHeroModalOpen(false)}
                                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleHeroSubmit} className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                                        Teks Lencana (Badge Atas)
                                    </label>
                                    <input
                                        type="text"
                                        value={editHeroBadge}
                                        onChange={(e) => setEditHeroBadge(e.target.value)}
                                        placeholder={`Selamat Datang di Portal Resmi ${schoolName}`}
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                                            Judul Utama (Baris 1) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editHeroTitle}
                                            onChange={(e) => setEditHeroTitle(e.target.value)}
                                            placeholder="Mewujudkan Generasi Cerdas,"
                                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                                            Teks Sorotan (Warna Gradasi) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editHeroHighlight}
                                            onChange={(e) => setEditHeroHighlight(e.target.value)}
                                            placeholder="Kreatif, Ceria & Berakhlak Mulia"
                                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                                        Deskripsi / Sub-judul Hero Banner <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={editHeroDescription}
                                        onChange={(e) => setEditHeroDescription(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-xs leading-relaxed focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                {/* Optional Hero Banner Image */}
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                                    <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-2">
                                        Gambar / Foto Banner (Opsional)
                                    </label>
                                    {editHeroImagePreview ? (
                                        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                                            <img
                                                src={editHeroImagePreview}
                                                alt="Preview Hero"
                                                className="h-36 w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditHeroImage(null);
                                                    setEditHeroImagePreview(null);
                                                    setRemoveHeroImage(true);
                                                    if (heroImageRef.current) {
                                                        heroImageRef.current.value = '';
                                                    }
                                                }}
                                                className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-red-600 text-white shadow-sm hover:bg-red-700"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                type="file"
                                                ref={heroImageRef}
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (!f) return;
                                                    setEditHeroImage(f);
                                                    setRemoveHeroImage(false);
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) =>
                                                        setEditHeroImagePreview(ev.target?.result as string);
                                                    reader.readAsDataURL(f);
                                                }}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => heroImageRef.current?.click()}
                                                className="rounded-xl text-xs font-bold"
                                            >
                                                <UploadCloud className="mr-1.5 size-4 text-[#FF6B35]" />
                                                Pilih Gambar Banner (Opsional)
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* 4 Pilar Keunggulan */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-2">
                                        4 Kartu Pilar Keunggulan di Bawah Hero Banner
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {editHeroPillars.map((pillar, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-2xl border border-gray-200 bg-gray-50 p-3 space-y-2 dark:border-gray-700 dark:bg-gray-800/60"
                                            >
                                                <div className="text-[11px] font-extrabold text-[#FF6B35]">
                                                    Pilar #{idx + 1}
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={pillar.title}
                                                    onChange={(e) =>
                                                        setEditHeroPillars((prev) =>
                                                            prev.map((item, i) =>
                                                                i === idx ? { ...item, title: e.target.value } : item,
                                                            ),
                                                        )
                                                    }
                                                    placeholder="Judul Pilar"
                                                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                />
                                                <textarea
                                                    rows={2}
                                                    required
                                                    value={pillar.description}
                                                    onChange={(e) =>
                                                        setEditHeroPillars((prev) =>
                                                            prev.map((item, i) =>
                                                                i === idx
                                                                    ? { ...item, description: e.target.value }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                    placeholder="Deskripsi singkat pilar..."
                                                    className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs leading-snug focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <Link
                                        href="/manage/school-profile#hero-banner"
                                        className="text-xs font-bold text-[#FF6B35] hover:underline"
                                    >
                                        Buka di Menu Profil Sekolah &rarr;
                                    </Link>
                                    <div className="flex items-center gap-2.5">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setIsHeroModalOpen(false)}
                                            className="rounded-xl text-xs font-bold"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={heroSaving}
                                            className="rounded-xl px-5 text-xs font-bold"
                                        >
                                            {heroSaving ? 'Menyimpan...' : 'Simpan Hero Banner'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
