import { createInertiaApp, router } from '@inertiajs/react';
import { ScrollToTopButton } from '@/components/scroll-to-top-button';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { applyTheme } from '@/lib/theme';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const cleanPageTitle = (rawTitle: string, schoolName: string): string => {
    if (!rawTitle) return '';
    let t = rawTitle.trim();

    // Hapus akhiran yang sebelumnya tertulis redundan seperti " - AbsensiKu", " - Laravel", " - {schoolName}"
    const escapedSchool = schoolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`\\s*-\\s*${escapedSchool}$`, 'i'), '');
    t = t.replace(/\s*-\s*AbsensiKu(?:\s*SD)?$/i, '');
    t = t.replace(/\s*-\s*Laravel$/i, '');
    t = t.replace(/\s*-\s*Sistem Presensi Siswa Digital$/i, '');
    t = t.trim();

    return t;
};

const getSchoolName = (): string => {
    if (typeof window !== 'undefined') {
        const globalName = (window as any).__SCHOOL_NAME__;
        if (globalName && typeof globalName === 'string') return globalName;
    }
    return import.meta.env.VITE_APP_NAME || 'SD Digital Indonesia';
};

// Sync school name and theme dynamically across SPA page transitions
if (typeof window !== 'undefined') {
    const syncThemeAndName = (pageProps: any) => {
        if (!pageProps) return;
        const nameFromProps = pageProps.school?.name || pageProps.name;
        if (nameFromProps) {
            (window as any).__SCHOOL_NAME__ = nameFromProps;
        }

        const themeFromProps = pageProps.school?.theme_data || pageProps.setting?.theme_data;
        if (themeFromProps) {
            applyTheme(themeFromProps);
        }
    };

    router.on('navigate', (event) => {
        syncThemeAndName((event as any).detail?.page?.props);
    });

    router.on('success', (event) => {
        syncThemeAndName((event as any).detail?.page?.props);
    });

    // Initial check from window object if server injected it
    if ((window as any).__SCHOOL_THEME__) {
        applyTheme((window as any).__SCHOOL_THEME__);
    }
}

void createInertiaApp({
    title: (title) => {
        const schoolName = getSchoolName();
        if (!title) return schoolName;

        const cleaned = cleanPageTitle(title, schoolName);

        // Jika judul setelah dibersihkan kosong atau sama dengan nama sekolah, formatkan sebagai Beranda - Nama Sekolah
        if (!cleaned || cleaned.toLowerCase() === schoolName.toLowerCase()) {
            return `Beranda - ${schoolName}`;
        }

        return `${cleaned} - ${schoolName}`;
    },
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'profile/public-index':
            case name === 'profile/public-teachers':
            case name === 'news/public-index':
            case name === 'gallery/public-index':
            case name === 'calendar/public-index':
            case name === 'contact/public-index':
            case name.endsWith('/public-index'):
            case name.startsWith('public/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <ScrollToTopButton />
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#FF6B35',
    },
});

// This will set light / dark mode on load...
initializeTheme();
