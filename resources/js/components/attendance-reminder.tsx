import { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Bell,
    BellRing,
    CalendarCheck,
    CheckCircle2,
    Clock,
    ClockAlert,
    ExternalLink,
    Sparkles,
    UserCheck,
    Volume2,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Auth } from '@/types';

// Helper function to check if current time is within operational hours
function isWithinActiveHours(startTime?: string, endTime?: string): boolean {
    if (!startTime || !endTime) return true;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startTotal = (startH || 0) * 60 + (startM || 0);
    const endTotal = (endH || 0) * 60 + (endM || 0);

    return currentMins >= startTotal && currentMins <= endTotal;
}

// Play a subtle chime sound for notification
function playNotificationChime() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
    } catch {
        // Ignore audio errors
    }
}

export function AttendanceReminder() {
    const { auth, school } = usePage<{
        auth: Auth;
        school?: {
            pwa_reminder_enabled?: boolean;
            pwa_reminder_interval_minutes?: number;
            pwa_reminder_start_time?: string;
            pwa_reminder_end_time?: string;
            pwa_reminder_title?: string;
            pwa_reminder_message?: string;
            pwa_sound_enabled?: boolean;
            logo_url?: string | null;
        };
    }>().props;

    const user = auth?.user;
    const pendingAttendance = auth?.pending_attendance;

    const [isOpen, setIsOpen] = useState(false);
    const [browserNotificationAllowed, setBrowserNotificationAllowed] = useState(false);
    const checkTimerRef = useRef<NodeJS.Timeout | null>(null);

    const isTeacher = user?.role === 'teacher';
    const isReminderEnabled = school?.pwa_reminder_enabled !== false;
    const intervalMinutes = Number(school?.pwa_reminder_interval_minutes) || 60;
    const intervalMs = intervalMinutes * 60 * 1000;
    const isSoundEnabled = school?.pwa_sound_enabled !== false;

    const needsAttendance = Boolean(
        isReminderEnabled &&
        isTeacher &&
        pendingAttendance?.needs_attendance &&
        pendingAttendance.pending_classes.length > 0
    );

    // Storage key unik untuk user dan tanggal hari ini
    const storageKey = pendingAttendance?.date && user?.id
        ? `attendance_reminder_last_shown_${user.id}_${pendingAttendance.date}`
        : null;

    const showReminderNotification = () => {
        if (!needsAttendance || !storageKey || !pendingAttendance) return;

        // Cek jam operasional
        if (!isWithinActiveHours(school?.pwa_reminder_start_time, school?.pwa_reminder_end_time)) {
            return;
        }

        setIsOpen(true);
        try {
            localStorage.setItem(storageKey, Date.now().toString());
        } catch {
            // Ignore local storage error
        }

        if (isSoundEnabled) {
            playNotificationChime();
        }

        // Tampilkan juga native HTML5 Browser Notification jika diizinkan
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const classNames = pendingAttendance.pending_classes.map((c) => c.name).join(', ');
            const notificationTitle = school?.pwa_reminder_title || 'Pengingat Presensi Siswa ⏰';
            const notificationBody = school?.pwa_reminder_message
                ? `${school.pwa_reminder_message} (Kelas: ${classNames})`
                : `Halo ${user?.name || 'Bapak/Ibu Guru'}, Anda belum mengisi presensi hari ini untuk ${classNames}. Harap segera lakukan absensi.`;

            try {
                new Notification(notificationTitle, {
                    body: notificationBody,
                    icon: school?.logo_url || '/icons/icon-192x192.png',
                    tag: 'attendance-hourly-reminder',
                });
            } catch {
                // Ignore notification construction error on some mobile devices
            }
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Cek status izin notifikasi browser
        if ('Notification' in window) {
            setBrowserNotificationAllowed(Notification.permission === 'granted');
        }

        if (!needsAttendance || !storageKey) {
            setIsOpen(false);
            return;
        }

        // Cek kapan terakhir kali pengingat ditampilkan
        const lastShownRaw = localStorage.getItem(storageKey);
        const lastShown = lastShownRaw ? parseInt(lastShownRaw, 10) : 0;
        const now = Date.now();

        // Jika belum pernah ditampilkan hari ini, atau sudah melewati interval sejak pengingat terakhir
        if (!lastShown || now - lastShown >= intervalMs) {
            // Tampilkan setelah jeda 1.2 detik agar UI termuat mulus
            const initialTimeout = setTimeout(() => {
                showReminderNotification();
            }, 1200);

            return () => clearTimeout(initialTimeout);
        }

        // Set interval pengecekan berkala (setiap 30 detik mengecek apakah sudah genap jeda interval)
        checkTimerRef.current = setInterval(() => {
            const currentLastShownRaw = localStorage.getItem(storageKey);
            const currentLastShown = currentLastShownRaw ? parseInt(currentLastShownRaw, 10) : 0;
            const currentNow = Date.now();

            if (currentNow - currentLastShown >= intervalMs) {
                showReminderNotification();
            }
        }, 30000);

        return () => {
            if (checkTimerRef.current) {
                clearInterval(checkTimerRef.current);
            }
        };
    }, [needsAttendance, storageKey, intervalMs]);

    const requestNotificationPermission = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        try {
            const permission = await Notification.requestPermission();
            setBrowserNotificationAllowed(permission === 'granted');
            if (permission === 'granted') {
                if (isSoundEnabled) {
                    playNotificationChime();
                }
                new Notification('Notifikasi Diaktifkan! 🔔', {
                    body: `Pengingat presensi akan otomatis muncul berkala jika belum melakukan absensi.`,
                    icon: school?.logo_url || '/icons/icon-192x192.png',
                });
            }
        } catch {
            // Ignore error
        }
    };

    const handlePostponeReminder = () => {
        if (storageKey) {
            // Set waktu sekarang agar reminder berikutnya tepat sesuai interval
            try {
                localStorage.setItem(storageKey, Date.now().toString());
            } catch {
                // Ignore
            }
        }
        setIsOpen(false);
    };

    if (!needsAttendance || !pendingAttendance) {
        return null;
    }

    const pendingClasses = pendingAttendance.pending_classes;
    const firstClass = pendingClasses[0];

    const intervalLabel = intervalMinutes >= 60
        ? `${intervalMinutes / 60} Jam`
        : `${intervalMinutes} Menit`;

    return (
        <>
            {/* Modal Dialog Pengingat Tiap Jam / Interval */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md overflow-hidden rounded-3xl border-2 border-orange-200 bg-white p-0 shadow-2xl dark:border-orange-900/60 dark:bg-[#18122B]">
                    {/* Header Banner */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#FF6B35] via-[#FF8C5A] to-[#FFA07A] p-6 text-white">
                        <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-xl" />
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner text-white">
                                <ClockAlert className="size-6.5 animate-bounce" />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                                    <Sparkles className="size-3" />
                                    Pemberitahuan Setiap {intervalLabel}
                                </div>
                                <DialogTitle className="mt-1 text-lg font-black text-white">
                                    {school?.pwa_reminder_title || 'Presensi Hari Ini Belum Diisi!'}
                                </DialogTitle>
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="space-y-4 p-6 pt-4">
                        <DialogDescription className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                            {school?.pwa_reminder_message ? (
                                <span>{school.pwa_reminder_message}</span>
                            ) : (
                                <>
                                    Halo <strong>{user?.name}</strong>, Anda belum melakukan pengisian presensi siswa untuk hari ini (<strong>{pendingAttendance.formatted_date}</strong>). Mohon segera lakukan absensi agar rekap harian sekolah tercatat lengkap.
                                </>
                            )}
                        </DialogDescription>

                        {/* Daftar Kelas Yang Belum Diabsen */}
                        <div className="space-y-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                                Kelas Yang Belum Diabsen ({pendingClasses.length}):
                            </span>
                            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                                {pendingClasses.map((classroom) => (
                                    <div
                                        key={classroom.id}
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-3.5 dark:border-orange-900/40 dark:bg-orange-950/40"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-900/60 dark:text-orange-300 font-black text-xs">
                                                <UserCheck className="size-4.5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-gray-900 dark:text-white">
                                                    {classroom.name}
                                                </h4>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    {classroom.recorded_count} dari {classroom.students_count} siswa diabsen
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            asChild
                                            size="sm"
                                            className="rounded-xl bg-[#FF6B35] hover:bg-[#E85D26] px-3 py-1 text-xs font-bold text-white shadow-xs"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <Link href={`/attendances?classroom_id=${classroom.id}`}>
                                                Absen Sekarang
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Opsi Izin Browser Notification */}
                        {!browserNotificationAllowed && typeof window !== 'undefined' && 'Notification' in window && (
                            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-2.5 dark:border-gray-800 dark:bg-gray-800/60 text-xs">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                    <Bell className="size-4 text-[#FF6B35] shrink-0" />
                                    <span className="text-[11px] leading-tight">
                                        Aktifkan notifikasi browser agar tetap diingatkan setiap {intervalLabel}.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={requestNotificationPermission}
                                    className="shrink-0 text-[11px] font-bold text-[#FF6B35] hover:underline"
                                >
                                    Izinkan
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <DialogFooter className="border-t border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/40 sm:flex-row sm:justify-between sm:space-x-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handlePostponeReminder}
                            className="rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-200/60 dark:text-gray-400"
                        >
                            <Clock className="mr-1.5 size-3.5" />
                            Ingatkan {intervalLabel} Lagi
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                asChild
                                size="sm"
                                className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D26] text-xs font-black text-white shadow-md shadow-orange-500/25"
                                onClick={() => setIsOpen(false)}
                            >
                                <Link href={firstClass ? `/attendances?classroom_id=${firstClass.id}` : '/attendances'}>
                                    <CalendarCheck className="mr-1.5 size-4" />
                                    Buka Halaman Presensi
                                </Link>
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Floating Top/Bottom Persistent Warning Banner (Jika Dialog Ditutup, Tetap Ada Penanda Ringkas) */}
            {!isOpen && (
                <div className="fixed bottom-20 md:bottom-5 left-4 z-40 max-w-sm animate-in slide-in-from-left duration-300">
                    <div
                        onClick={() => setIsOpen(true)}
                        className="group flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-orange-300 bg-white/95 p-3 shadow-xl backdrop-blur-md transition-all hover:scale-[1.02] hover:border-[#FF6B35] dark:border-orange-800/80 dark:bg-[#18122B]/95"
                    >
                        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] shadow-xs dark:bg-orange-950 dark:text-orange-300">
                            <BellRing className="size-5 animate-pulse" />
                            <span className="absolute -top-1 -right-1 flex size-3">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#FF6B35] opacity-75"></span>
                                <span className="relative inline-flex size-3 rounded-full bg-[#FF6B35]"></span>
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B35]">
                                    Pengingat Presensi
                                </span>
                                <span className="text-[10px] text-gray-400">&bull; Tiap {intervalLabel}</span>
                            </div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                                {pendingClasses.length} Kelas Belum Diabsen Hari Ini
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-xl px-2.5 text-xs font-bold text-[#FF6B35] group-hover:bg-orange-50 dark:group-hover:bg-orange-950/60"
                        >
                            Buka
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
