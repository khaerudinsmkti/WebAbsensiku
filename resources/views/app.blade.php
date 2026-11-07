<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        @php
            $schoolSetting = \App\Models\SchoolSetting::getSetting();
            $schoolLogoUrl = $schoolSetting->logo_path ? '/storage/' . ltrim($schoolSetting->logo_path, '/') : null;
            $appName = $schoolSetting->name ?: config('app.name', 'AbsensiKu SD');
            $pwaVersion = $schoolSetting->updated_at ? $schoolSetting->updated_at->timestamp : (file_exists(public_path('manifest.json')) ? filemtime(public_path('manifest.json')) : time());
            $themeData = \App\Services\ThemeService::getTheme($schoolSetting->theme_color ?? 'sd-orange');
        @endphp

        <script>
            window.__SCHOOL_NAME__ = @json($appName);
            window.__SCHOOL_LOGO__ = @json($schoolLogoUrl);
            window.__SCHOOL_THEME__ = @json($themeData);
        </script>

        {{-- Dynamic Favicon & Icons from School Settings --}}
        @if($schoolLogoUrl)
            <link rel="icon" href="{{ $schoolLogoUrl }}?v={{ $pwaVersion }}">
            <link rel="shortcut icon" href="{{ $schoolLogoUrl }}?v={{ $pwaVersion }}">
            <link rel="apple-touch-icon" href="/icons/icon-maskable-192x192.png?v={{ $pwaVersion }}">
        @else
            <link rel="icon" href="/icons/icon-192x192.png?v={{ $pwaVersion }}" type="image/png">
            <link rel="shortcut icon" href="/icons/icon-192x192.png?v={{ $pwaVersion }}">
            <link rel="apple-touch-icon" href="/icons/icon-maskable-192x192.png?v={{ $pwaVersion }}">
        @endif

        {{-- PWA Manifest & Meta Tags (Judul Aplikasi & Logo Dinamis dari Pengaturan Sekolah) --}}
        <link rel="manifest" href="/manifest.json?v={{ $pwaVersion }}">
        <meta name="theme-color" content="{{ $themeData['primary'] }}">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="{{ $appName }}">
        <meta name="application-name" content="{{ $appName }}">

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ $appName }}</title>
        </x-inertia::head>

        {{-- Dynamic School Theme Overrides (Placed at end of head to override all stylesheets) --}}
        {!! \App\Services\ThemeService::renderThemeCss($schoolSetting->theme_color ?? 'sd-orange') !!}
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />

        {{-- Register Service Worker for PWA --}}
        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                        function(reg) {
                            console.log('[PWA] Service Worker terdaftar dengan scope:', reg.scope);
                        },
                        function(err) {
                            console.warn('[PWA] Pendaftaran Service Worker gagal:', err);
                        }
                    );
                });
            }
        </script>
    </body>
</html>
