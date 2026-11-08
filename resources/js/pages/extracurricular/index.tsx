import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Eye,
    FileSpreadsheet,
    FileText,
    Filter,
    MapPin,
    PenLine,
    Plus,
    Printer,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash2,
    User,
    UserCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { PageBanner } from '@/components/page-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ReportItem {
    id: number;
    coach_id: number;
    extracurricular_name: string;
    session_type: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    activity_material: string;
    student_progress: string;
    obstacles_and_followup: string;
    photo_url?: string;
    status: 'pending' | 'approved' | 'rejected';
    status_label: string;
    approval_notes?: string;
    approved_at?: string;
    coach?: {
        id: number;
        name: string;
    };
    approved_by?: {
        id: number;
        name: string;
    };
    attendees_count: number;
    present_attendees_count: number;
}

interface Props {
    reports: {
        data: ReportItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        status: string;
        session_type: string;
        search: string;
        date: string;
    };
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        total_roster: number;
    };
    userRole: string;
}

export default function ExtracurricularIndex({
    reports,
    filters,
    stats,
    userRole,
}: Props) {
    const isCoach = userRole === 'coach';
    const isPrincipal = userRole === 'principal';
    const isAdmin = userRole === 'admin';
    const canApprove = isPrincipal || isAdmin;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedType, setSelectedType] = useState(filters.session_type || 'all');
    const [selectedDate, setSelectedDate] = useState(filters.date || '');

    // Approval modal state
    const [approvalTarget, setApprovalTarget] = useState<ReportItem | null>(null);
    const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
    const [approvalNotes, setApprovalNotes] = useState('');
    const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<ReportItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleFilter = (customParams = {}) => {
        router.get(
            '/extracurricular/reports',
            {
                search,
                status: selectedStatus,
                session_type: selectedType,
                date: selectedDate,
                ...customParams,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter();
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedStatus('all');
        setSelectedType('all');
        setSelectedDate('');
        router.get('/extracurricular/reports', {}, { preserveState: true, preserveScroll: true });
    };

    const handleApproveSubmit = () => {
        if (!approvalTarget) return;

        setIsSubmittingApproval(true);
        router.post(
            `/extracurricular/reports/${approvalTarget.id}/approve`,
            {
                action: approvalAction,
                approval_notes: approvalNotes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setApprovalTarget(null);
                    setApprovalNotes('');
                    toast.success(
                        approvalAction === 'approve'
                            ? 'Laporan ekskul berhasil disetujui.'
                            : 'Laporan ekskul berstatus perlu revisi.'
                    );
                },
                onError: () => {
                    toast.error('Gagal memproses persetujuan laporan.');
                },
                onFinish: () => {
                    setIsSubmittingApproval(false);
                },
            }
        );
    };

    const handleDeleteSubmit = () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        router.delete(`/extracurricular/reports/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                toast.success('Laporan ekskul berhasil dihapus.');
            },
            onError: () => {
                toast.error('Gagal menghapus laporan.');
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="size-3 mr-1" />
                        Disetujui
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                        <XCircle className="size-3 mr-1" />
                        Perlu Revisi
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        <Clock className="size-3 mr-1" />
                        Menunggu Persetujuan
                    </Badge>
                );
        }
    };

    return (
        <>
            <Head title="Laporan Kegiatan Ekstrakurikuler" />

            <div className="w-full min-w-0 max-w-7xl mx-auto space-y-5 px-3 sm:px-6 lg:px-8 py-5">
                {/* Page Banner */}
                <PageBanner
                    badgeText="Kegiatan Ekstrakurikuler"
                    title="Lapor Kegiatan Ekskul & Presensi"
                    description="Pencatatan sesi latihan terjadwal/tambahan, presensi kehadiran murid ekskul, rekap perkembangan, dan persetujuan resmi kepala sekolah."
                    icon={<Award className="size-6 text-white" />}
                    action={
                        <div className="flex flex-wrap items-center gap-2">
                            {isCoach && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md text-xs font-semibold h-9"
                                >
                                    <Link href="/extracurricular/roster">
                                        <Users className="size-3.5 mr-1.5" />
                                        Atur Anggota Ekskul
                                        {stats.total_roster > 0 && (
                                            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                                                {stats.total_roster}
                                            </span>
                                        )}
                                    </Link>
                                </Button>
                            )}

                            {(isCoach || isAdmin) && (
                                <Button
                                    asChild
                                    className="bg-white text-gray-900 hover:bg-white/90 shadow-md font-bold text-xs sm:text-sm h-9"
                                >
                                    <Link href="/extracurricular/reports/create">
                                        <Plus className="size-4 mr-1.5 text-[var(--brand-primary)]" />
                                        Buat Laporan Baru
                                    </Link>
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 w-full min-w-0">
                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Sesi</span>
                            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                <Award className="size-3.5" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white">
                            {stats.total}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Sesi latihan tercatat</p>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Menunggu Review</span>
                            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                                <Clock className="size-3.5" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                            {stats.pending}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Menunggu persetujuan Kepsek</p>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Disetujui</span>
                            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            {stats.approved}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Siap cetak dokumen resmi</p>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Perlu Revisi</span>
                            <span className="flex size-7 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                                <XCircle className="size-3.5" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-red-600 dark:text-red-400">
                            {stats.rejected}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Perlu perbaikan pelatih</p>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 sm:p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900 w-full min-w-0 space-y-3">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
                        {/* Search Input */}
                        <div className="relative lg:col-span-4 min-w-0">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Cari nama ekskul, pelatih, materi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8.5 text-xs h-9 bg-gray-50/50 dark:bg-gray-800/40"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Status Select */}
                        <div className="lg:col-span-3 min-w-0">
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    handleFilter({ status: e.target.value });
                                }}
                                className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-200 h-9"
                            >
                                <option value="all">Semua Status Persetujuan</option>
                                <option value="pending">Menunggu Persetujuan</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Perlu Revisi</option>
                            </select>
                        </div>

                        {/* Session Type Select */}
                        <div className="lg:col-span-3 min-w-0">
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    handleFilter({ session_type: e.target.value });
                                }}
                                className="w-full rounded-md border border-gray-300 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-200 h-9"
                            >
                                <option value="all">Semua Jenis Sesi</option>
                                <option value="Latihan terjadwal (sesuai ketetapan Sudin)">Latihan Terjadwal (Sudin)</option>
                                <option value="Latihan tambahan">Latihan Tambahan</option>
                            </select>
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex items-center gap-2 lg:col-span-2">
                            <Button type="submit" size="sm" className="h-9 flex-1 text-xs font-semibold">
                                Cari
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleResetFilter}
                                className="h-9 px-2 text-xs text-gray-500"
                                title="Reset Filter"
                            >
                                <RefreshCw className="size-3.5" />
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Table List Card */}
                <div className="w-full min-w-0 max-w-full rounded-xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                    <div className="w-full min-w-0 max-w-full overflow-x-auto">
                        <table className="w-full min-w-[780px] text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/90 dark:border-gray-800 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">
                                    <th className="py-3 px-4 font-bold">Tanggal & Waktu</th>
                                    <th className="py-3 px-3 font-bold">Nama Ekskul & Sesi</th>
                                    <th className="py-3 px-3 font-bold">Pelatih & Lokasi</th>
                                    <th className="py-3 px-3 font-bold text-center">Kehadiran Siswa</th>
                                    <th className="py-3 px-3 font-bold text-center">Status</th>
                                    <th className="py-3 px-4 font-bold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                {reports.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Award className="size-8 text-gray-300 dark:text-gray-600" />
                                                <p className="font-semibold text-sm">Belum ada laporan kegiatan ekskul yang ditemukan.</p>
                                                <p className="text-xs text-gray-400">
                                                    {isCoach
                                                        ? 'Klik tombol "Buat Laporan Baru" di atas untuk mulai mencatat sesi latihan.'
                                                        : 'Laporan yang diajukan oleh pelatih ekskul akan tampil di sini.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    reports.data.map((report) => {
                                        const isApproved = report.status === 'approved';
                                        const isRejected = report.status === 'rejected';
                                        const isPending = report.status === 'pending';

                                        return (
                                            <tr key={report.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-850/60 transition-colors">
                                                {/* Date & Time */}
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                                                            {new Date(report.date).toLocaleDateString('id-ID', {
                                                                weekday: 'short',
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <Clock className="size-3" />
                                                            {report.start_time} - {report.end_time} WIB
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Ekskul & Session Type */}
                                                <td className="py-3 px-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                                                            {report.extracurricular_name}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {report.session_type}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Coach & Location */}
                                                <td className="py-3 px-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs flex items-center gap-1">
                                                            <User className="size-3 text-purple-600" />
                                                            {report.coach?.name || 'Pelatih'}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <MapPin className="size-3 text-red-500" />
                                                            {report.location}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Attendance Summary */}
                                                <td className="py-3 px-3 text-center align-middle">
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                                                            {report.present_attendees_count} / {report.attendees_count}
                                                        </span>
                                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                                            Siswa Hadir
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="py-3 px-3 text-center align-middle">
                                                    {getStatusBadge(report.status)}
                                                    {report.approval_notes && isRejected && (
                                                        <p className="text-[10px] text-red-600 line-clamp-1 mt-0.5" title={report.approval_notes}>
                                                            Catatan: {report.approval_notes}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-4 text-right align-middle">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* View Details */}
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900"
                                                            title="Lihat Rincian Laporan"
                                                        >
                                                            <Link href={`/extracurricular/reports/${report.id}`}>
                                                                <Eye className="size-3.5 mr-1" />
                                                                Detail
                                                            </Link>
                                                        </Button>

                                                        {/* Print Button (Available after approved) */}
                                                        {isApproved && (
                                                            <Button
                                                                asChild
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 font-semibold shadow-2xs"
                                                                title="Cetak Lembar Laporan Resmi"
                                                            >
                                                                <Link href={`/extracurricular/reports/${report.id}/print`} target="_blank">
                                                                    <Printer className="size-3.5 mr-1 text-emerald-600" />
                                                                    Cetak
                                                                </Link>
                                                            </Button>
                                                        )}

                                                        {/* Approval Button for Principal / Admin */}
                                                        {canApprove && isPending && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setApprovalTarget(report);
                                                                    setApprovalAction('approve');
                                                                    setApprovalNotes('');
                                                                }}
                                                                className="h-8 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
                                                            >
                                                                Review
                                                            </Button>
                                                        )}

                                                        {/* Edit (if not approved yet, or admin) */}
                                                        {(!isApproved || isAdmin) && (
                                                            <Button
                                                                asChild
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-800"
                                                                title="Edit Laporan"
                                                            >
                                                                <Link href={`/extracurricular/reports/${report.id}/edit`}>
                                                                    <PenLine className="size-3.5" />
                                                                </Link>
                                                            </Button>
                                                        )}

                                                        {/* Delete (if owner or admin) */}
                                                        {(!isApproved || isAdmin) && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setDeleteTarget(report)}
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                title="Hapus Laporan"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {reports.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                            <span className="text-xs text-gray-500">
                                Menampilkan halaman {reports.current_page} dari {reports.last_page} ({reports.total} total laporan)
                            </span>
                            <div className="flex gap-1">
                                {reports.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        asChild={!!link.url}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        className="h-7 text-xs px-2.5"
                                    >
                                        {link.url ? (
                                            <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Principal Approval Dialog Modal */}
                <Dialog open={!!approvalTarget} onOpenChange={(open) => !open && setApprovalTarget(null)}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                                Persetujuan Laporan Kegiatan Ekskul
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Sesi {approvalTarget?.extracurricular_name} pada tanggal {approvalTarget?.date} oleh {approvalTarget?.coach?.name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2 text-xs">
                            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Jenis Sesi:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{approvalTarget?.session_type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Waktu & Tempat:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {approvalTarget?.start_time} - {approvalTarget?.end_time} WIB ({approvalTarget?.location})
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Siswa Hadir:</span>
                                    <span className="font-bold text-emerald-600">
                                        {approvalTarget?.present_attendees_count} dari {approvalTarget?.attendees_count} siswa
                                    </span>
                                </div>
                                <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-500 block mb-0.5">Materi / Kegiatan:</span>
                                    <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                                        {approvalTarget?.activity_material}
                                    </p>
                                </div>
                            </div>

                            {/* Action Choice */}
                            <div>
                                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                                    Tindakan Kepala Sekolah:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setApprovalAction('approve')}
                                        className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border font-semibold transition-all ${
                                            approvalAction === 'approve'
                                                ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-2 ring-emerald-300'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                        Setujui Laporan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApprovalAction('reject')}
                                        className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border font-semibold transition-all ${
                                            approvalAction === 'reject'
                                                ? 'bg-red-50 border-red-400 text-red-700 ring-2 ring-red-300'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <XCircle className="size-4 text-red-600" />
                                        Minta Revisi
                                    </button>
                                </div>
                            </div>

                            {/* Notes input */}
                            <div>
                                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                    Catatan / Arahan Pembinaan (Opsional):
                                </label>
                                <textarea
                                    rows={3}
                                    value={approvalNotes}
                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                    placeholder={
                                        approvalAction === 'approve'
                                            ? 'Catatan apresiasi atau tindak lanjut kegiatan...'
                                            : 'Sebutkan bagian laporan yang perlu diperbaiki oleh pelatih...'
                                    }
                                    className="w-full rounded-lg border border-gray-300 p-2 text-xs focus:ring-2 focus:ring-[var(--brand-primary)] dark:border-gray-700 dark:bg-gray-800"
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-2 flex gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" size="sm">
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button
                                type="button"
                                size="sm"
                                disabled={isSubmittingApproval}
                                onClick={handleApproveSubmit}
                                className={
                                    approvalAction === 'approve'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                                        : 'bg-red-600 hover:bg-red-700 text-white font-bold'
                                }
                            >
                                {isSubmittingApproval ? (
                                    <>
                                        <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                                        Memproses...
                                    </>
                                ) : approvalAction === 'approve' ? (
                                    'Simpan & Setujui'
                                ) : (
                                    'Kirim Permintaan Revisi'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
                                <Trash2 className="size-5" />
                            </div>
                            <DialogTitle className="text-center text-base font-bold">
                                Hapus Laporan Kegiatan Ekskul?
                            </DialogTitle>
                            <DialogDescription className="text-center text-xs text-gray-500">
                                Tindakan ini akan menghapus arsip sesi kegiatan {deleteTarget?.extracurricular_name} pada tanggal {deleteTarget?.date} beserta seluruh data presensi siswa terkait.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-3 flex gap-2 sm:justify-end">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" size="sm">
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting}
                                onClick={handleDeleteSubmit}
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Laporan'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

ExtracurricularIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Ekskul', href: '/extracurricular/reports' },
    ],
};
