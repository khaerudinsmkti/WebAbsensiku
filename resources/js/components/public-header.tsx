import { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Building2,
    CalendarDays,
    ChevronDown,
    GraduationCap,
    Home,
    Images,
    LogIn,
    Menu,
    Newspaper,
    PhoneCall,
    Plus,
    Users,
    X,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';

interface SchoolProp {
    name?: string;
    logo_url?: string | null;
}

interface PublicHeaderProps {
    onOpenCreateNews?: () => void;
}

interface SubNavItem {
    title: string;
    description: string;
    href: string;
    icon: any;
    isActive: boolean;
}

interface NavLinkItem {
    title: string;
    href: string;
    icon: any;
    isActive: boolean;
    children?: SubNavItem[];
}

export function PublicHeader({ onOpenCreateNews }: PublicHeaderProps) {
    const { auth, school } = usePage<{ auth: any; school?: SchoolProp }>().props;
    const url = usePage().url;
    const schoolName = school?.name || 'AbsensiKu SD';
    const logoUrl = school?.logo_url;
    const isPublisherOrAdmin = auth?.user?.role === 'publisher' || auth?.user?.role === 'admin';

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isOtherDrawerOpen, setIsOtherDrawerOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isSchoolProfileActive = url === '/profil' || url.startsWith('/profil?');
    const isTeacherProfileActive = url.startsWith('/profil/guru');

    const navLinks: NavLinkItem[] = [
        {
            title: 'Beranda',
            href: '/',
            icon: Home,
            isActive: url === '/',
        },
        {
            title: 'Profil',
            href: '/profil',
            icon: Building2,
            isActive: url.startsWith('/profil'),
            children: [
                {
                    title: 'Profil Sekolah',
                    description: 'Identitas, Visi, Misi & Nilai Utama Sekolah',
                    href: '/profil',
                    icon: Building2,
                    isActive: isSchoolProfileActive,
                },
                {
                    title: 'Profil Guru',
                    description: 'Galeri Foto & Biodata Guru / Wali Kelas',
                    href: '/profil/guru',
                    icon: GraduationCap,
                    isActive: isTeacherProfileActive,
                },
            ],
        },
        {
            title: 'Berita',
            href: '/berita',
            icon: Newspaper,
            isActive: url.startsWith('/berita'),
        },
        {
            title: 'Galeri',
            href: '/galeri',
            icon: Images,
            isActive: url.startsWith('/galeri'),
        },
        {
            title: 'Kalender',
            href: '/kalender',
            icon: CalendarDays,
            isActive: url.startsWith('/kalender'),
        },
        {
            title: 'Kontak',
            href: '/kontak',
            icon: PhoneCall,
            isActive: url.startsWith('/kontak'),
        },
    ];

    return (
        <>
            {/* Top Navigation Bar Header */}
            <header className="sticky top-0 z-30 border-b border-[#E8E8E8] bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-12 dark:border-[#2D234A] dark:bg-[#18122B]/85">
                <div className="flex h-[70px] sm:h-[74px] items-center justify-between gap-2">
                    {/* Logo & School Name */}
                    <div className="flex items-center gap-3 min-w-0">
                        <Link href="/" className="flex items-center gap-3 group min-w-0">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={schoolName}
                                    className="size-11 sm:size-11 shrink-0 object-contain rounded-xl bg-white p-1 shadow-md border border-[#E8E8E8] dark:border-[#2D234A]"
                                />
                            ) : (
                                <div className="flex size-11 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand">
                                    <AppLogoIcon className="size-6 text-white" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <span className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-gray-900 dark:text-white leading-tight group-hover:text-[var(--brand-primary,#FF6B35)] transition-colors line-clamp-1">
                                    {schoolName}
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links (Menu Horizontal + Dropdown Submenu) */}
                    <nav ref={dropdownRef} className="hidden md:flex items-center gap-1 lg:gap-2">
                        {navLinks.map((item) =>
                            item.children ? (
                                <div
                                    key={item.href}
                                    className="relative"
                                    onMouseEnter={() => setOpenDropdown(item.title)}
                                    onMouseLeave={() => setOpenDropdown(null)}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown((prev) => (prev === item.title ? null : item.title))
                                        }
                                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                            item.isActive
                                                ? 'border border-[var(--brand-primary,#FF6B35)]/30 bg-[var(--brand-primary-light,#FFF0EB)] font-black text-[var(--brand-primary,#FF6B35)] shadow-2xs dark:border-[var(--brand-primary,#FF6B35)]/40 dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:text-white'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-[var(--brand-primary,#FF6B35)] dark:text-gray-200 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <item.icon className="size-3.5" />
                                        <span>{item.title}</span>
                                        <ChevronDown
                                            className={`size-3.5 transition-transform duration-200 ${
                                                openDropdown === item.title ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>

                                    {openDropdown === item.title && (
                                        <div className="absolute left-0 top-full pt-2 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                            <div className="rounded-2xl border border-gray-200/90 bg-white p-2 shadow-xl backdrop-blur-xl dark:border-gray-800 dark:bg-[#18122B]">
                                                {item.children.map((sub) => (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        onClick={() => setOpenDropdown(null)}
                                                        className={`flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                                                            sub.isActive
                                                                ? 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:text-white'
                                                                : 'text-gray-700 hover:bg-gray-50 hover:text-[var(--brand-primary,#FF6B35)] dark:text-gray-200 dark:hover:bg-gray-800/60'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                                                                sub.isActive
                                                                    ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                                                    : 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] dark:bg-gray-800 dark:text-white'
                                                            }`}
                                                        >
                                                            <sub.icon className="size-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-extrabold leading-tight">
                                                                {sub.title}
                                                            </div>
                                                            <p className="mt-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-snug">
                                                                {sub.description}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        item.isActive
                                            ? 'border border-[var(--brand-primary,#FF6B35)]/30 bg-[var(--brand-primary-light,#FFF0EB)] font-black text-[var(--brand-primary,#FF6B35)] shadow-2xs dark:border-[var(--brand-primary,#FF6B35)]/40 dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:text-white'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-[var(--brand-primary,#FF6B35)] dark:text-gray-200 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <item.icon className="size-3.5" />
                                    <span>{item.title}</span>
                                </Link>
                            ),
                        )}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {isPublisherOrAdmin && onOpenCreateNews && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onOpenCreateNews}
                                className="hidden lg:inline-flex rounded-xl border-[var(--brand-primary,#FF6B35)]/40 text-xs font-bold text-[var(--brand-primary,#FF6B35)] hover:bg-[var(--brand-primary-light,#FFF0EB)] dark:hover:bg-[var(--brand-primary-dark,#FF6B35)]/20"
                            >
                                <Plus className="mr-1 size-3.5" />
                                Tambah Berita
                            </Button>
                        )}

                        {auth.user ? (
                            <Button
                                asChild
                                variant="primary"
                                size="sm"
                                className="rounded-xl px-3 py-1.5 text-xs font-bold shadow-xs"
                            >
                                <Link href={auth.user?.role === 'publisher' ? '/news-management' : dashboard()}>
                                    <span>{auth.user?.role === 'publisher' ? 'Kelola' : 'Dashboard'}</span>
                                    <ArrowRight className="ml-1 size-3.5" />
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                asChild
                                variant="primary"
                                size="sm"
                                className="rounded-xl px-3 py-1.5 text-xs font-bold shadow-xs"
                            >
                                <Link href={login()}>Masuk</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Slide-Up Bottom Sheet Drawer for "Lainnya" */}
            {isOtherDrawerOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsOtherDrawerOpen(false)}
                    />

                    {/* Bottom Drawer Content */}
                    <div className="fixed bottom-0 inset-x-0 z-50 max-h-[85vh] rounded-t-[28px] border-t border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-[#18122B] overflow-y-auto animate-in slide-in-from-bottom duration-200">
                        {/* Drag Indicator & Header */}
                        <div className="flex flex-col items-center mb-4">
                            <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 mb-3" />
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            alt={schoolName}
                                            className="size-9 rounded-xl object-contain border border-gray-200 bg-white p-0.5 shadow-xs dark:border-gray-700"
                                        />
                                    ) : (
                                        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white shadow-brand">
                                            <AppLogoIcon className="size-5 text-white" />
                                        </div>
                                    )}
                                    <div className="leading-tight">
                                        <h4 className="text-sm font-extrabold text-gray-900 dark:text-white line-clamp-1">
                                            {schoolName}
                                        </h4>
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            Menu Layanan & Informasi Lainnya
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOtherDrawerOpen(false)}
                                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        {/* List of remaining menus */}
                        <div className="space-y-2 mt-4">
                            {/* Kalender */}
                            <Link
                                href="/kalender"
                                onClick={() => setIsOtherDrawerOpen(false)}
                                className={`flex items-center gap-3.5 rounded-2xl p-3.5 border transition-all ${
                                    url.startsWith('/kalender')
                                        ? 'border-[var(--brand-primary,#FF6B35)]/40 bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] shadow-xs dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:border-[var(--brand-primary,#FF6B35)]/40 dark:text-white'
                                        : 'border-gray-100 bg-gray-50/70 hover:bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200'
                                }`}
                            >
                                <div
                                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                                        url.startsWith('/kalender')
                                            ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                            : 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] dark:bg-gray-800 dark:text-white'
                                    }`}
                                >
                                    <CalendarDays className="size-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-black">Kalender Akademik</div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                        Jadwal KBM, Agenda Kegiatan & Libur Sekolah
                                    </div>
                                </div>
                                <ArrowRight className="size-4 text-gray-400" />
                            </Link>

                            {/* Kontak */}
                            <Link
                                href="/kontak"
                                onClick={() => setIsOtherDrawerOpen(false)}
                                className={`flex items-center gap-3.5 rounded-2xl p-3.5 border transition-all ${
                                    url.startsWith('/kontak')
                                        ? 'border-[var(--brand-primary,#FF6B35)]/40 bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] shadow-xs dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:border-[var(--brand-primary,#FF6B35)]/40 dark:text-white'
                                        : 'border-gray-100 bg-gray-50/70 hover:bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200'
                                }`}
                            >
                                <div
                                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                                        url.startsWith('/kontak')
                                            ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                            : 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] dark:bg-gray-800 dark:text-white'
                                    }`}
                                >
                                    <PhoneCall className="size-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-black">Kontak & Aspirasi</div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                        Informasi Kontak, Lokasi & Form Pengaduan
                                    </div>
                                </div>
                                <ArrowRight className="size-4 text-gray-400" />
                            </Link>

                            {/* Profil Guru */}
                            <Link
                                href="/profil/guru"
                                onClick={() => setIsOtherDrawerOpen(false)}
                                className={`flex items-center gap-3.5 rounded-2xl p-3.5 border transition-all ${
                                    url.startsWith('/profil/guru')
                                        ? 'border-[var(--brand-primary,#FF6B35)]/40 bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] shadow-xs dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:border-[var(--brand-primary,#FF6B35)]/40 dark:text-white'
                                        : 'border-gray-100 bg-gray-50/70 hover:bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200'
                                }`}
                            >
                                <div
                                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                                        url.startsWith('/profil/guru')
                                            ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                            : 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] dark:bg-gray-800 dark:text-white'
                                    }`}
                                >
                                    <GraduationCap className="size-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-black">Profil Guru & Staf</div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                        Biodata Tenaga Pendidik & Wali Kelas
                                    </div>
                                </div>
                                <ArrowRight className="size-4 text-gray-400" />
                            </Link>

                            {/* Portal Guru / Dashboard */}
                            <div className="pt-2">
                                {auth?.user ? (
                                    <Link
                                        href={auth.user?.role === 'publisher' ? '/news-management' : dashboard()}
                                        onClick={() => setIsOtherDrawerOpen(false)}
                                        className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] p-4 font-black text-white shadow-brand"
                                    >
                                        <div className="flex items-center gap-3">
                                            <BarChart3 className="size-5" />
                                            <div className="text-left leading-tight">
                                                <div className="text-xs">
                                                    {auth.user?.role === 'publisher' ? 'Panel Kelola Berita' : 'Buka Dashboard Sistem'}
                                                </div>
                                                <div className="text-[10px] text-white/80 font-normal">
                                                    Masuk sebagai {auth.user?.name}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="size-4" />
                                    </Link>
                                ) : (
                                    <Link
                                        href={login()}
                                        onClick={() => setIsOtherDrawerOpen(false)}
                                        className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#20B2AA] to-[#4ECDC4] p-4 font-black text-white shadow-md shadow-teal-500/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <LogIn className="size-5" />
                                            <div className="text-left leading-tight">
                                                <div className="text-xs">Masuk Portal Guru & Staf</div>
                                                <div className="text-[10px] text-white/80 font-normal">
                                                    Akses Presensi & Administrasi
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="size-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar (5 Menu: Beranda, Profil, Berita, Galeri, Lainnya) */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-200/90 bg-white/95 px-1.5 pb-safe backdrop-blur-lg md:hidden dark:border-gray-800/90 dark:bg-[#18122B]/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
                {/* 1. Beranda */}
                <Link
                    href="/"
                    className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-95 ${
                        url === '/'
                            ? 'font-black text-[var(--brand-primary,#FF6B35)]'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                >
                    <div
                        className={`flex size-8.5 items-center justify-center rounded-xl transition-all ${
                            url === '/'
                                ? 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] border border-[var(--brand-primary,#FF6B35)]/35 dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:border-[var(--brand-primary,#FF6B35)]/40 dark:text-white scale-105 shadow-2xs'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        <Home className="size-4.5" />
                    </div>
                    <span className={`text-[10px] tracking-tight ${url === '/' ? 'text-[var(--brand-primary,#FF6B35)] font-black' : 'font-bold'}`}>
                        Beranda
                    </span>
                </Link>

                {/* 2. Profil */}
                <Link
                    href="/profil"
                    className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-95 ${
                        url.startsWith('/profil')
                            ? 'font-black text-[var(--brand-primary,#FF6B35)]'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                >
                    <div
                        className={`flex size-8.5 items-center justify-center rounded-xl transition-all ${
                            url.startsWith('/profil')
                                ? 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] border border-[var(--brand-primary,#FF6B35)]/35 dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:border-[var(--brand-primary,#FF6B35)]/40 dark:text-white scale-105 shadow-2xs'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        <Building2 className="size-4.5" />
                    </div>
                    <span className={`text-[10px] tracking-tight ${url.startsWith('/profil') ? 'text-[var(--brand-primary,#FF6B35)] font-black' : 'font-bold'}`}>
                        Profil
                    </span>
                </Link>

                {/* 3. Berita */}
                <Link
                    href="/berita"
                    className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-95 ${
                        url.startsWith('/berita')
                            ? 'font-black text-[var(--brand-primary,#FF6B35)]'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                >
                    <div
                        className={`flex size-8.5 items-center justify-center rounded-xl transition-all ${
                            url.startsWith('/berita')
                                ? 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] border border-[var(--brand-primary,#FF6B35)]/35 dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:border-[var(--brand-primary,#FF6B35)]/40 dark:text-white scale-105 shadow-2xs'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        <Newspaper className="size-4.5" />
                    </div>
                    <span className={`text-[10px] tracking-tight ${url.startsWith('/berita') ? 'text-[var(--brand-primary,#FF6B35)] font-black' : 'font-bold'}`}>
                        Berita
                    </span>
                </Link>

                {/* 4. Galeri */}
                <Link
                    href="/galeri"
                    className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-95 ${
                        url.startsWith('/galeri')
                            ? 'font-black text-[var(--brand-primary,#FF6B35)]'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                >
                    <div
                        className={`flex size-8.5 items-center justify-center rounded-xl transition-all ${
                            url.startsWith('/galeri')
                                ? 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] border border-[var(--brand-primary,#FF6B35)]/35 dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:border-[var(--brand-primary,#FF6B35)]/40 dark:text-white scale-105 shadow-2xs'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        <Images className="size-4.5" />
                    </div>
                    <span className={`text-[10px] tracking-tight ${url.startsWith('/galeri') ? 'text-[var(--brand-primary,#FF6B35)] font-black' : 'font-bold'}`}>
                        Galeri
                    </span>
                </Link>

                {/* 5. Lainnya (Icon Garis Tiga / Menu) */}
                <button
                    type="button"
                    onClick={() => setIsOtherDrawerOpen(true)}
                    className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-95 cursor-pointer relative ${
                        url.startsWith('/kalender') || url.startsWith('/kontak') || isOtherDrawerOpen
                            ? 'font-black text-[var(--brand-primary,#FF6B35)]'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                >
                    <div
                        className={`flex size-8.5 items-center justify-center rounded-xl transition-all relative ${
                            url.startsWith('/kalender') || url.startsWith('/kontak') || isOtherDrawerOpen
                                ? 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] border border-[var(--brand-primary,#FF6B35)]/35 dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:border-[var(--brand-primary,#FF6B35)]/40 dark:text-white scale-105 shadow-2xs'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        <Menu className="size-4.5" />
                        {(url.startsWith('/kalender') || url.startsWith('/kontak')) && (
                            <span className="absolute top-1 right-1 size-2 rounded-full bg-[var(--brand-primary,#FF6B35)] ring-2 ring-white dark:ring-[#18122B]" />
                        )}
                    </div>
                    <span className={`text-[10px] tracking-tight ${url.startsWith('/kalender') || url.startsWith('/kontak') || isOtherDrawerOpen ? 'text-[var(--brand-primary,#FF6B35)] font-black' : 'font-bold'}`}>
                        Lainnya
                    </span>
                </button>
            </nav>
        </>
    );
}
