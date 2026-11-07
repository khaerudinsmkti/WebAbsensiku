<?php

namespace App\Services;

class ThemeService
{
    /**
     * Daftar seluruh tema warna bernuansa sekolah SD, SMP, SMA/SMK
     * yang modern, elegan, dan kekinian.
     */
    public static function getThemes(): array
    {
        return [
            // ==========================================
            // KELOMPOK TEMA SEKOLAH DASAR (SD)
            // ==========================================
            'sd-merah' => [
                'id' => 'sd-merah',
                'name' => 'Merah Ceria SD',
                'level' => 'SD',
                'badge' => 'Seragam SD Nasional',
                'description' => 'Terinspirasi dari seragam merah-putih SD nasional. Melambangkan keberanian, semangat belajar aktif, dan kehangatan anak.',
                'primary' => '#DC2626',
                'primary_dark' => '#B91C1C',
                'primary_light' => '#FEF2F2',
                'primary_dark_mode' => '#EF4444',
                'secondary' => '#FEE2E2',
                'secondary_foreground' => '#DC2626',
                'secondary_dark_mode' => '#3B1219',
                'secondary_fg_dark' => '#FCA5A5',
                'ring' => 'rgba(220, 38, 38, 0.4)',
                'ring_dark' => 'rgba(239, 68, 68, 0.5)',
                'gradient_from' => '#DC2626',
                'gradient_to' => '#EF4444',
                'hero_gradient' => 'linear-gradient(135deg, #DC2626 0%, #F43F5E 50%, #F59E0B 100%)',
                'shadow_brand' => '0 4px 14px rgba(220, 38, 38, 0.35)',
                'shadow_brand_hover' => '0 6px 18px rgba(220, 38, 38, 0.45)',
            ],
            'sd-orange' => [
                'id' => 'sd-orange',
                'name' => 'Oranye Enerjik SD',
                'level' => 'SD',
                'badge' => 'Kreatif & Ceria',
                'description' => 'Warna oranye hangat yang ramah anak, memicu kreativitas, antusiasme, serta rasa percaya diri dalam belajar.',
                'primary' => '#FF6B35',
                'primary_dark' => '#E55A25',
                'primary_light' => '#FFF0EB',
                'primary_dark_mode' => '#FF8C5A',
                'secondary' => '#FFF0EB',
                'secondary_foreground' => '#FF6B35',
                'secondary_dark_mode' => '#2E1912',
                'secondary_fg_dark' => '#FFAC82',
                'ring' => 'rgba(255, 107, 53, 0.4)',
                'ring_dark' => 'rgba(255, 140, 90, 0.5)',
                'gradient_from' => '#FF6B35',
                'gradient_to' => '#FF8C5A',
                'hero_gradient' => 'linear-gradient(135deg, #FF6B35 0%, #F59E0B 50%, #10B981 100%)',
                'shadow_brand' => '0 4px 14px rgba(255, 107, 53, 0.35)',
                'shadow_brand_hover' => '0 6px 18px rgba(255, 107, 53, 0.45)',
            ],
            'sd-amber' => [
                'id' => 'sd-amber',
                'name' => 'Kuning Mentari SD',
                'level' => 'SD',
                'badge' => 'Hangat & Riang',
                'description' => 'Nuansa mentari pagi keemasan yang ceria dan penuh harapan untuk membimbing generasi muda berkarakter luhur.',
                'primary' => '#D97706',
                'primary_dark' => '#B45309',
                'primary_light' => '#FFFBEB',
                'primary_dark_mode' => '#F59E0B',
                'secondary' => '#FEF3C7',
                'secondary_foreground' => '#B45309',
                'secondary_dark_mode' => '#38230B',
                'secondary_fg_dark' => '#FCD34D',
                'ring' => 'rgba(217, 119, 6, 0.4)',
                'ring_dark' => 'rgba(245, 158, 11, 0.5)',
                'gradient_from' => '#D97706',
                'gradient_to' => '#F59E0B',
                'hero_gradient' => 'linear-gradient(135deg, #D97706 0%, #EA580C 50%, #059669 100%)',
                'shadow_brand' => '0 4px 14px rgba(217, 119, 6, 0.35)',
                'shadow_brand_hover' => '0 6px 18px rgba(217, 119, 6, 0.45)',
            ],

            // ==========================================
            // KELOMPOK TEMA SEKOLAH MENENGAH PERTAMA (SMP)
            // ==========================================
            'smp-biru' => [
                'id' => 'smp-biru',
                'name' => 'Biru Bahari SMP',
                'level' => 'SMP',
                'badge' => 'Seragam SMP Nasional',
                'description' => 'Terinspirasi dari seragam biru dongker SMP nasional. Melambangkan kedewasaan awal, kedisiplinan, dan ketenangan berpikir.',
                'primary' => '#2563EB',
                'primary_dark' => '#1D4ED8',
                'primary_light' => '#EFF6FF',
                'primary_dark_mode' => '#3B82F6',
                'secondary' => '#DBEAFE',
                'secondary_foreground' => '#1D4ED8',
                'secondary_dark_mode' => '#112240',
                'secondary_fg_dark' => '#93C5FD',
                'ring' => 'rgba(37, 99, 235, 0.4)',
                'ring_dark' => 'rgba(59, 130, 246, 0.5)',
                'gradient_from' => '#2563EB',
                'gradient_to' => '#3B82F6',
                'hero_gradient' => 'linear-gradient(135deg, #2563EB 0%, #06B6D4 50%, #10B981 100%)',
                'shadow_brand' => '0 4px 14px rgba(37, 99, 235, 0.35)',
                'shadow_brand_hover' => '0 6px 18px rgba(37, 99, 235, 0.45)',
            ],
            'smp-tosca' => [
                'id' => 'smp-tosca',
                'name' => 'Tosca Digital SMP',
                'level' => 'SMP',
                'badge' => 'Sains & Teknologi',
                'description' => 'Warna teal/tosca modern yang sejuk, merefleksikan semangat riset ilmiah, literasi teknologi, dan inovasi sekolah digital.',
                'primary' => '#0D9488',
                'primary_dark' => '#0F766E',
                'primary_light' => '#F0FDFA',
                'primary_dark_mode' => '#14B8A6',
                'secondary' => '#CCFBF1',
                'secondary_foreground' => '#0F766E',
                'secondary_dark_mode' => '#0A2523',
                'secondary_fg_dark' => '#5EEAD4',
                'ring' => 'rgba(13, 148, 136, 0.4)',
                'ring_dark' => 'rgba(20, 184, 166, 0.5)',
                'gradient_from' => '#0D9488',
                'gradient_to' => '#14B8A6',
                'hero_gradient' => 'linear-gradient(135deg, #0D9488 0%, #10B981 50%, #0284C7 100%)',
                'shadow_brand' => '0 4px 14px rgba(13, 148, 136, 0.35)',
                'shadow_brand_hover' => '0 6px 18px rgba(13, 148, 136, 0.45)',
            ],
            'smp-indigo' => [
                'id' => 'smp-indigo',
                'name' => 'Indigo Prestasi SMP',
                'level' => 'SMP',
                'badge' => 'Cakrawala Ilmu',
                'description' => 'Perpaduan biru dan ungu yang tegas serta visioner, menggambarkan ketajaman intelektual dan budaya berprestasi.',
                'primary' => '#4F46E5',
                'primary_dark' => '#4338CA',
                'primary_light' => '#EEF2FF',
                'primary_dark_mode' => '#6366F1',
                'secondary' => '#E0E7FF',
                'secondary_foreground' => '#4338CA',
                'secondary_dark_mode' => '#1E1B4B',
                'secondary_fg_dark' => '#A5B4FC',
                'ring' => 'rgba(79, 70, 229, 0.4)',
                'ring_dark' => 'rgba(99, 102, 241, 0.5)',
                'gradient_from' => '#4F46E5',
                'gradient_to' => '#6366F1',
                'hero_gradient' => 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)',
                'shadow_brand' => '0 4px 14px rgba(79, 70, 229, 0.35)',
                'shadow_brand_hover' => '0 6px 18px rgba(79, 70, 229, 0.45)',
            ],

            // ==========================================
            // KELOMPOK TEMA SEKOLAH MENENGAH ATAS / KEJURUAN (SMA / SMK)
            // ==========================================
            'sma-slate' => [
                'id' => 'sma-slate',
                'name' => 'Abu-abu Elegan SMA',
                'level' => 'SMA / SMK',
                'badge' => 'Seragam SMA Nasional',
                'description' => 'Terinspirasi dari seragam abu-abu SMA nasional. Tampilan berwibawa, elegan, intelektual, dan matang menyongsong masa depan.',
                'primary' => '#475569',
                'primary_dark' => '#334155',
                'primary_light' => '#F8FAFC',
                'primary_dark_mode' => '#64748B',
                'secondary' => '#F1F5F9',
                'secondary_foreground' => '#334155',
                'secondary_dark_mode' => '#1E293B',
                'secondary_fg_dark' => '#CBD5E1',
                'ring' => 'rgba(71, 85, 105, 0.4)',
                'ring_dark' => 'rgba(100, 116, 139, 0.5)',
                'gradient_from' => '#475569',
                'gradient_to' => '#64748B',
                'hero_gradient' => 'linear-gradient(135deg, #475569 0%, #3B82F6 50%, #0D9488 100%)',
                'shadow_brand' => '0 4px 14px rgba(71, 85, 105, 0.35)',
                'shadow_brand_hover' => '0 6px 18px rgba(71, 85, 105, 0.45)',
            ],
            'sma-emerald' => [
                'id' => 'sma-emerald',
                'name' => 'Hijau Zamrud Madrasah / SMA',
                'level' => 'SMA / SMK',
                'badge' => 'Religius & Harmoni',
                'description' => 'Hijau zamrud yang teduh dan prestisius, cocok untuk Madrasah Aliyah atau SMA berwawasan lingkungan dan berakhlak mulia.',
                'primary' => '#059669',
                'primary_dark' => '#047857',
                'primary_light' => '#ECFDF5',
                'primary_dark_mode' => '#10B981',
                'secondary' => '#D1FAE5',
                'secondary_foreground' => '#047857',
                'secondary_dark_mode' => '#062E1F',
                'secondary_fg_dark' => '#6EE7B7',
                'ring' => 'rgba(5, 150, 105, 0.4)',
                'ring_dark' => 'rgba(16, 185, 129, 0.5)',
                'gradient_from' => '#059669',
                'gradient_to' => '#10B981',
                'hero_gradient' => 'linear-gradient(135deg, #059669 0%, #0D9488 50%, #EAB308 100%)',
                'shadow_brand' => '0 4px 14px rgba(5, 150, 105, 0.35)',
                'shadow_brand_hover' => '0 6px 18px rgba(5, 150, 105, 0.45)',
            ],
            'sma-violet' => [
                'id' => 'sma-violet',
                'name' => 'Ungu Kejuruan SMK',
                'level' => 'SMA / SMK',
                'badge' => 'Vokasi & Inovasi',
                'description' => 'Warna ungu megah yang elegan dan artistik, mencerminkan keahlian vokasi kejuruan, keterampilan praktis, dan kreativitas tinggi.',
                'primary' => '#7C3AED',
                'primary_dark' => '#6D28D9',
                'primary_light' => '#F5F3FF',
                'primary_dark_mode' => '#8B5CF6',
                'secondary' => '#EDE9FE',
                'secondary_foreground' => '#6D28D9',
                'secondary_dark_mode' => '#281347',
                'secondary_fg_dark' => '#C4B5FD',
                'ring' => 'rgba(124, 58, 237, 0.4)',
                'ring_dark' => 'rgba(139, 92, 246, 0.5)',
                'gradient_from' => '#7C3AED',
                'gradient_to' => '#8B5CF6',
                'hero_gradient' => 'linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F59E0B 100%)',
                'shadow_brand' => '0 4px 14px rgba(124, 58, 237, 0.35)',
                'shadow_brand_hover' => '0 6px 18px rgba(124, 58, 237, 0.45)',
            ],
            'sma-rose' => [
                'id' => 'sma-rose',
                'name' => 'Mawar Modern SMA',
                'level' => 'SMA / SMK',
                'badge' => 'Estetika & Prestise',
                'description' => 'Aura warna ruby/rose yang eksklusif, kekinian, dan berkelas tinggi untuk citra sekolah unggulan berstandar modern.',
                'primary' => '#E11D48',
                'primary_dark' => '#BE123C',
                'primary_light' => '#FFF1F2',
                'primary_dark_mode' => '#F43F5E',
                'secondary' => '#FFE4E6',
                'secondary_foreground' => '#BE123C',
                'secondary_dark_mode' => '#3D0D19',
                'secondary_fg_dark' => '#FDA4AF',
                'ring' => 'rgba(225, 29, 72, 0.4)',
                'ring_dark' => 'rgba(244, 63, 94, 0.5)',
                'gradient_from' => '#E11D48',
                'gradient_to' => '#F43F5E',
                'hero_gradient' => 'linear-gradient(135deg, #E11D48 0%, #F43F5E 50%, #7C3AED 100%)',
                'shadow_brand' => '0 4px 14px rgba(225, 29, 72, 0.35)',
                'shadow_brand_hover' => '0 6px 18px rgba(225, 29, 72, 0.45)',
            ],
        ];
    }

    /**
     * Dapatkan detail tema berdasarkan ID (fallback ke 'sd-orange').
     */
    public static function getTheme(?string $id): array
    {
        $themes = static::getThemes();

        if ($id && isset($themes[$id])) {
            return $themes[$id];
        }

        return $themes['sd-orange'];
    }

    /**
     * Render inline CSS overrides for application-wide theme consistency.
     */
    public static function renderThemeCss(?string $themeId): string
    {
        $theme = static::getTheme($themeId);

        $primary = $theme['primary'];
        $primaryDark = $theme['primary_dark'] ?? $primary;
        $primaryLight = $theme['primary_light'] ?? '#FFF0EB';
        $secondary = $theme['secondary'] ?? '#FFF0EB';
        $secondaryFg = $theme['secondary_foreground'] ?? $primary;
        $ring = $theme['ring'] ?? 'rgba(255, 107, 53, 0.4)';
        $shadow = $theme['shadow_brand'] ?? '0 4px 14px rgba(255, 107, 53, 0.35)';
        $shadowHover = $theme['shadow_brand_hover'] ?? '0 6px 18px rgba(255, 107, 53, 0.45)';
        $heroGradient = $theme['hero_gradient'] ?? "linear-gradient(135deg, {$primary} 0%, {$primaryDark} 100%)";

        $primaryDarkM = $theme['primary_dark_mode'] ?? $primary;
        $secondaryDarkM = $theme['secondary_dark_mode'] ?? '#241838';
        $secondaryFgDark = $theme['secondary_fg_dark'] ?? $primaryDarkM;
        $ringDark = $theme['ring_dark'] ?? 'rgba(255, 140, 90, 0.5)';

        $css = "
        <style id=\"app-dynamic-theme\">
            :root, html, body {
                --primary: {$primary} !important;
                --primary-foreground: #FFFFFF !important;
                --secondary: {$secondary} !important;
                --secondary-foreground: {$secondaryFg} !important;
                --ring: {$ring} !important;
                --chart-1: {$primary} !important;
                --sidebar-primary: {$primary} !important;
                --sidebar-ring: {$primary} !important;

                --brand-primary: {$primary} !important;
                --brand-primary-dark: {$primaryDark} !important;
                --brand-primary-light: {$primaryLight} !important;
                --brand-hero-gradient: {$heroGradient} !important;

                --shadow-brand: {$shadow} !important;
                --shadow-brand-hover: {$shadowHover} !important;
            }

            .dark, html.dark, body.dark {
                --primary: {$primaryDarkM} !important;
                --primary-foreground: #FFFFFF !important;
                --secondary: {$secondaryDarkM} !important;
                --secondary-foreground: {$secondaryFgDark} !important;
                --ring: {$ringDark} !important;
                --chart-1: {$primaryDarkM} !important;
                --sidebar-primary: {$primaryDarkM} !important;
                --sidebar-ring: {$primaryDarkM} !important;

                --brand-primary: {$primaryDarkM} !important;
                --brand-primary-dark: {$primary} !important;
                --brand-primary-light: {$secondaryDarkM} !important;
                --brand-hero-gradient: {$heroGradient} !important;

                --shadow-brand: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
                --shadow-brand-hover: 0 6px 18px rgba(0, 0, 0, 0.55) !important;
            }

            /* Universal Brand Color Mapping for entire system (Admin, Guru, & Public) */
            .bg-\[\#FF6B35\],
            .bg-orange-500,
            .bg-orange-600 {
                background-color: var(--brand-primary) !important;
            }

            .text-\[\#FF6B35\],
            .text-orange-500,
            .text-orange-600 {
                color: var(--brand-primary) !important;
            }

            .border-\[\#FF6B35\] {
                border-color: var(--brand-primary) !important;
            }

            .fill-\[\#FF6B35\] {
                fill: var(--brand-primary) !important;
            }

            .stroke-\[\#FF6B35\] {
                stroke: var(--brand-primary) !important;
            }

            /* Direct Background & Gradient Overrides for Brand Elements */
            .from-\[\#FF6B35\],
            .from-orange-500 {
                --tw-gradient-from: var(--brand-primary) !important;
                --tw-gradient-to: var(--brand-primary-dark) !important;
            }

            .to-\[\#FF8C5A\],
            .to-\[\#FF6B35\],
            .to-\[\#E55A25\],
            .to-\[\#E85D26\],
            .to-orange-500,
            .to-amber-500 {
                --tw-gradient-to: var(--brand-primary-dark) !important;
            }

            /* Ensure any element using brand gradient has solid gradient and clean white text */
            .bg-gradient-to-r.from-\[\#FF6B35\],
            .bg-gradient-to-tr.from-\[\#FF6B35\],
            .bg-gradient-to-br.from-\[\#FF6B35\],
            [class*='from-[#FF6B35]'] {
                background-image: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark)) !important;
                background-color: var(--brand-primary) !important;
            }

            .shadow-brand {
                box-shadow: var(--shadow-brand) !important;
            }

            .bg-\[\#FFF0EB\] {
                background-color: var(--brand-primary-light) !important;
            }

            .text-\[\#FF8C5A\],
            .text-\[\#FFA07A\] {
                color: var(--brand-primary) !important;
            }

            .hover\:bg-\[\#FFF0EB\]:hover {
                background-color: var(--brand-primary-light) !important;
            }

            /* Universal Hover Title & Logo overrides */
            .group:hover .group-hover\:text-\[\#FF6B35\],
            .group-hover\:text-\[\#FF6B35\]:hover,
            .hover\:text-\[\#FF6B35\]:hover,
            .hover\:text-orange-500:hover,
            .hover\:text-orange-600:hover {
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
            .hover\:border-\[\#FF6B35\]:hover,
            .hover\:border-\[\#FF6B35\]\/40:hover,
            .hover\:border-\[\#FF6B35\]\/50:hover,
            [class*='hover:border-[#FF6B35]']:hover,
            [class*='hover:border-orange']:hover {
                border-color: var(--brand-primary) !important;
            }

            .focus\:border-\[\#FF6B35\]:focus,
            .focus-visible\:border-\[\#FF6B35\]:focus-visible {
                border-color: var(--brand-primary) !important;
            }

            .focus\:ring-\[\#FF6B35\]:focus,
            .focus-visible\:ring-\[\#FF6B35\]:focus-visible {
                --tw-ring-color: var(--brand-primary) !important;
            }
        </style>
        ";

        return $css;
    }
}
