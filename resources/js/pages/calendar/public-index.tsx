import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    CalendarCheck,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileSpreadsheet,
    Info,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/public-header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';

interface DayCalendarItem {
    date: string;
    day: number;
    day_of_week: number;
    day_name: string;
    is_sunday: boolean;
    is_saturday?: boolean;
    is_saturday_off?: boolean;
    is_holiday: boolean;
    is_off: boolean;
    is_today: boolean;
    holiday_name?: string | null;
    holiday_type?: string | null;
    holiday_type_name?: string | null;
    holiday_description?: string | null;
}

interface HolidayItem {
    id: number;
    name: string;
    type: string;
    type_name: string;
    start_date: string;
    end_date: string;
    formatted_dates: string;
    description?: string | null;
}

interface CalendarData {
    month: number;
    year: number;
    month_name: string;
    is_current_month: boolean;
    prev_month: number;
    prev_year: number;
    next_month: number;
    next_year: number;
    first_day_of_week: number;
    days_count: number;
    days: DayCalendarItem[];
    holidays: HolidayItem[];
    effective_days: number;
    holiday_days: number;
    total_days: number;
    school_days_per_week?: number;
    is_saturday_holiday?: boolean;
}

interface CalendarPageProps {
    calendar: CalendarData;
}

export default function PublicCalendarIndex({ calendar }: CalendarPageProps) {
    const { school } = usePage<{ school?: { name?: string } }>().props;
    const schoolName = school?.name || 'AbsensiKu SD';

    const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    const navigateCalendar = (m: number, y: number) => {
        router.get(
            '/kalender',
            { month: m, year: y },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <>
            <Head title={`Kalender Akademik - ${schoolName}`} />

            <div className="flex min-h-screen flex-col bg-page-gradient text-[#1F2937] dark:text-neutral-100">
                <PublicHeader />

                <main className="flex-1 px-4 py-8 sm:px-6 lg:px-12">
                    <div className="mx-auto max-w-6xl space-y-8">
                        {/* Title Header */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:border-orange-900 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                    <CalendarDays className="size-3.5" />
                                    Jadwal & Agenda Resmi
                                </div>
                                <h1 className="mt-2 text-2xl font-black text-[#111827] sm:text-3xl dark:text-white">
                                    Kalender Akademik Sekolah
                                </h1>
                                <p className="mt-1 text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                    Pantau hari efektif belajar, libur nasional, akhir pekan, dan agenda kegiatan sekolah secara transparan.
                                </p>
                            </div>

                            {/* Navigasi Bulan */}
                            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xs dark:border-gray-800 dark:bg-gray-800">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigateCalendar(calendar.prev_month, calendar.prev_year)}
                                    className="size-8 rounded-xl text-gray-600 hover:text-[#FF6B35] dark:text-gray-300"
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>

                                <span className="px-3 text-xs font-extrabold text-gray-900 dark:text-white">
                                    {calendar.month_name}
                                </span>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigateCalendar(calendar.next_month, calendar.next_year)}
                                    className="size-8 rounded-xl text-gray-600 hover:text-[#FF6B35] dark:text-gray-300"
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Calendar Card Container */}
                        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#18122B]">
                            {/* Summary Cards */}
                            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                                        <CalendarCheck className="size-5" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-emerald-900 dark:text-emerald-200 leading-tight">
                                            {Math.round(calendar.effective_days)} Hari
                                        </div>
                                        <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                            Hari Efektif KBM
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-2xl bg-rose-50/70 p-3.5 border border-rose-200/60 dark:bg-rose-950/30 dark:border-rose-900/40">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                                        <Clock className="size-5" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-rose-900 dark:text-rose-200 leading-tight">
                                            {Math.round(calendar.holiday_days)} Hari
                                        </div>
                                        <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                                            Libur & Akhir Pekan
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-2xl bg-amber-50/70 p-3.5 border border-amber-200/60 dark:bg-amber-950/30 dark:border-amber-900/40">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                                        <span className="text-base font-black">📌</span>
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-amber-900 dark:text-amber-200 leading-tight">
                                            {calendar.holidays.length} Agenda
                                        </div>
                                        <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                            Hari Libur Resmi
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-2xl bg-blue-50/70 p-3.5 border border-blue-200/60 dark:bg-blue-950/30 dark:border-blue-900/40">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                        <span className="text-base font-black">📅</span>
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-blue-900 dark:text-blue-200 leading-tight">
                                            {Math.round(calendar.total_days)} Hari
                                        </div>
                                        <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                                            Total Hari Kalender
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Grid: Matriks Hari & Daftar Libur */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                {/* Left: Matrix 7 Kolom */}
                                <div className="lg:col-span-8">
                                    <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
                                        {dayLabels.map((lbl, idx) => {
                                            const isSunday = idx === 0;
                                            const isSaturdayOff = idx === 6 && calendar.school_days_per_week === 5;
                                            return (
                                                <div
                                                    key={lbl}
                                                    className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg ${
                                                        isSunday || isSaturdayOff
                                                            ? 'text-red-500 bg-red-50/50 dark:bg-red-950/20'
                                                            : 'text-gray-600 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {lbl}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1.5">
                                        {/* Blank cell offset */}
                                        {Array.from({ length: calendar.first_day_of_week }).map((_, i) => (
                                            <div
                                                key={`blank-${i}`}
                                                className="h-14 sm:h-16 rounded-xl border border-transparent bg-gray-50/30 dark:bg-gray-900/20"
                                            />
                                        ))}

                                        {/* Days */}
                                        {calendar.days.map((d) => {
                                            let cellBg = 'bg-white border-gray-200 hover:border-orange-300 dark:bg-gray-800/80 dark:border-gray-700';
                                            let textColor = 'text-gray-900 dark:text-white';

                                            if (d.is_today) {
                                                cellBg = 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20';
                                                textColor = 'text-white';
                                            } else if (d.is_holiday) {
                                                cellBg = 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200';
                                                textColor = 'text-red-600 dark:text-red-400';
                                            } else if (d.is_sunday || d.is_saturday_off) {
                                                cellBg = 'bg-red-50/40 border-red-100 text-red-700 dark:bg-red-950/20 dark:border-red-900/40';
                                                textColor = 'text-red-500';
                                            }

                                            return (
                                                <div
                                                    key={d.date}
                                                    title={d.holiday_name || (d.is_off ? 'Hari Libur' : 'Hari Efektif KBM')}
                                                    className={`relative flex h-14 sm:h-16 flex-col justify-between rounded-xl border p-1.5 sm:p-2 text-left transition-all ${cellBg}`}
                                                >
                                                    <span className={`text-xs sm:text-sm font-extrabold ${textColor}`}>
                                                        {d.day}
                                                    </span>

                                                    {d.holiday_name && !d.is_today && (
                                                        <span className="line-clamp-1 text-[9px] font-semibold text-red-700 dark:text-red-300 leading-tight">
                                                            {d.holiday_name}
                                                        </span>
                                                    )}

                                                    {d.is_today && (
                                                        <span className="text-[9px] font-black uppercase text-white/90">
                                                            Hari Ini
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Legend */}
                                    <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600 dark:text-gray-300 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-1.5">
                                            <span className="size-3 rounded-md bg-white border border-gray-300" />
                                            <span>Hari Efektif Belajar</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="size-3 rounded-md bg-red-500" />
                                            <span>Libur Nasional / Semester</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="size-3 rounded-md bg-red-100 border border-red-300" />
                                            <span>Akhir Pekan (Sabtu/Minggu)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="size-3 rounded-md bg-[#FF6B35]" />
                                            <span>Hari Ini</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Daftar Hari Libur & Event */}
                                <div className="flex flex-col rounded-2xl border-2 border-gray-100 bg-gray-50/60 p-5 lg:col-span-4 dark:border-gray-800 dark:bg-gray-900/50">
                                    <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
                                        <span className="text-sm font-black text-gray-900 dark:text-white">
                                            Agenda Libur Bulan Ini
                                        </span>
                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-extrabold text-red-800 dark:bg-red-950 dark:text-red-300">
                                            {calendar.holidays.length}
                                        </span>
                                    </div>

                                    <div className="mt-3.5 flex-1 divide-y divide-gray-200/80 overflow-y-auto max-h-[380px] dark:divide-gray-800">
                                        {calendar.holidays.length === 0 ? (
                                            <div className="flex h-48 flex-col items-center justify-center text-center text-gray-400">
                                                <CalendarCheck className="size-8 text-emerald-500/70 mb-2" />
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    Tidak Ada Libur Khusus
                                                </span>
                                                <p className="mt-1 text-[11px] text-gray-500 max-w-[200px]">
                                                    Semua hari sekolah pada bulan ini berjalan efektif untuk proses belajar mengajar.
                                                </p>
                                            </div>
                                        ) : (
                                            calendar.holidays.map((h) => (
                                                <div key={h.id} className="py-3 first:pt-0 last:pb-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-md bg-[#FFF0EB] px-2 py-0.5 font-mono text-[11px] font-extrabold text-[#FF6B35] dark:bg-[#3D1A10]">
                                                            {h.formatted_dates}
                                                        </span>
                                                        <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-800 dark:bg-red-950 dark:text-red-300">
                                                            {h.type_name}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1.5 text-xs font-bold text-gray-900 dark:text-white">
                                                        {h.name}
                                                    </div>
                                                    {h.description && (
                                                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                                                            {h.description}
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="mt-4 rounded-xl bg-white p-3 text-[11px] text-gray-500 border border-gray-200/70 shadow-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                                        <div className="flex items-start gap-2">
                                            <Info className="size-3.5 text-[#FF6B35] shrink-0 mt-0.5" />
                                            <span>
                                                Tanggal libur resmi di atas otomatis disinkronkan ke seluruh sistem dan tidak dihitung dalam rekapitulasi ketidakhadiran siswa.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-[#E8E8E8] bg-white/70 py-6 text-center text-xs text-[#6B7280] backdrop-blur-md dark:border-[#2D234A] dark:bg-[#18122B]/70 dark:text-[#9CA3AF]">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                        <div>
                            &copy; {new Date().getFullYear()} {schoolName}. All rights reserved.
                        </div>
                    </div>
                </footer>

                <PwaInstallPrompt />
            </div>
        </>
    );
}

