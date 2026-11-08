import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Calendar,
    Camera,
    Check,
    CheckCircle2,
    Clock,
    Download,
    FileSpreadsheet,
    FileText,
    MapPin,
    PenLine,
    Printer,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    User,
    UserCheck,
    Users,
    XCircle,
    ZoomIn,
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

interface AttendeeItem {
    id: number;
    student_id: number;
    is_present: boolean;
    notes?: string;
    student: {
        id: number;
        name: string;
        nisn: string;
        classroom?: {
            id: number;
            name: string;
        };
    };
}

interface ReportDetail {
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
    photo_urls?: string[];
    photos?: string[];
    status: 'pending' | 'approved' | 'rejected';
    status_label: string;
    approval_notes?: string;
    approved_at?: string;
    created_at: string;
    coach?: {
        id: number;
        name: string;
        nip?: string;
    };
    approved_by?: {
        id: number;
        name: string;
        nip?: string;
    };
    attendees: AttendeeItem[];
}

interface Props {
    report: ReportDetail;
}

export default function ExtracurricularShow({ report }: Props) {
    const { props } = usePage();
    const user = props.auth?.user as { id?: number; role?: string } | undefined;
    const isPrincipal = user?.role === 'principal';
    const isAdmin = user?.role === 'admin';
    const isOwnerCoach = user?.id === report.coach_id;
    const canApprove = isPrincipal || isAdmin;

    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
    const [approvalNotes, setApprovalNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedZoomPhoto, setSelectedZoomPhoto] = useState<string | null>(null);

    const isApproved = report.status === 'approved';
    const isRejected = report.status === 'rejected';
    const isPending = report.status === 'pending';

    const documentationPhotos: string[] =
        report.photo_urls && report.photo_urls.length > 0
            ? report.photo_urls
            : report.photo_url
              ? [report.photo_url]
              : [];

    const presentAttendees = report.attendees.filter((a) => a.is_present);
    const absentAttendees = report.attendees.filter((a) => !a.is_present);

    const handleApprovalSubmit = () => {
        setIsSubmitting(true);
        router.post(
            `/extracurricular/reports/${report.id}/approve`,
            {
                action: approvalAction,
                approval_notes: approvalNotes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsApproveOpen(false);
                    toast.success(
                        approvalAction === 'approve'
                            ? 'Laporan ekskul berhasil disetujui.'
                            : 'Laporan ekskul berstatus perlu revisi.'
                    );
                },
                onError: () => {
                    toast.error('Gagal memperbarui status persetujuan.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    return (
        <>
            <Head title={`Laporan Ekskul ${report.extracurricular_name} - ${report.date}`} />

            <div className="w-full min-w-0 max-w-5xl mx-auto space-y-5 px-3 sm:px-6 lg:px-8 py-5">
                {/* Header Banner */}
                <PageBanner
                    badgeText="Detail Sesi Latihan"
                    title={report.extracurricular_name}
                    description={`Laporan sesi latihan ${report.session_type} yang dilaksanakan pada ${new Date(report.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`}
                    icon={<Award className="size-6 text-white" />}
                    action={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                asChild
                                variant="outline"
                                className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md text-xs font-semibold h-9"
                            >
                                <Link href="/extracurricular/reports">
                                    <ArrowLeft className="size-3.5 mr-1.5" />
                                    Kembali
                                </Link>
                            </Button>

                            {/* Print & Download PDF button (when approved) */}
                            {isApproved && (
                                <>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md text-xs font-semibold h-9"
                                    >
                                        <a href={`/extracurricular/reports/${report.id}/pdf`} target="_blank" rel="noreferrer">
                                            <Download className="size-3.5 mr-1.5" />
                                            Unduh PDF
                                        </a>
                                    </Button>
                                    <Button
                                        asChild
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm h-9 shadow-md"
                                    >
                                        <Link href={`/extracurricular/reports/${report.id}/print`} target="_blank">
                                            <Printer className="size-4 mr-1.5" />
                                            Cetak Laporan
                                        </Link>
                                    </Button>
                                </>
                            )}

                            {/* Edit button */}
                            {(!isApproved || isAdmin) && isOwnerCoach && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md text-xs font-semibold h-9"
                                >
                                    <Link href={`/extracurricular/reports/${report.id}/edit`}>
                                        <PenLine className="size-3.5 mr-1.5" />
                                        Sunting Laporan
                                    </Link>
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Status Bar / Approval Card */}
                <div
                    className={`rounded-xl border p-4 sm:p-5 shadow-xs ${
                        isApproved
                            ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/30'
                            : isRejected
                            ? 'border-red-200 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/30'
                            : 'border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30'
                    }`}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <span
                                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-white shadow-xs mt-0.5 ${
                                    isApproved
                                        ? 'bg-emerald-600'
                                        : isRejected
                                        ? 'bg-red-600'
                                        : 'bg-amber-500'
                                }`}
                            >
                                {isApproved ? (
                                    <CheckCircle2 className="size-5" />
                                ) : isRejected ? (
                                    <XCircle className="size-5" />
                                ) : (
                                    <Clock className="size-5" />
                                )}
                            </span>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                        Status Laporan: {report.status_label}
                                    </h4>
                                    <Badge
                                        variant="outline"
                                        className={
                                            isApproved
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                : isRejected
                                                ? 'bg-red-100 text-red-800 border-red-300'
                                                : 'bg-amber-100 text-amber-800 border-amber-300'
                                        }
                                    >
                                        {report.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                    {isApproved
                                        ? `Laporan ini telah disetujui secara resmi oleh Kepala Sekolah (${report.approved_by?.name || 'Kepala Sekolah'}) pada ${new Date(report.approved_at || '').toLocaleString('id-ID')}. Lembar cetak laporan resmi dapat langsung diunduh dan dicetak.`
                                        : isRejected
                                        ? `Laporan memerlukan perbaikan. Catatan revisi: "${report.approval_notes || 'Silakan lengkapi atau perbaiki data kegiatan.'}". Pelatih dapat mengklik Sunting Laporan untuk memperbarui.`
                                        : 'Laporan telah diajukan dan sedang menunggu peninjauan serta tanda tangan persetujuan dari Kepala Sekolah.'}
                                </p>
                            </div>
                        </div>

                        {/* Approval Action for Principal */}
                        {canApprove && (
                            <div className="shrink-0 self-end sm:self-auto">
                                <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className={
                                                isApproved
                                                    ? 'bg-gray-800 hover:bg-gray-900 text-white text-xs'
                                                    : 'bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md'
                                            }
                                        >
                                            <ShieldCheck className="size-3.5 mr-1.5" />
                                            {isApproved ? 'Ubah Persetujuan' : 'Review & Beri Persetujuan'}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="text-base font-bold">
                                                Tinjau Laporan Kegiatan Ekskul
                                            </DialogTitle>
                                            <DialogDescription className="text-xs text-gray-500">
                                                Sebagai Kepala Sekolah / Administrator, berikan persetujuan resmi atau minta revisi.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4 py-2 text-xs">
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

                                            <div>
                                                <label className="font-bold text-gray-700 block mb-1">
                                                    Catatan Pembinaan / Alasan Revisi:
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={approvalNotes}
                                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                                    placeholder="Catatan untuk pelatih..."
                                                    className="w-full rounded-lg border border-gray-300 p-2 text-xs"
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter className="mt-2">
                                            <DialogClose asChild>
                                                <Button type="button" variant="outline" size="sm">
                                                    Batal
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={isSubmitting}
                                                onClick={handleApprovalSubmit}
                                                className={
                                                    approvalAction === 'approve'
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                                                        : 'bg-red-600 hover:bg-red-700 text-white font-bold'
                                                }
                                            >
                                                {isSubmitting ? 'Memproses...' : 'Simpan Persetujuan'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sesi Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        <span className="text-[11px] font-medium text-gray-500 block">Pelatih / Pembina:</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                            {report.coach?.name || 'Pelatih Ekskul'}
                        </p>
                        {report.coach?.nip && (
                            <p className="text-[10px] text-gray-400">NIP: {report.coach.nip}</p>
                        )}
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        <span className="text-[11px] font-medium text-gray-500 block">Jenis Sesi & Waktu:</span>
                        <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                            {report.session_type}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                            {report.start_time} - {report.end_time} WIB
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        <span className="text-[11px] font-medium text-gray-500 block">Tempat / Lokasi:</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 flex items-center gap-1">
                            <MapPin className="size-3.5 text-red-500" />
                            {report.location}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        <span className="text-[11px] font-medium text-gray-500 block">Tingkat Kehadiran:</span>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">
                            {presentAttendees.length} Hadir / {report.attendees.length} Murid
                        </p>
                        <p className="text-[10px] text-gray-400">
                            {Math.round((presentAttendees.length / (report.attendees.length || 1)) * 100)}% Presensi
                        </p>
                    </div>
                </div>

                {/* Uraian Kegiatan Content */}
                <div className="rounded-xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-6">
                    <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1.5">
                            <FileText className="size-4 text-[var(--brand-primary)]" />
                            Kegiatan & Materi Latihan Hari Ini
                        </h4>
                        <div className="rounded-lg bg-gray-50 p-3.5 text-xs sm:text-sm text-gray-800 leading-relaxed dark:bg-gray-800/60 dark:text-gray-200 whitespace-pre-line border border-gray-100 dark:border-gray-800">
                            {report.activity_material}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1.5">
                            <Award className="size-4 text-emerald-600" />
                            Hasil & Perkembangan Murid
                        </h4>
                        <div className="rounded-lg bg-gray-50 p-3.5 text-xs sm:text-sm text-gray-800 leading-relaxed dark:bg-gray-800/60 dark:text-gray-200 whitespace-pre-line border border-gray-100 dark:border-gray-800">
                            {report.student_progress}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1.5">
                            <AlertCircle className="size-4 text-amber-600" />
                            Kendala & Rencana Tindak Lanjut
                        </h4>
                        <div className="rounded-lg bg-gray-50 p-3.5 text-xs sm:text-sm text-gray-800 leading-relaxed dark:bg-gray-800/60 dark:text-gray-200 whitespace-pre-line border border-gray-100 dark:border-gray-800">
                            {report.obstacles_and_followup}
                        </div>
                    </div>

                    {/* Foto Kegiatan Dokumentasi (Bisa Multi Foto) */}
                    {documentationPhotos.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                                    <Camera className="size-4 text-purple-600" />
                                    Foto Dokumentasi Kegiatan ({documentationPhotos.length} Foto)
                                </h4>
                                <span className="text-[11px] text-gray-400">
                                    Klik foto untuk memperbesar
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {documentationPhotos.map((url, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedZoomPhoto(url)}
                                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 shadow-2xs hover:shadow-md transition-all flex flex-col"
                                    >
                                        <div className="relative aspect-4/3 w-full flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-900">
                                            <img
                                                src={url}
                                                alt={`Dokumentasi ${report.extracurricular_name} ${idx + 1}`}
                                                className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute top-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                #{idx + 1}
                                            </div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <span className="rounded-lg bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs flex items-center gap-1">
                                                    <ZoomIn className="size-3" /> Perbesar
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-1.5 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700">
                                            Dokumentasi #{idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabel Presensi Murid */}
                <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                    <div className="flex items-center justify-between bg-gray-50/80 px-4 py-3 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200 border-b">
                        <span>Daftar Presensi Murid ({report.attendees.length} terdaftar)</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-emerald-600">
                                ✓ {presentAttendees.length} Hadir
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="text-[11px] font-bold text-gray-500">
                                ✗ {absentAttendees.length} Tidak Hadir
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-[11px]">
                                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                                    <th className="py-2.5 px-3">Nama Siswa</th>
                                    <th className="py-2.5 px-3">NISN</th>
                                    <th className="py-2.5 px-3">Kelas</th>
                                    <th className="py-2.5 px-3 text-center">Kehadiran</th>
                                    <th className="py-2.5 px-3">Keterangan / Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {report.attendees.map((att, idx) => (
                                    <tr key={att.id} className="hover:bg-gray-50/50">
                                        <td className="py-2.5 px-3 text-center font-mono text-gray-400">
                                            {idx + 1}
                                        </td>
                                        <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">
                                            {att.student?.name}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-gray-500">
                                            {att.student?.nisn || '-'}
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-600 font-semibold">
                                            {att.student?.classroom?.name || '-'}
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            {att.is_present ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold text-[10px]">
                                                    Hadir
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-300 text-[10px]">
                                                    Tidak Hadir
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-500">
                                            {att.notes || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Zoom Foto Dokumentasi Penuh */}
            <Dialog open={!!selectedZoomPhoto} onOpenChange={(open) => !open && setSelectedZoomPhoto(null)}>
                <DialogContent className="max-w-4xl p-2 sm:p-4 bg-black/95 text-white border-gray-800">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Pratinjau Foto Dokumentasi Penuh</DialogTitle>
                        <DialogDescription>Tampilan resolusi penuh dokumentasi kegiatan ekskul</DialogDescription>
                    </DialogHeader>
                    <div className="relative flex flex-col items-center justify-center p-2">
                        {selectedZoomPhoto && (
                            <img
                                src={selectedZoomPhoto}
                                alt="Foto Dokumentasi Penuh"
                                className="max-h-[82vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

ExtracurricularShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Ekskul', href: '/extracurricular/reports' },
        { title: 'Rincian Laporan', href: '#' },
    ],
};
