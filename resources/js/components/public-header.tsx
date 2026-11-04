import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CalendarDays,
    Home,
    Menu,
    Newspaper,
    PhoneCall,
    Plus,
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

export function PublicHeader({ onOpenCreateNews }: PublicHeaderProps) {
    const { auth, school } = usePage<{ auth: any; school?: SchoolProp }>().props;
    const url = usePage().url;
    const schoolName = school?.name || 'AbsensiKu SD';
    const logoUrl = school?.logo_url;
    const isPublisherOrAdmin = auth?.user?.role === 'publisher' || auth?.user?.role === 'admin';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        {
            title: 'Beranda',
            href: '/',
            icon: Home,
            isActive: url === '/',
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
        <header className="sticky top-0 z-30 border-b border-[#E8E8E8] bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-12 dark:border-[#2D234A] dark:bg-[#18122B]/85">
            <div className="flex h-[72px] items-center justify-between">
                {/* Logo & School Name */}
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-3 group">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={schoolName}
                                className="size-10 object-contain rounded-xl bg-white p-1 shadow-md border border-[#E8E8E8] dark:border-[#2D234A]"
                            />
                        ) : (
                            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FFE66D] text-white shadow-md shadow-[#FF6B35]/25">
                                <AppLogoIcon className="size-6 text-white" />
                            </div>
                        )}
                        <div>
                            <span className="text-base sm:text-lg font-black tracking-tight text-[#111827] dark:text-white leading-tight group-hover:text-[#FF6B35] transition-colors">
                                {schoolName}
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
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

                {/* Right Actions */}
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
                        <Button asChild variant="primary" size="sm" className="hidden sm:inline-flex">
                            <Link href={auth.user?.role === 'publisher' ? '/news-management' : dashboard()}>
                                {auth.user?.role === 'publisher' ? 'Kelola Berita' : 'Dashboard'}
                                <ArrowRight className="ml-1 size-3.5" />
                            </Link>
                        </Button>
                    ) : (
                        <Button asChild variant="primary" size="sm" className="hidden sm:inline-flex">
                            <Link href={login()}>Masuk Sistem</Link>
                        </Button>
                    )}

                    {/* Mobile Menu Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="inline-flex size-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 md:hidden dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
                <div className="border-t border-gray-100 py-3 md:hidden dark:border-gray-800">
                    <div className="grid grid-cols-2 gap-1.5 pb-3">
                        {navLinks.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                    item.isActive
                                        ? 'bg-orange-50 font-black text-[#FF6B35] dark:bg-orange-950/60 dark:text-[#FFA07A]'
                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                                }`}
                            >
                                <item.icon className="size-4" />
                                <span>{item.title}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        {auth.user ? (
                            <Button asChild variant="primary" size="sm" className="w-full justify-center">
                                <Link href={auth.user?.role === 'publisher' ? '/news-management' : dashboard()}>
                                    {auth.user?.role === 'publisher' ? 'Kelola Berita' : 'Masuk Dashboard'}
                                    <ArrowRight className="ml-1.5 size-3.5" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild variant="primary" size="sm" className="w-full justify-center">
                                <Link href={login()}>Masuk Portal Guru & Staf</Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

