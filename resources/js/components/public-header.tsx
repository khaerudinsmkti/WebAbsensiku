import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    Home,
    Newspaper,
    PhoneCall,
    Plus,
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

export function PublicHeader({ onOpenCreateNews }: PublicHeaderProps) {
    const { auth, school } = usePage<{ auth: any; school?: SchoolProp }>().props;
    const url = usePage().url;
    const schoolName = school?.name || 'AbsensiKu SD';
    const logoUrl = school?.logo_url;
    const isPublisherOrAdmin = auth?.user?.role === 'publisher' || auth?.user?.role === 'admin';

    const navLinks = [
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
        },
        {
            title: 'Berita',
            href: '/berita',
            icon: Newspaper,
            isActive: url.startsWith('/berita'),
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
                <div className="flex h-[68px] sm:h-[72px] items-center justify-between">
                    {/* Logo & School Name */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={schoolName}
                                    className="size-9 sm:size-10 object-contain rounded-xl bg-white p-1 shadow-md border border-[#E8E8E8] dark:border-[#2D234A]"
                                />
                            ) : (
                                <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FFE66D] text-white shadow-md shadow-[#FF6B35]/25">
                                    <AppLogoIcon className="size-5 sm:size-6 text-white" />
                                </div>
                            )}
                            <div>
                                <span className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-[#111827] dark:text-white leading-tight group-hover:text-[#FF6B35] transition-colors line-clamp-1">
                                    {schoolName}
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links (Menu Horizontal) */}
                    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                        {navLinks.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    item.isActive
                                        ? 'border border-orange-200 bg-orange-50 font-black text-[#FF6B35] shadow-2xs dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-[#FFA07A]'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-[#FF6B35] dark:text-gray-200 dark:hover:bg-gray-800'
                                }`}
                            >
                                <item.icon className="size-3.5" />
                                <span>{item.title}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Right Actions (Tombol Akses & Tanpa Tombol Garis Tiga) */}
                    <div className="flex items-center gap-2">
                        {isPublisherOrAdmin && onOpenCreateNews && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onOpenCreateNews}
                                className="hidden lg:inline-flex rounded-xl border-[#FF6B35]/40 text-xs font-bold text-[#FF6B35] hover:bg-[#FFF0EB] dark:hover:bg-[#331C1A]"
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
                                className="rounded-xl px-3 py-1.5 text-xs font-bold shadow-xs bg-[#FF6B35] hover:bg-[#E85D26] text-white"
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
                                className="rounded-xl px-3 py-1.5 text-xs font-bold shadow-xs bg-[#FF6B35] hover:bg-[#E85D26] text-white"
                            >
                                <Link href={login()}>Masuk</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation Bar (Tombol Navigasi Mobile) */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-gray-200/90 bg-white/95 px-1.5 pb-safe backdrop-blur-lg md:hidden dark:border-gray-800/90 dark:bg-[#18122B]/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
                {navLinks.map((item) => (
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
                ))}
            </nav>
        </>
    );
}
