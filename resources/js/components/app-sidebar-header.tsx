import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { Auth, BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BellRing } from 'lucide-react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth, school } = usePage<{
        auth: Auth;
        school?: { name?: string; logo_url?: string };
    }>().props;
    const isTeacherDuty = auth?.user?.role === 'teacher' && auth?.user?.is_duty_teacher_today;
    const pendingAttendance = auth?.pending_attendance;
    const hasPendingAttendance = auth?.user?.role === 'teacher' && pendingAttendance?.needs_attendance && (pendingAttendance?.pending_classes?.length ?? 0) > 0;

    return (
        <header className="sticky top-0 z-20 flex h-16 md:h-[68px] shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white/85 px-4 md:px-6 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 dark:border-[#2D234A] dark:bg-[#18122B]/85">
            {/* Desktop Left: Sidebar Trigger & Breadcrumbs */}
            <div className="hidden md:flex items-center gap-3">
                <SidebarTrigger className="-ml-1 rounded-lg border border-gray-200/80 bg-white hover:bg-[var(--brand-primary-light,#FFF0EB)] hover:text-[var(--brand-primary,#FF6B35)] shadow-2xs dark:border-gray-800 dark:bg-[#18122B]" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Mobile Left: School Brand (Breadcrumb & Sidebar Trigger hidden on mobile) */}
            <div className="flex md:hidden items-center gap-3 min-w-0">
                {school?.logo_url ? (
                    <img
                        src={school.logo_url}
                        alt={school.name || 'Logo'}
                        className="size-10 shrink-0 rounded-xl border border-gray-200/80 bg-white p-1 object-contain shadow-xs dark:border-gray-700"
                    />
                ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--brand-primary,#FF6B35)] to-[var(--brand-primary-dark,#FF8C5A)] text-white font-black text-sm shadow-sm">
                        AK
                    </div>
                )}
                <span className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white line-clamp-1">
                    {school?.name || 'AbsensiKu'}
                </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {hasPendingAttendance && (
                    <Link
                        href="/attendances"
                        className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600 shadow-xs hover:bg-rose-100 transition-all dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 animate-pulse"
                        title="Klik untuk segera mengisi presensi kelas hari ini"
                    >
                        <BellRing className="size-3.5" />
                        <span>Belum Absen Hari Ini ({pendingAttendance.pending_classes.length} Kelas)</span>
                    </Link>
                )}
                {isTeacherDuty && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-bold text-[#FF6B35] shadow-xs dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300">
                        <span className="size-2 rounded-full bg-[#FF6B35] animate-pulse" />
                        <span>Piket Hari Ini <span className="hidden md:inline">(Akses Semua Kelas)</span></span>
                    </div>
                )}
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#E8FAF9] px-3 py-1 text-xs font-bold text-[#0D9488] dark:bg-[#113835] dark:text-[#5EEAD4]">
                    <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
                    Tahun Ajaran 2026/2027
                </div>
            </div>
        </header>
    );
}
