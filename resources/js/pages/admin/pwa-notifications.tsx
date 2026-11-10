import { Head, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Bell,
    BellOff,
    BellRing,
    CheckCircle2,
    Clock,
    HelpCircle,
    Info,
    Laptop,
    MessageSquare,
    Play,
    Save,
    Send,
    Settings,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Volume2,
    VolumeX,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { PageBanner } from '@/components/page-banner';
import { Button } from '@/components/ui/button';

interface PwaNotificationConfig {
    pwa_reminder_enabled: boolean;
    pwa_reminder_interval_minutes: number;
    pwa_reminder_start_time: string;
    pwa_reminder_end_time: string;
    pwa_reminder_title: string;
    pwa_reminder_message: string;
    pwa_notify_news: boolean;
    pwa_sound_enabled: boolean;
    school_name: string;
    logo_url: string | null;
}

interface PageProps {
    config: PwaNotificationConfig;
}

const INTERVAL_OPTIONS = [
    { value: 15, label: '15 Menit (Cepat - Uji Coba)', desc: 'Pengingat muncul setiap 15 menit jika belum absen' },
    { value: 30, label: '30 Menit (Setengah Jam)', desc: 'Pengingat muncul setiap 30 menit' },
    { value: 45, label: '45 Menit', desc: 'Pengingat muncul setiap 45 menit' },
    { value: 60, label: '60 Menit (1 Jam - Standar)', desc: 'Pengingat muncul berkala setiap 1 jam' },
    { value: 90, label: '90 Menit (1.5 Jam)', desc: 'Pengingat muncul setiap satu setengah jam' },
    { value: 120, label: '120 Menit (2 Jam)', desc: 'Pengingat muncul setiap 2 jam sekali' },
    { value: 180, label: '180 Menit (3 Jam)', desc: 'Pengingat muncul setiap 3 jam sekali' },
];

export default function PwaNotificationSettingsPage({ config }: PageProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        pwa_reminder_enabled: config.pwa_reminder_enabled ?? true,
        pwa_reminder_interval_minutes: config.pwa_reminder_interval_minutes ?? 60,
        pwa_reminder_start_time: config.pwa_reminder_start_time || '07:00',
        pwa_reminder_end_time: config.pwa_reminder_end_time || '14:00',
        pwa_reminder_title: config.pwa_reminder_title || 'Pengingat Presensi Siswa ⏰',
        pwa_reminder_message: config.pwa_reminder_message || 'Presensi kelas hari ini belum selesai diinput. Mohon segera mengisi absensi siswa.',
        pwa_notify_news: config.pwa_notify_news ?? true,
        pwa_sound_enabled: config.pwa_sound_enabled ?? true,
    });

    const [testStatus, setTestStatus] = useState<string | null>(null);

    const playNotificationSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            // Nada manis dua ketukan (bell chime)
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch {
            // Audio context not allowed or failed
        }
    };

    const handleTestNotification = async () => {
        setTestStatus(null);

        if (typeof window === 'undefined' || !('Notification' in window)) {
            setTestStatus('Peramban web ini tidak mendukung fitur HTML5 Web Notification.');
            return;
        }

        let permission = Notification.permission;
        if (permission === 'default') {
            try {
                permission = await Notification.requestPermission();
            } catch {
                permission = 'denied';
            }
        }

        if (permission !== 'granted') {
            setTestStatus('Izin notifikasi belum diberikan pada peramban. Silakan izinkan notifikasi pada ikon gembok di bilah alamat browser.');
            return;
        }

        if (data.pwa_sound_enabled) {
            playNotificationSound();
        }

        try {
            const notif = new Notification(data.pwa_reminder_title, {
                body: data.pwa_reminder_message || `Halo Bapak/Ibu Guru, jangan lupa mengisi presensi siswa hari ini.`,
                icon: config.logo_url || '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                tag: 'pwa-test-notification',
            });

            notif.onclick = () => {
                window.focus();
                notif.close();
            };

            setTestStatus('sukses');
            setTimeout(() => setTestStatus(null), 6000);
        } catch {
            setTestStatus('Gagal mengirimkan notifikasi. Pastikan perizinan browser Anda aktif.');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/pwa-notifications', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Pengaturan Notifikasi PWA" />

            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
                {/* Banner Header */}
                <PageBanner
                    badgeText="Pengaturan Sistem"
                    title="Pengaturan Notifikasi & Pengingat PWA"
                    description="Kelola jadwal pengingat absensi otomatis untuk guru, interval pengingat berkala, jam kerja aktif, template pesan notifikasi, dan integrasi Progressive Web App."
                />

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div className="text-sm font-semibold">{flash.success}</div>
                    </div>
                )}

                {recentlySuccessful && !flash?.success && (
                    <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div className="text-sm font-semibold">Pengaturan notifikasi PWA berhasil disimpan.</div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column: Form Settings (7 cols) */}
                    <div className="lg:col-span-7">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            {/* Card 1: Pengingat Presensi Guru */}
                            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                                <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950/60">
                                            <BellRing className="size-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                                                Pengingat Presensi Otomatis
                                            </h2>
                                            <p className="text-xs text-gray-500">
                                                Notifikasi berkala bagi guru yang belum mengisi absensi siswa
                                            </p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.pwa_reminder_enabled}
                                            onChange={(e) => setData('pwa_reminder_enabled', e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:top-[2px] after:left-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#FF6B35] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden dark:bg-gray-700"></div>
                                    </label>
                                </div>

                                <div className="space-y-4">
                                    {/* Status Info */}
                                    <div className={`flex items-start gap-3 rounded-xl p-3.5 text-xs transition-all ${
                                        data.pwa_reminder_enabled
                                            ? 'border border-orange-200 bg-orange-50/70 text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-300'
                                            : 'border border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400'
                                    }`}>
                                        {data.pwa_reminder_enabled ? (
                                            <Zap className="size-4 shrink-0 text-[#FF6B35] mt-0.5" />
                                        ) : (
                                            <BellOff className="size-4 shrink-0 text-gray-400 mt-0.5" />
                                        )}
                                        <div>
                                            <span className="font-bold">
                                                {data.pwa_reminder_enabled ? 'Pengingat Aktif' : 'Pengingat Nonaktif'}:
                                            </span>{' '}
                                            {data.pwa_reminder_enabled
                                                ? 'Sistem akan otomatis memunculkan pop-up pemberitahuan dan push notification browser ke guru yang belum mengabsen kelasnya.'
                                                : 'Pengingat otomatis dinonaktifkan sementara. Guru tidak akan menerima pemberitahuan berkala.'}
                                        </div>
                                    </div>

                                    {/* Interval Pengingat */}
                                    <div>
                                        <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            <span>Frekuensi Interval Pengingat <span className="text-red-500">*</span></span>
                                            <span className="text-[10px] text-gray-400 lowercase font-medium">muncul berkala</span>
                                        </label>
                                        <select
                                            disabled={!data.pwa_reminder_enabled}
                                            value={data.pwa_reminder_interval_minutes}
                                            onChange={(e) => setData('pwa_reminder_interval_minutes', parseInt(e.target.value, 10))}
                                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-800 shadow-2xs transition-all focus:border-[#FF6B35] focus:outline-none focus:ring-3 focus:ring-[#FF6B35]/15 disabled:bg-gray-100 disabled:opacity-60 dark:border-gray-700/80 dark:bg-gray-900/60 dark:text-white"
                                        >
                                            {INTERVAL_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                            {INTERVAL_OPTIONS.find((o) => o.value === data.pwa_reminder_interval_minutes)?.desc}
                                        </p>
                                        {errors.pwa_reminder_interval_minutes && (
                                            <p className="mt-1 text-xs text-red-500">{errors.pwa_reminder_interval_minutes}</p>
                                        )}
                                    </div>

                                    {/* Rentang Jam Operasional */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                <Clock className="size-3.5 text-[#FF6B35]" />
                                                Jam Mulai Aktif <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="time"
                                                disabled={!data.pwa_reminder_enabled}
                                                value={data.pwa_reminder_start_time}
                                                onChange={(e) => setData('pwa_reminder_start_time', e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-800 shadow-2xs transition-all focus:border-[#FF6B35] focus:outline-none focus:ring-3 focus:ring-[#FF6B35]/15 disabled:bg-gray-100 disabled:opacity-60 dark:border-gray-700/80 dark:bg-gray-900/60 dark:text-white"
                                            />
                                            {errors.pwa_reminder_start_time && (
                                                <p className="mt-1 text-xs text-red-500">{errors.pwa_reminder_start_time}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                <Clock className="size-3.5 text-[#FF6B35]" />
                                                Jam Berakhir Pengingat <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="time"
                                                disabled={!data.pwa_reminder_enabled}
                                                value={data.pwa_reminder_end_time}
                                                onChange={(e) => setData('pwa_reminder_end_time', e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-800 shadow-2xs transition-all focus:border-[#FF6B35] focus:outline-none focus:ring-3 focus:ring-[#FF6B35]/15 disabled:bg-gray-100 disabled:opacity-60 dark:border-gray-700/80 dark:bg-gray-900/60 dark:text-white"
                                            />
                                            {errors.pwa_reminder_end_time && (
                                                <p className="mt-1 text-xs text-red-500">{errors.pwa_reminder_end_time}</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                        Pengingat hanya akan aktif dan berbunyi di antara rentang jam di atas (misal jam sekolah: 07:00 s/d 14:00).
                                    </p>

                                    {/* Template Pesan Notifikasi */}
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Judul Notifikasi <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.pwa_reminder_title}
                                            onChange={(e) => setData('pwa_reminder_title', e.target.value)}
                                            placeholder="Contoh: Pengingat Presensi Siswa ⏰"
                                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 shadow-2xs transition-all focus:border-[#FF6B35] focus:outline-none focus:ring-3 focus:ring-[#FF6B35]/15 dark:border-gray-700/80 dark:bg-gray-900/60 dark:text-white"
                                        />
                                        {errors.pwa_reminder_title && (
                                            <p className="mt-1 text-xs text-red-500">{errors.pwa_reminder_title}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Isi Teks / Template Pesan Pengingat
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={data.pwa_reminder_message}
                                            onChange={(e) => setData('pwa_reminder_message', e.target.value)}
                                            placeholder="Tulis pesan pengingat yang ramah dan jelas..."
                                            className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs font-medium text-gray-800 shadow-2xs transition-all focus:border-[#FF6B35] focus:outline-none focus:ring-3 focus:ring-[#FF6B35]/15 dark:border-gray-700/80 dark:bg-gray-900/60 dark:text-white"
                                        />
                                        {errors.pwa_reminder_message && (
                                            <p className="mt-1 text-xs text-red-500">{errors.pwa_reminder_message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Preferensi Notifikasi & Audio */}
                            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                                <div className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-4 dark:border-gray-800">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950/60">
                                        <Volume2 className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                                            Suara & Fitur Notifikasi PWA
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Pengaturan audio notifikasi serta integrasi informasi sekolah
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Sound Toggle */}
                                    <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3.5 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-gray-800/40">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100/70 text-[#FF6B35] dark:bg-orange-950">
                                                {data.pwa_sound_enabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                                                    Suara / Nada Dering Notifikasi
                                                </h4>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    Bunyikan chime audio halus ketika notifikasi pengingat muncul di layar
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.pwa_sound_enabled}
                                                onChange={(e) => setData('pwa_sound_enabled', e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:top-[2px] after:left-[2px] after:size-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#FF6B35] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-700"></div>
                                        </label>
                                    </div>

                                    {/* News Push Notification Toggle */}
                                    <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3.5 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-gray-800/40">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100/70 text-[#FF6B35] dark:bg-orange-950">
                                                <MessageSquare className="size-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                                                    Notifikasi Pengumuman & Berita Baru
                                                </h4>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    Pemberitahuan otomatis ke pengguna saat ada rilis berita atau pengumuman sekolah
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.pwa_notify_news}
                                                onChange={(e) => setData('pwa_notify_news', e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:top-[2px] after:left-[2px] after:size-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#FF6B35] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-700"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Simpan */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-[#FF6B35] hover:bg-[#E85D26] px-6 py-2.5 font-bold text-white shadow-md shadow-orange-500/20 text-xs"
                                >
                                    <Save className="mr-2 size-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Pengaturan Notifikasi'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Live Interactive Preview & Simulator (5 cols) */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* Live Mobile Notification Preview */}
                        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="size-4.5 text-[#FF6B35]" />
                                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                                        Pratinjau Notifikasi PWA
                                    </h3>
                                </div>
                                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase text-[#FF6B35] dark:bg-orange-950/60">
                                    Live Preview
                                </span>
                            </div>

                            {/* Mock Mobile Notification Card */}
                            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4 shadow-lg dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
                                {/* Notification Header */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                        {config.logo_url ? (
                                            <img
                                                src={config.logo_url}
                                                alt="Logo"
                                                className="size-5 rounded-md object-contain border border-gray-200 dark:border-gray-700 bg-white p-0.5"
                                            />
                                        ) : (
                                            <div className="flex size-5 items-center justify-center rounded-md bg-[#FF6B35] text-[10px] font-black text-white">
                                                A
                                            </div>
                                        )}
                                        <span className="font-extrabold text-gray-800 dark:text-gray-200 truncate max-w-[170px]">
                                            {config.school_name || 'Presensi Digital PWA'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">Baru saja</span>
                                </div>

                                {/* Notification Body */}
                                <div className="mt-3">
                                    <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                        {data.pwa_reminder_title || 'Pengingat Presensi Siswa ⏰'}
                                    </h4>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {data.pwa_reminder_message || 'Presensi kelas hari ini belum selesai diinput. Mohon segera mengisi absensi siswa.'}
                                    </p>
                                </div>

                                {/* Simulated Action Buttons */}
                                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                                    <button
                                        type="button"
                                        className="flex-1 rounded-lg bg-[#FF6B35] py-1.5 text-center text-[11px] font-bold text-white shadow-xs hover:bg-[#E85D26]"
                                    >
                                        Absen Sekarang
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center text-[11px] font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    >
                                        Nanti
                                    </button>
                                </div>
                            </div>

                            {/* Uji Coba Button */}
                            <div className="mt-4 space-y-2">
                                <Button
                                    type="button"
                                    onClick={handleTestNotification}
                                    variant="outline"
                                    className="w-full rounded-xl border-orange-300 bg-orange-50/50 hover:bg-orange-100/70 font-extrabold text-[#FF6B35] text-xs py-2.5 transition-all dark:border-orange-800 dark:bg-orange-950/30 dark:hover:bg-orange-950/50"
                                >
                                    <Send className="mr-2 size-4" />
                                    Uji Coba Notifikasi di Perangkat Ini
                                </Button>

                                {testStatus === 'sukses' && (
                                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                                        <span>Notifikasi uji coba berhasil dikirim ke layar Anda!</span>
                                    </div>
                                )}

                                {testStatus && testStatus !== 'sukses' && (
                                    <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
                                        <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                                        <span>{testStatus}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Petunjuk & Kompatibilitas PWA */}
                        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                                <ShieldCheck className="size-4 text-emerald-500" />
                                Dukungan Perangkat & PWA
                            </div>

                            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                <div className="flex items-start gap-2.5">
                                    <Smartphone className="size-4 shrink-0 text-[#FF6B35] mt-0.5" />
                                    <div>
                                        <span className="font-bold text-gray-900 dark:text-white">Android & Chrome:</span> Mendukung native web notification dan badge saat aplikasi PWA diinstall ke layar utama.
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Smartphone className="size-4 shrink-0 text-[#FF6B35] mt-0.5" />
                                    <div>
                                        <span className="font-bold text-gray-900 dark:text-white">iOS / iPhone (Safari):</span> Didukung pada iOS 16.4+ setelah webapp ditambahkan ke Layar Utama (Add to Home Screen).
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Laptop className="size-4 shrink-0 text-[#FF6B35] mt-0.5" />
                                    <div>
                                        <span className="font-bold text-gray-900 dark:text-white">Laptop & Komputer:</span> Mendukung browser Chrome, Microsoft Edge, Firefox, dan Opera secara penuh.
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 rounded-xl bg-gray-50 p-3 border border-gray-100 text-[11px] text-gray-500 dark:bg-gray-900/40 dark:border-gray-800 dark:text-gray-400">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Tips:</span> Pastikan guru mengizinkan akses notifikasi saat pertama kali diminta oleh sistem agar pengingat berkala dapat berbunyi tepat waktu.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

PwaNotificationSettingsPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pengaturan Notifikasi PWA', href: '/admin/pwa-notifications' },
    ],
};
