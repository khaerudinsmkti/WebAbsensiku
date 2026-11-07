import { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    ChevronDown,
    GraduationCap,
    Home,
    Images,
    Newspaper,
    PhoneCall,
    Plus,
    Users,
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
    const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);
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
                                <span className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-[#111827] dark:text-white leading-tight group-hover:text-[var(--brand-primary,#FF6B35)] transition-colors line-clamp-1">
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

            {/* Mobile Submenu Popup for Profil */}
            {openMobileSubmenu && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                        onClick={() => setOpenMobileSubmenu(null)}
                    />
                    <div className="fixed bottom-20 inset-x-4 z-50 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-gray-800 dark:bg-[#18122B] animate-in slide-in-from-bottom-2 duration-150">
                        <div className="mb-2 px-2 text-[11px] font-black uppercase tracking-wider text-gray-400">
                            Pilih Sub Menu {openMobileSubmenu}
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {navLinks
                                .find((n) => n.title === openMobileSubmenu)
                                ?.children?.map((sub) => (
                                    <Link
                                        key={sub.href}
                                        href={sub.href}
                                        onClick={() => setOpenMobileSubmenu(null)}
                                        className={`flex items-center gap-3 rounded-xl p-3 border transition-all ${
                                            sub.isActive
                                                ? 'border-[var(--brand-primary,#FF6B35)]/40 bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] dark:border-[var(--brand-primary,#FF6B35)]/40 dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:text-white'
                                                : 'border-gray-100 hover:bg-gray-50 text-gray-700 dark:border-gray-800 dark:text-gray-200'
                                        }`}
                                    >
                                        <div
                                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                                                sub.isActive
                                                    ? 'bg-[var(--brand-primary,#FF6B35)] text-white'
                                                    : 'bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] dark:bg-gray-800 dark:text-white'
                                            }`}
                                        >
                                            <sub.icon className="size-4.5" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-extrabold">{sub.title}</div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                                {sub.description}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-gray-200/90 bg-white/95 px-1.5 pb-safe backdrop-blur-lg md:hidden dark:border-gray-800/90 dark:bg-[#18122B]/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
                {navLinks.map((item) =>
                    item.children ? (
                        <button
                            key={item.href}
                            type="button"
                            onClick={() =>
                                setOpenMobileSubmenu((prev) => (prev === item.title ? null : item.title))
                            }
                            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all ${
                                item.isActive || openMobileSubmenu === item.title
                                    ? 'font-black text-[#FF6B35] dark:text-[#FFA07A]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-8 items-center justify-center rounded-xl transition-all ${
                                    item.isActive || openMobileSubmenu === item.title
                                        ? 'bg-orange-100 text-[#FF6B35] dark:bg-orange-950/70 dark:text-[#FFA07A] scale-105 shadow-2xs'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                <item.icon className="size-4.5" />
                            </div>
                            <span className="inline-flex items-center gap-0.5 text-[10px] tracking-tight font-bold">
                                {item.title}
                                <ChevronDown className="size-2.5" />
                            </span>
                        </button>
                    ) : (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all ${
                                item.isActive
                                    ? 'font-black text-[#FF6B35] dark:text-[#FFA07A]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            <div
                                className={`flex size-8 items-center justify-center rounded-xl transition-all ${
                                    item.isActive
                                        ? 'bg-orange-100 text-[#FF6B35] dark:bg-orange-950/70 dark:text-[#FFA07A] scale-105 shadow-2xs'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                <item.icon className="size-4.5" />
                            </div>
                            <span className="text-[10px] tracking-tight font-bold">
                                {item.title}
                            </span>
                        </Link>
                    ),
                )}
            </nav>
        </>
    );
}
