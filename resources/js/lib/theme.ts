export interface ThemeConfig {
    id?: string;
    name?: string;
    level?: string;
    badge?: string;
    description?: string;
    primary: string;
    primary_dark?: string;
    primary_light?: string;
    secondary?: string;
    secondary_foreground?: string;
    gradient_to?: string;
    hero_gradient?: string;
    ring?: string;
    shadow?: string;
}

export function applyTheme(theme: ThemeConfig | null | undefined): void {
    if (!theme || !theme.primary || typeof document === 'undefined') {
        return;
    }

    const primary = theme.primary;
    const primaryDark = theme.primary_dark || primary;
    const primaryLight = theme.primary_light || '#FFF0EB';
    const secondary = theme.secondary || '#FFF0EB';
    const secondaryFg = theme.secondary_foreground || primary;
    const ring = theme.ring || `${primary}66`;
    const shadow = theme.shadow || `0 4px 14px ${primary}59`;
    const shadowHover = `0 6px 18px ${primary}73`;
    const heroGradient = theme.hero_gradient || `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`;

    let styleTag = document.getElementById('app-dynamic-theme') as HTMLStyleElement | null;
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'app-dynamic-theme';
    }

    // Always append/move to the end of <head> so it overrides any Vite/external stylesheets
    document.head.appendChild(styleTag);

    styleTag.innerHTML = `
        :root, html, body {
            --primary: ${primary} !important;
            --primary-foreground: #FFFFFF !important;
            --secondary: ${secondary} !important;
            --secondary-foreground: ${secondaryFg} !important;
            --ring: ${ring} !important;
            --chart-1: ${primary} !important;
            --sidebar-primary: ${primary} !important;
            --sidebar-ring: ${primary} !important;

            --brand-primary: ${primary} !important;
            --brand-primary-dark: ${primaryDark} !important;
            --brand-primary-light: ${primaryLight} !important;
            --brand-hero-gradient: ${heroGradient} !important;

            --shadow-brand: ${shadow} !important;
            --shadow-brand-hover: ${shadowHover} !important;
        }

        .dark, html.dark, body.dark {
            --primary: ${primary} !important;
            --primary-foreground: #FFFFFF !important;
            --secondary: #1F1935 !important;
            --secondary-foreground: ${primary} !important;
            --ring: ${ring} !important;
            --chart-1: ${primary} !important;
            --sidebar-primary: ${primary} !important;
            --sidebar-ring: ${primary} !important;

            --brand-primary: ${primary} !important;
            --brand-primary-dark: ${primaryDark} !important;
            --brand-primary-light: #241838 !important;
            --brand-hero-gradient: ${heroGradient} !important;

            --shadow-brand: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
            --shadow-brand-hover: 0 6px 18px rgba(0, 0, 0, 0.55) !important;
        }

        /* Universal Brand Color Mapping for entire system (Admin, Guru, & Public) */
        .bg-\\[\\#FF6B35\\],
        .bg-orange-500,
        .bg-orange-600 {
            background-color: var(--brand-primary) !important;
        }

        .text-\\[\\#FF6B35\\],
        .text-orange-500,
        .text-orange-600 {
            color: var(--brand-primary) !important;
        }

        .border-\\[\\#FF6B35\\] {
            border-color: var(--brand-primary) !important;
        }

        .fill-\\[\\#FF6B35\\] {
            fill: var(--brand-primary) !important;
        }

        .stroke-\\[\\#FF6B35\\] {
            stroke: var(--brand-primary) !important;
        }

        /* Direct Background & Gradient Overrides for Brand Elements */
        .from-\\[\\#FF6B35\\],
        .from-orange-500 {
            --tw-gradient-from: var(--brand-primary) !important;
            --tw-gradient-to: var(--brand-primary-dark) !important;
        }

        .to-\\[\\#FF8C5A\\],
        .to-\\[\\#FF6B35\\],
        .to-\\[\\#E55A25\\],
        .to-\\[\\#E85D26\\],
        .to-orange-500,
        .to-amber-500 {
            --tw-gradient-to: var(--brand-primary-dark) !important;
        }

        /* Ensure any element using brand gradient has solid gradient and clean white text */
        .bg-gradient-to-r.from-\\[\\#FF6B35\\],
        .bg-gradient-to-tr.from-\\[\\#FF6B35\\],
        .bg-gradient-to-br.from-\\[\\#FF6B35\\],
        [class*="from-[#FF6B35]"] {
            background-image: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark)) !important;
            background-color: var(--brand-primary) !important;
        }

        .shadow-brand {
            box-shadow: var(--shadow-brand) !important;
        }

        .bg-\\[\\#FFF0EB\\] {
            background-color: var(--brand-primary-light) !important;
        }

        .text-\\[\\#FF8C5A\\],
        .text-\\[\\#FFA07A\\] {
            color: var(--brand-primary) !important;
        }

        .hover\\:bg-\\[\\#FFF0EB\\]:hover {
            background-color: var(--brand-primary-light) !important;
        }

        /* Universal Hover Title & Logo overrides */
        .group:hover .group-hover\\:text-\\[\\#FF6B35\\],
        .group-hover\\:text-\\[\\#FF6B35\\]:hover,
        .hover\\:text-\\[\\#FF6B35\\]:hover,
        .hover\\:text-orange-500:hover,
        .hover\\:text-orange-600:hover {
            color: var(--brand-primary) !important;
        }

        /* Hero Headline Modern Dynamic Theme Gradient */
        .hero-headline-gradient {
            background-image: var(--brand-hero-gradient) !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            color: transparent !important;
            display: inline;
        }

        /* Card & Element Hover Border Overrides */
        .hover\\:border-\\[\\#FF6B35\\]:hover,
        .hover\\:border-\\[\\#FF6B35\\]\\/40:hover,
        .hover\\:border-\\[\\#FF6B35\\]\\/50:hover,
        [class*="hover:border-[#FF6B35]"]:hover,
        [class*="hover:border-orange"]:hover {
            border-color: var(--brand-primary) !important;
        }

        .focus\\:border-\\[\\#FF6B35\\]:focus,
        .focus-visible\\:border-\\[\\#FF6B35\\]:focus-visible {
            border-color: var(--brand-primary) !important;
        }

        .focus\\:ring-\\[\\#FF6B35\\]:focus,
        .focus-visible\\:ring-\\[\\#FF6B35\\]:focus-visible {
            --tw-ring-color: var(--brand-primary) !important;
        }
    `;

    // Update <meta name="theme-color">
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', primary);
    }

    if (typeof window !== 'undefined') {
        (window as any).__SCHOOL_THEME__ = theme;
    }
}
