import { Link, router, usePage } from '@inertiajs/react';
import {
    Award,
    BellRing,
    BookOpenCheck,
    Building2,
    CalendarCheck,
    CalendarDays,
    Clock,
    Database,
    Download,
    FileSpreadsheet,
    Globe,
    GraduationCap,
    Images,
    LayoutGrid,
    LogOut,
    Menu,
    MessageSquareQuote,
    Newspaper,
    PhoneCall,
    School,
    Settings,
    Shield,
    ShieldCheck,
    TrendingUp,
    User,
    UserCheck,
    Users,
    Video,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface SchoolSettingProp {
    name?: string;
    logo_url?: string;
    city?: string;
}

function getActiveMasterTab(currentUrl: string): string | null {
    if (!currentUrl.startsWith('/master')) {
        return null;
    }
    const queryIndex = currentUrl.indexOf('?');
    if (queryIndex === -1) {
        return 'students';
    }
    const params = new URLSearchParams(currentUrl.slice(queryIndex));
    const tab = params.get('tab');
    if (
        tab === 'alumni' ||
        params.has('alumni_search') ||
        params.has('alumni_graduation_year') ||
        params.has('alumni_classroom_id')
    ) {
        return 'alumni';
    }
    if (
        tab === 'promotions' ||
        tab === 'teachers' ||
        tab === 'classrooms' ||
        tab === 'duty'
    ) {
        return tab;
    }
    return 'students';
}

function NavCard({
    href,
    title,
    subtitle,
    icon: Icon,
    isActive,
    badge,
    color = 'orange',
    onClick,
}: {
    href: string;
    title: string;
    subtitle?: string;
    icon: any;
    isActive?: boolean;
    badge?: string;
    color?: 'orange' | 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'teal' | 'indigo';
    onClick: () => void;
}) {
    const colorClasses = {
        orange: 'bg-orange-100 text-[#FF6B35] dark:bg-orange-950/60 dark:text-orange-300',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
        rose: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300',
        teal: 'bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300',
        indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300',
    }[color];

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all ${
                isActive
                    ? 'bg-[var(--brand-primary-light,#FFF0EB)] border-[var(--brand-primary,#FF6B35)]/50 text-[var(--brand-primary,#FF6B35)] font-bold shadow-xs dark:bg-[var(--brand-primary-dark,#FF6B35)]/20 dark:border-[var(--brand-primary,#FF6B35)]/40'
                    : 'border-gray-200/80 bg-white hover:bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:bg-gray-800/60'
            }`}
        >
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${colorClasses}`}>
                <Icon className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
                <div className="text-xs font-bold truncate flex items-center justify-between gap-1">
                    <span className="truncate">{title}</span>
                    {badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--brand-primary,#FF6B35)] text-white font-black shrink-0">
                            {badge}
                        </span>
                    )}
                </div>
                {subtitle && (
                    <div className="text-[10px] font-medium text-gray-400 truncate mt-0.5">
                        {subtitle}
                    </div>
                )}
            </div>
        </Link>
    );
}

export function MobileBottomNav() {
    const { url, props } = usePage();
    const user = props.auth?.user as { name?: string; role?: string } | undefined;
    const school = props.school as SchoolSettingProp | undefined;
    const globalSchoolName = typeof window !== 'undefined' ? (window as any).__SCHOOL_NAME__ : '';
    const globalSchoolLogo = typeof window !== 'undefined' ? (window as any).__SCHOOL_LOGO__ : null;
    const appName = school?.name || globalSchoolName || 'AbsensiKu SD';
    const logoUrl = school?.logo_url || globalSchoolLogo;

    const isAdmin = user?.role === 'admin';
    const isPrincipal = user?.role === 'principal';
    const isPublisher = user?.role === 'publisher';
    const isCoach = user?.role === 'coach';
    const isTeacher = user?.role === 'teacher';
    const canManageSchool = isAdmin || isPrincipal;
    const activeMasterTab = getActiveMasterTab(url);

    const permissions = (props.auth as any)?.permissions;
    const can = (module: string, action: string = 'view'): boolean => {
        if (isAdmin || permissions === '*') return true;
        if (!permissions || typeof permissions !== 'object') return false;
        return Boolean(permissions[module]?.[action]);
    };

    const hasMasterAccess =
        (isAdmin ||
            can('master_students', 'view') ||
            can('master_teachers', 'view') ||
            can('master_classes', 'view')) &&
        !isPublisher &&
        !isCoach;

    const hasPublikasiAccess =
        (isAdmin ||
            can('news', 'view') ||
            can('galleries', 'view') ||
            can('school_profile', 'view') ||
            can('principal_greeting', 'view') ||
            can('contact_messages', 'view')) &&
        !isPublisher &&
        !isCoach;

    const hasSettingsAccess =
        (isAdmin ||
            can('school_settings', 'view') ||
            can('holidays', 'view') ||
            can('pwa_notifications', 'view') ||
            can('permissions', 'view')) &&
        !isPublisher &&
        !isCoach;

    const [imgFailed, setImgFailed] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    // Dynamic favicon synchronization
    useEffect(() => {
        if (school?.logo_url) {
            const links = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
            links.forEach((link) => {
                link.href = school.logo_url!;
            });
        }
    }, [school?.logo_url]);

    // PWA Install prompt listener
    useEffect(() => {
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            setIsStandalone(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsStandalone(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallPWA = async () => {
        if (deferredPrompt) {
            try {
                await deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice?.outcome === 'accepted') {
                    setIsInstallable(false);
                }
            } catch (err) {
                console.warn('[PWA] Install prompt error:', err);
                alert('Untuk menginstall aplikasi di ponsel Anda:\n1. Buka menu browser (ikon titik tiga ⋮ atau tombol Share di Safari/Chrome).\n2. Pilih "Tambahkan ke Layar Utama" (Add to Home screen) atau "Install Aplikasi".');
            }
            setDeferredPrompt(null);
        } else {
            alert('Untuk menginstall aplikasi di ponsel Anda:\n1. Buka menu browser (ikon titik tiga ⋮ atau tombol Share di Safari/Chrome).\n2. Pilih "Tambahkan ke Layar Utama" (Add to Home screen) atau "Install Aplikasi".');
        }
    };

    // Active status checks
    const isDashboardActive = url === '/dashboard';
    const isJournalActive = url.startsWith('/principal/journals');
    const isPresensiActive = url.startsWith('/attendances') && !url.includes('/lateness') && !url.includes('/adjustments');
    const isLatenessActive = url.startsWith('/attendances/lateness');
    const isAdjustmentsActive = url.startsWith('/attendances/adjustments');
    const isReportsActive = url.startsWith('/reports');
    const isExtracurricularActive = url.startsWith('/extracurricular');
    const isMasterActive = url.startsWith('/master');
    const isPublishActive = url.startsWith('/manage') || url.startsWith('/publisher') || url.startsWith('/news-management');
    const isAdminSettingsActive = url.startsWith('/admin/');
    const isTutorialsActive = url.startsWith('/tutorials') || url.startsWith('/admin/tutorials');

    const isPublisherNewsActive = url.startsWith('/news-management');
    const isPublisherGalleriesActive = url.startsWith('/manage/galleries');
    const isPublisherProfileActive = url.startsWith('/manage/school-profile');
    const isCoachCreateActive = url === '/extracurricular/reports/create';
    const isCoachReportsActive = url.startsWith('/extracurricular/reports') && !isCoachCreateActive;
    const isCoachRosterActive = url.startsWith('/extracurricular/roster');

    const isOtherActive =
        (isPrincipal && isAdjustmentsActive) ||
        isReportsActive ||
        isExtracurricularActive ||
        isMasterActive ||
        isPublishActive ||
        isAdminSettingsActive ||
        isTutorialsActive ||
        url.startsWith('/settings');

    const handleLogout = () => {
        router.post('/logout');
    };

    const closeDrawer = () => setIsMenuOpen(false);

    return (
        <>
            {/* Mobile Bottom Navigation Bar */}
            <nav className="fixed bottom-0 inset-x-0 z-40 block md:hidden bg-white/95 dark:bg-[#18122B]/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-white/10 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 transition-all">
                <div className="grid grid-cols-5 items-center justify-around px-2 max-w-md mx-auto">
                    {/* 1. Beranda / Dashboard */}
                    {isPublisher ? (
                        <Link
                            href="/news-management"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isPublisherNewsActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isPublisherNewsActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <Newspaper className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isPublisherNewsActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Beranda
                            </span>
                        </Link>
                    ) : isCoach ? (
                        <Link
                            href="/extracurricular/reports"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isCoachReportsActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isCoachReportsActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <LayoutGrid className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isCoachReportsActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Beranda
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href="/dashboard"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isDashboardActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isDashboardActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <LayoutGrid className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isDashboardActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Beranda
                            </span>
                        </Link>
                    )}

                    {/* 2. Slot 2: Jurnal (Principal) / Galeri (Publisher) / Buat Laporan (Coach) / Presensi (Guru & Admin) */}
                    {isPrincipal ? (
                        <Link
                            href="/principal/journals"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isJournalActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isJournalActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <BookOpenCheck className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isJournalActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Jurnal
                            </span>
                        </Link>
                    ) : isPublisher ? (
                        <Link
                            href="/manage/galleries"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isPublisherGalleriesActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isPublisherGalleriesActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <Images className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isPublisherGalleriesActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Galeri
                            </span>
                        </Link>
                    ) : isCoach ? (
                        <Link
                            href="/extracurricular/reports/create"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isCoachCreateActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isCoachCreateActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <Award className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isCoachCreateActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Buat Laporan
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href="/attendances"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isPresensiActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isPresensiActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <UserCheck className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isPresensiActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Presensi
                            </span>
                        </Link>
                    )}

                    {/* 3. Slot 3: Presensi (Principal) / Profil Sekolah (Publisher) / Roster Siswa (Coach) / Terlambat (Guru & Admin) */}
                    {isPrincipal ? (
                        <Link
                            href="/attendances"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isPresensiActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isPresensiActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <UserCheck className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isPresensiActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Presensi
                            </span>
                        </Link>
                    ) : isPublisher ? (
                        <Link
                            href="/manage/school-profile"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isPublisherProfileActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isPublisherProfileActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <Building2 className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isPublisherProfileActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Profil
                            </span>
                        </Link>
                    ) : isCoach ? (
                        <Link
                            href="/extracurricular/roster"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isCoachRosterActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isCoachRosterActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <Users className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isCoachRosterActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Roster
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href="/attendances/lateness"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isLatenessActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isLatenessActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <Clock className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isLatenessActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Terlambat
                            </span>
                        </Link>
                    )}

                    {/* 4. Slot 4: Laporan (Principal) / Tutorial (Publisher & Coach) / Absen Khusus (Guru & Admin) */}
                    {isPrincipal ? (
                        <Link
                            href="/reports"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isReportsActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isReportsActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <FileSpreadsheet className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isReportsActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Laporan
                            </span>
                        </Link>
                    ) : (isPublisher || isCoach) ? (
                        <Link
                            href="/tutorials"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isTutorialsActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isTutorialsActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <Video className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isTutorialsActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Tutorial
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href="/attendances/adjustments"
                            prefetch
                            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                                isAdjustmentsActive
                                    ? 'text-[var(--brand-primary,#FF6B35)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                    isAdjustmentsActive
                                        ? 'bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <CalendarDays className="size-5" />
                            </div>
                            <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isAdjustmentsActive ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                                Izin/Sakit
                            </span>
                        </Link>
                    )}

                    {/* 5. Menu Lengkap Sistem (Drawer Button) */}
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(true)}
                        className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 relative ${
                            isOtherActive || isMenuOpen
                                ? 'text-[var(--brand-primary,#FF6B35)]'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        <div
                            className={`flex size-10 items-center justify-center rounded-2xl transition-all relative ${
                                isOtherActive || isMenuOpen
                                    ? 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] border border-[var(--brand-primary,#FF6B35)]/40 dark:bg-[var(--brand-primary-dark,#FF6B35)]/20 dark:border-[var(--brand-primary,#FF6B35)]/40'
                                    : 'hover:bg-gray-100 dark:hover:bg-white/5'
                            }`}
                        >
                            <Menu className="size-5" />
                            {isOtherActive && (
                                <span className="absolute top-1 right-1 size-2 rounded-full bg-[var(--brand-primary,#FF6B35)] ring-2 ring-white dark:ring-[#18122B]" />
                            )}
                        </div>
                        <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isOtherActive || isMenuOpen ? 'text-[var(--brand-primary,#FF6B35)]' : ''}`}>
                            Menu
                        </span>
                    </button>
                </div>
            </nav>

            {/* Slide-Up Bottom Sheet Drawer (Menu Lengkap Sama Persis Dengan Desktop) */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 block md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={closeDrawer}
                    />

                    {/* Sheet Content */}
                    <div className="fixed bottom-0 inset-x-0 z-50 max-h-[88vh] rounded-t-[32px] bg-white p-5 pb-8 shadow-2xl dark:bg-[#18122B] border-t border-gray-200 dark:border-white/10 overflow-y-auto animate-in slide-in-from-bottom duration-250">
                        {/* Drag indicator & Header */}
                        <div className="flex flex-col items-center mb-4">
                            <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 mb-3" />
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    {logoUrl && !imgFailed ? (
                                        <img
                                            src={logoUrl}
                                            alt={appName}
                                            onError={() => setImgFailed(true)}
                                            className="size-10 rounded-xl object-contain border border-gray-200 bg-white p-0.5 shadow-sm dark:border-gray-700"
                                        />
                                    ) : (
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white font-black text-xs shadow-brand">
                                            {appName.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('') || 'AK'}
                                        </div>
                                    )}
                                    <div className="leading-tight">
                                        <h4 className="text-sm font-extrabold text-[var(--brand-primary,#FF6B35)] line-clamp-1">
                                            {appName}
                                        </h4>
                                        <p className="text-[11px] text-gray-500 font-medium line-clamp-1">
                                            {user?.name} &bull; <span className="font-bold text-gray-700 dark:text-gray-300">{user?.role === 'admin' ? 'Administrator' : user?.role === 'principal' ? 'Kepala Sekolah' : user?.role === 'publisher' ? 'Tim Humas' : user?.role === 'coach' ? 'Pelatih Ekskul' : 'Dewan Guru'}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeDrawer}
                                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        {/* PWA Install Banner */}
                        {!isStandalone && (
                            <div className="mb-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-3.5 text-white shadow-lg shadow-orange-500/25 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm overflow-hidden p-1">
                                        <Download className="size-5 text-white" />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black">Install Aplikasi {appName}</h5>
                                        <p className="text-[10px] text-white/90">Akses cepat portal presensi di layar utama</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleInstallPWA}
                                    className="rounded-xl bg-white px-3 py-1.5 text-xs font-black text-orange-600 shadow-sm hover:bg-orange-50 active:scale-95 transition-all"
                                >
                                    Install
                                </button>
                            </div>
                        )}

                        {/* Full Menu Grid (Sama Persis Dengan Desktop) */}
                        <div className="space-y-4">
                            {/* KHUSUS ROLE KEPALA SEKOLAH: Jurnal Supervisi */}
                            {isPrincipal && (
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 px-1">
                                        <span className="size-1.5 rounded-full bg-[var(--brand-primary,#FF6B35)]"></span>
                                        Supervisi Pimpinan
                                    </div>
                                    <NavCard
                                        href="/principal/journals"
                                        title="Jurnal Kepala Sekolah"
                                        subtitle="Catatan Agenda & Refleksi Harian"
                                        icon={BookOpenCheck}
                                        color="orange"
                                        isActive={isJournalActive}
                                        onClick={closeDrawer}
                                    />
                                </div>
                            )}

                            {/* Presensi & Laporan */}
                            {(!isPublisher && !isCoach) && (
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 px-1">
                                        <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                        Presensi & Laporan
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {can('attendances', 'view') && (
                                            <NavCard
                                                href="/attendances"
                                                title="Presensi Harian"
                                                subtitle="Input Absensi Kelas"
                                                icon={UserCheck}
                                                color="emerald"
                                                isActive={isPresensiActive}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('lateness', 'view') && (
                                            <NavCard
                                                href="/attendances/lateness"
                                                title="Keterlambatan"
                                                subtitle="Pencatatan & Slip Izin"
                                                icon={Clock}
                                                color="amber"
                                                isActive={isLatenessActive}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('adjustments', 'view') && (
                                            <NavCard
                                                href="/attendances/adjustments"
                                                title="Absen Khusus"
                                                subtitle="Izin, Sakit & Dispensasi"
                                                icon={CalendarDays}
                                                color="rose"
                                                isActive={isAdjustmentsActive}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('reports', 'view') && (
                                            <NavCard
                                                href="/reports"
                                                title="Rekap & Laporan"
                                                subtitle="Analitik, PDF & Excel"
                                                icon={FileSpreadsheet}
                                                color="blue"
                                                isActive={isReportsActive}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('extracurricular', 'view') && !isTeacher && (
                                            <div className="col-span-2">
                                                <NavCard
                                                    href="/extracurricular/reports"
                                                    title="Laporan Ekstrakurikuler"
                                                    subtitle="Presensi & Perkembangan Murid Ekskul"
                                                    icon={Award}
                                                    color="purple"
                                                    isActive={isExtracurricularActive}
                                                    onClick={closeDrawer}
                                                />
                                            </div>
                                        )}
                                        <div className="col-span-2">
                                            <NavCard
                                                href="/tutorials"
                                                title="Video Tutorial"
                                                subtitle="Panduan Praktis Penggunaan Aplikasi"
                                                icon={Video}
                                                color="orange"
                                                isActive={isTutorialsActive}
                                                onClick={closeDrawer}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Master Data */}
                            {(hasMasterAccess && !isPublisher && !isCoach) && (
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 px-1">
                                        <span className="size-1.5 rounded-full bg-indigo-500"></span>
                                        Master Data Sekolah
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {can('master_students', 'view') && (
                                            <NavCard
                                                href="/master?tab=students"
                                                title="Data Siswa"
                                                subtitle="Direktori Murid & NISN"
                                                icon={Users}
                                                color="indigo"
                                                isActive={url.startsWith('/master') && (activeMasterTab === 'students' || !activeMasterTab)}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('master_teachers', 'view') && (
                                            <NavCard
                                                href="/master?tab=teachers"
                                                title="Data Guru & Staf"
                                                subtitle="Akun Pengajar & NIP"
                                                icon={Shield}
                                                color="teal"
                                                isActive={url.startsWith('/master') && activeMasterTab === 'teachers'}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('master_classes', 'view') && (
                                            <NavCard
                                                href="/master?tab=classrooms"
                                                title="Data Kelas"
                                                subtitle="Rombongan Belajar"
                                                icon={GraduationCap}
                                                color="blue"
                                                isActive={url.startsWith('/master') && activeMasterTab === 'classrooms'}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {(isAdmin || isPrincipal || can('master_classes', 'view')) && (
                                            <NavCard
                                                href="/master?tab=duty"
                                                title="Jadwal Guru Piket"
                                                subtitle="Roster Piket Harian"
                                                icon={CalendarCheck}
                                                color="amber"
                                                isActive={url.startsWith('/master') && activeMasterTab === 'duty'}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {(isAdmin || isPrincipal || can('master_classes', 'view')) && (
                                            <NavCard
                                                href="/master?tab=promotions"
                                                title="Kenaikan Kelas"
                                                subtitle="Proses Naik Tingkat"
                                                icon={TrendingUp}
                                                color="emerald"
                                                isActive={url.startsWith('/master') && activeMasterTab === 'promotions'}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {(isAdmin || isPrincipal || can('master_classes', 'view')) && (
                                            <NavCard
                                                href="/master?tab=alumni"
                                                title="Data Alumni"
                                                subtitle="Arsip Kelulusan Siswa"
                                                icon={Award}
                                                color="purple"
                                                isActive={url.startsWith('/master') && activeMasterTab === 'alumni'}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Publikasi & Website */}
                            {(hasPublikasiAccess && !isPublisher && !isCoach) && (
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 px-1">
                                        <span className="size-1.5 rounded-full bg-rose-500"></span>
                                        Publikasi & Website
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {can('news', 'view') && (
                                            <NavCard
                                                href="/news-management"
                                                title="Kelola Berita"
                                                subtitle="Warta & Pengumuman"
                                                icon={Newspaper}
                                                color="orange"
                                                isActive={url.startsWith('/news-management')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('galleries', 'view') && (
                                            <NavCard
                                                href="/manage/galleries"
                                                title="Galeri Kegiatan"
                                                subtitle="Album Dokumentasi Foto"
                                                icon={Images}
                                                color="rose"
                                                isActive={url.startsWith('/manage/galleries')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('school_profile', 'view') && (
                                            <NavCard
                                                href="/manage/school-profile"
                                                title="Profil Sekolah"
                                                subtitle="Visi Misi & Identitas"
                                                icon={Building2}
                                                color="blue"
                                                isActive={url.startsWith('/manage/school-profile')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('school_profile', 'view') && (
                                            <NavCard
                                                href="/manage/teacher-profiles"
                                                title="Profil Guru"
                                                subtitle="Biodata Pengajar Web"
                                                icon={GraduationCap}
                                                color="indigo"
                                                isActive={url.startsWith('/manage/teacher-profiles')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('principal_greeting', 'view') && (
                                            <NavCard
                                                href="/publisher/principal-greeting"
                                                title="Sambutan Kepala Sekolah"
                                                subtitle="Pidato & Foto Resmi"
                                                icon={MessageSquareQuote}
                                                color="orange"
                                                isActive={url.startsWith('/publisher/principal-greeting')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('contact_messages', 'view') && (
                                            <NavCard
                                                href="/manage/contact"
                                                title="Kontak Kami"
                                                subtitle="Pesan & Kotak Saran"
                                                icon={PhoneCall}
                                                color="teal"
                                                isActive={url.startsWith('/manage/contact')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('news', 'view') && (
                                            <NavCard
                                                href="/berita"
                                                title="Berita Publik"
                                                subtitle="Tampilan Portal Warta"
                                                icon={Globe}
                                                color="emerald"
                                                isActive={url.startsWith('/berita')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pengaturan Sistem */}
                            {(hasSettingsAccess && !isPublisher && !isCoach) && (
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 px-1">
                                        <span className="size-1.5 rounded-full bg-blue-500"></span>
                                        Pengaturan Sistem
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {can('school_settings', 'view') && (
                                            <NavCard
                                                href="/admin/school-settings"
                                                title="Pengaturan Sekolah"
                                                subtitle="Logo, Alamat & Jam Masuk"
                                                icon={School}
                                                color="blue"
                                                isActive={url.startsWith('/admin/school-settings')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('holidays', 'view') && (
                                            <NavCard
                                                href="/admin/holidays"
                                                title="Kalender Pendidikan"
                                                subtitle="Jadwal Libur & Efektif"
                                                icon={CalendarDays}
                                                color="emerald"
                                                isActive={url.startsWith('/admin/holidays')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('pwa_notifications', 'view') && (
                                            <div className={(isAdmin || can('permissions', 'view')) ? '' : 'col-span-2'}>
                                                <NavCard
                                                    href="/admin/pwa-notifications"
                                                    title="Notifikasi PWA"
                                                    subtitle="Pengingat Absensi Otomatis"
                                                    icon={BellRing}
                                                    color="orange"
                                                    badge="PWA"
                                                    isActive={url.startsWith('/admin/pwa-notifications')}
                                                    onClick={closeDrawer}
                                                />
                                            </div>
                                        )}
                                        {(isAdmin || can('permissions', 'view')) && (
                                            <NavCard
                                                href="/admin/permissions"
                                                title="Matriks Hak Akses"
                                                subtitle="Wewenang Tiap Peran"
                                                icon={ShieldCheck}
                                                color="purple"
                                                isActive={url.startsWith('/admin/permissions')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {isAdmin && (
                                            <div className="col-span-2">
                                                <NavCard
                                                    href="/admin/tutorials"
                                                    title="Kelola Video Tutorial"
                                                    subtitle="Atur Video Panduan YouTube"
                                                    icon={Video}
                                                    color="rose"
                                                    isActive={url.startsWith('/admin/tutorials')}
                                                    onClick={closeDrawer}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Khusus Role Publisher */}
                            {isPublisher && (
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 px-1">
                                        <span className="size-1.5 rounded-full bg-orange-500"></span>
                                        Publikasi & Konten
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {can('news', 'view') && (
                                            <NavCard
                                                href="/news-management"
                                                title="Kelola Berita"
                                                subtitle="Warta & Pengumuman"
                                                icon={Newspaper}
                                                color="orange"
                                                isActive={url.startsWith('/news-management')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('galleries', 'view') && (
                                            <NavCard
                                                href="/manage/galleries"
                                                title="Galeri Kegiatan"
                                                subtitle="Album Dokumentasi Foto"
                                                icon={Images}
                                                color="rose"
                                                isActive={url.startsWith('/manage/galleries')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('school_profile', 'view') && (
                                            <NavCard
                                                href="/manage/school-profile"
                                                title="Profil Sekolah"
                                                subtitle="Visi Misi & Identitas"
                                                icon={Building2}
                                                color="blue"
                                                isActive={url.startsWith('/manage/school-profile')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {(can('school_profile', 'view') || can('master_teachers', 'view')) && (
                                            <NavCard
                                                href="/manage/teacher-profiles"
                                                title="Profil Guru"
                                                subtitle="Biodata Pengajar Web"
                                                icon={GraduationCap}
                                                color="indigo"
                                                isActive={url.startsWith('/manage/teacher-profiles')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('principal_greeting', 'view') && (
                                            <NavCard
                                                href="/publisher/principal-greeting"
                                                title="Sambutan Kepala Sekolah"
                                                subtitle="Pidato & Foto Resmi"
                                                icon={MessageSquareQuote}
                                                color="orange"
                                                isActive={url.startsWith('/publisher/principal-greeting')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('contact_messages', 'view') && (
                                            <NavCard
                                                href="/manage/contact"
                                                title="Kontak Kami"
                                                subtitle="Pesan & Kotak Saran"
                                                icon={PhoneCall}
                                                color="teal"
                                                isActive={url.startsWith('/manage/contact')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        <div className="col-span-2">
                                            <NavCard
                                                href="/tutorials"
                                                title="Video Tutorial"
                                                subtitle="Panduan Publikasi & Humas"
                                                icon={Video}
                                                color="rose"
                                                isActive={isTutorialsActive}
                                                onClick={closeDrawer}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Khusus Role Coach */}
                            {isCoach && (
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 px-1">
                                        <span className="size-1.5 rounded-full bg-purple-500"></span>
                                        Ekstrakurikuler
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {can('extracurricular', 'create') && (
                                            <NavCard
                                                href="/extracurricular/reports/create"
                                                title="Buat Laporan"
                                                subtitle="Input Sesi Latihan"
                                                icon={Award}
                                                color="purple"
                                                isActive={url === '/extracurricular/reports/create'}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('extracurricular', 'view') && (
                                            <NavCard
                                                href="/extracurricular/reports"
                                                title="Riwayat Laporan"
                                                subtitle="Daftar Sesi Latihan"
                                                icon={FileSpreadsheet}
                                                color="blue"
                                                isActive={url.startsWith('/extracurricular/reports') && url !== '/extracurricular/reports/create'}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        {can('extracurricular', 'roster') && (
                                            <NavCard
                                                href="/extracurricular/roster"
                                                title="Daftar Anggota Siswa"
                                                subtitle="Atur Murid Peserta Ekskul"
                                                icon={Users}
                                                color="emerald"
                                                isActive={url.startsWith('/extracurricular/roster')}
                                                onClick={closeDrawer}
                                            />
                                        )}
                                        <NavCard
                                            href="/tutorials"
                                            title="Video Tutorial"
                                            subtitle="Panduan Pelatih Ekskul"
                                            icon={Video}
                                            color="rose"
                                            isActive={isTutorialsActive}
                                            onClick={closeDrawer}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Account & Profile Actions */}
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <Link
                                    href="/settings/profile"
                                    onClick={closeDrawer}
                                    className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900"
                                >
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                        <User className="size-4 text-gray-600 dark:text-gray-300" />
                                    </div>
                                    Profil & Kata Sandi
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/40 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/50 active:scale-95 transition-all"
                                >
                                    <LogOut className="size-3.5" />
                                    Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
