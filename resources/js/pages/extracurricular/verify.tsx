import { Head, Link } from '@inertiajs/react';
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
    ExternalLink,
    FileText,
    Home,
    MapPin,
    Printer,
    ShieldCheck,
    User,
    UserCheck,
    Users,
    ZoomIn,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
    verification_token?: string;
    approved_at?: string;
    approval_notes?: string;
    created_at: string;
    coach?: {
        name: string;
        nip?: string;
    };
    approved_by?: {
        name: string;
        nip?: string;
    };
    attendees: AttendeeItem[];
}

interface SchoolSettingData {
    name: string;
    address?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
    principal_name?: string;
    principal_nip?: string;
}

interface Props {
    report: ReportDetail;
    school: SchoolSettingData;
}

export default function ExtracurricularVerify({ report, school }: Props) {
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const isApproved = report.status === 'approved';
    const isRejected = report.status === 'rejected';

    const presentAttendees = report.attendees.filter((a) => a.is_present);
    const absentAttendees = report.attendees.filter((a) => !a.is_present);
    const presentCount = presentAttendees.length;
    const totalCount = report.attendees.length;
    const attendancePercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    const documentationPhotos: string[] =
        report.photo_urls && report.photo_urls.length > 0
            ? report.photo_urls
            : report.photo_url
              ? [report.photo_url]
              : [];

    const coachName = report.coach?.name || 'Pelatih Ekskul';
    const coachNip = report.coach?.nip && report.coach.nip.trim() !== '' && report.coach.nip !== '-'
        ? report.coach.nip.trim()
        : null;

    const principalName = school.principal_name || report.approved_by?.name || 'Kepala Sekolah';
    const principalNip = school.principal_nip || report.approved_by?.nip || '-';

    const formattedDate = new Date(report.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const approvedAtFormatted = report.approved_at
        ? new Date(report.approved_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          }) + ' WIB'
        : '-';

    return (
        <>
            <Head title={`Verifikasi Dokumen: ${report.extracurricular_name} (${report.date})`} />

            <div className="min-h-screen bg-slate-100/80 py-6 sm:py-10 px-3 sm:px-6 font-sans">
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* Top Identity Header */}
                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-2xs">
                        <Link href="/" className="flex items-center gap-2.5">
                            {school.logo_url ? (
                                <img
                                    src={school.logo_url}
                                    alt="Logo Sekolah"
                                    className="size-9 object-contain"
                                />
                            ) : (
                                <div className="size-9 rounded-xl bg-orange-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                                    SD
                                </div>
                            )}
                            <div>
                                <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                                    {school.name || 'SD NEGERI DIGITAL'}
                                </h1>
                                <p className="text-[10px] text-slate-500">
                                    Portal E-Verifikasi Dokumen Sah Sekolah
                                </p>
                            </div>
                        </Link>
                        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                            <Link href="/">
                                <Home className="size-3.5 mr-1" />
                                Beranda
                            </Link>
                        </Button>
                    </div>

                    {/* Official Authenticity Status Card */}
                    <div
                        className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${
                            isApproved
                                ? 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 border-emerald-300'
                                : isRejected
                                ? 'bg-gradient-to-br from-rose-50 via-white to-rose-50/40 border-rose-300'
                                : 'bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-amber-300'
                        }`}
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div
                                className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                                    isApproved
                                        ? 'bg-emerald-600 text-white'
                                        : isRejected
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-amber-500 text-white'
                                }`}
                            >
                                {isApproved ? (
                                    <ShieldCheck className="size-8" />
                                ) : isRejected ? (
                                    <AlertCircle className="size-8" />
                                ) : (
                                    <Clock className="size-8" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1 bg-white/80 border border-current shadow-2xs">
                                    {isApproved ? (
                                        <span className="text-emerald-700 flex items-center gap-1">
                                            <CheckCircle2 className="size-3" />
                                            Dokumen Valid & Terverifikasi Resmi
                                        </span>
                                    ) : isRejected ? (
                                        <span className="text-rose-700">Perlu Revisi</span>
                                    ) : (
                                        <span className="text-amber-700">Menunggu Persetujuan</span>
                                    )}
                                </div>
                                <h2 className="text-base sm:text-lg font-black text-slate-900">
                                    Laporan Kegiatan Ekstrakurikuler {report.extracurricular_name}
                                </h2>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    {isApproved ? (
                                        <>
                                            Dokumen ini adalah <strong>dokumen sah dan asli</strong> yang telah disetujui secara digital oleh Kepala Sekolah pada{' '}
                                            <strong className="text-emerald-800">{approvedAtFormatted}</strong>.
                                        </>
                                    ) : isRejected ? (
                                        <>Laporan ini sedang dalam proses perbaikan oleh pelatih.</>
                                    ) : (
                                        <>Laporan ini baru diajukan dan sedang menunggu proses telaah persetujuan Kepala Sekolah.</>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Action buttons on verify card */}
                        {isApproved && (
                            <div className="mt-4 pt-4 border-t border-emerald-200/80 flex flex-wrap items-center gap-2">
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-xs"
                                >
                                    <a
                                        href={`/verify/extracurricular/${report.verification_token || report.id}/pdf`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Download className="size-3.5 mr-1.5" />
                                        Unduh Salinan PDF Resmi
                                    </a>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-9 border-emerald-300 text-emerald-800 hover:bg-emerald-100/50"
                                >
                                    <Link href={`/extracurricular/reports/${report.id}/print`} target="_blank">
                                        <Printer className="size-3.5 mr-1.5" />
                                        Pratinjau Lembar Cetak
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Metadata Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <FileText className="size-3.5 text-orange-600" />
                            Ringkasan Informasi Sesi Latihan
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[11px] text-slate-500 font-medium block">Cabang Ekstrakurikuler:</span>
                                <p className="font-extrabold text-sm text-slate-900 mt-0.5">{report.extracurricular_name}</p>
                                <span className="text-[10px] text-orange-600 font-semibold">{report.session_type}</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[11px] text-slate-500 font-medium block">Pelatih / Pembina:</span>
                                <p className="font-extrabold text-sm text-slate-900 mt-0.5">{coachName}</p>
                                {coachNip && <p className="text-[10px] text-slate-500 font-mono">NIP. {coachNip}</p>}
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[11px] text-slate-500 font-medium block">Waktu & Tempat:</span>
                                <p className="font-bold text-slate-900 mt-0.5">{formattedDate}</p>
                                <p className="text-[11px] text-slate-600">{report.start_time} - {report.end_time} WIB ({report.location})</p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[11px] text-slate-500 font-medium block">Pengesahan Kepala Sekolah:</span>
                                <p className="font-bold text-slate-900 mt-0.5">{principalName}</p>
                                <p className="text-[10px] text-slate-500 font-mono">NIP. {principalNip}</p>
                            </div>
                        </div>

                        {/* Presensi Summary Bar */}
                        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] text-emerald-800 font-medium">Tingkat Kehadiran Siswa:</span>
                                <p className="text-sm font-black text-emerald-900 mt-0.5">
                                    {presentCount} Hadir dari {totalCount} Murid ({attendancePercent}%)
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-700 font-bold text-xs bg-emerald-100 px-2.5 py-1 rounded-lg">
                                    ✓ {presentCount} Hadir
                                </span>
                                {absentAttendees.length > 0 && (
                                    <span className="text-slate-600 text-xs bg-white px-2 py-1 rounded-lg border">
                                        ✗ {absentAttendees.length} Absen
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Uraian Kegiatan Section */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Award className="size-3.5 text-indigo-600" />
                            Uraian Materi & Perkembangan Siswa
                        </h3>

                        <div className="space-y-3 text-xs leading-relaxed">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">• Materi & Aktivitas Latihan:</h4>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 whitespace-pre-line">
                                    {report.activity_material}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">• Hasil / Perkembangan Murid:</h4>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 whitespace-pre-line">
                                    {report.student_progress}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">• Kendala & Rencana Tindak Lanjut:</h4>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 whitespace-pre-line">
                                    {report.obstacles_and_followup}
                                </div>
                            </div>

                            {report.approval_notes && (
                                <div>
                                    <h4 className="font-bold text-emerald-900 mb-1">• Catatan Kepala Sekolah:</h4>
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 italic font-medium">
                                        "{report.approval_notes}"
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Foto Dokumentasi Asli */}
                    {documentationPhotos.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Camera className="size-3.5 text-purple-600" />
                                    Foto Dokumentasi Asli ({documentationPhotos.length} Foto)
                                </h3>
                                <span className="text-[10px] text-slate-400">Klik foto untuk resolusi penuh</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {documentationPhotos.map((url, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedPhoto(url)}
                                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xs hover:shadow-md transition-all flex flex-col"
                                    >
                                        <div className="aspect-4/3 w-full flex items-center justify-center overflow-hidden bg-slate-100">
                                            <img
                                                src={url}
                                                alt={`Dokumentasi #${idx + 1}`}
                                                className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute top-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                #{idx + 1}
                                            </div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <span className="rounded-lg bg-black/75 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-xs flex items-center gap-1">
                                                    <ZoomIn className="size-3" /> Perbesar
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-1.5 text-center text-[10px] font-semibold text-slate-600 border-t border-slate-100">
                                            Dokumentasi #{idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Presensi Siswa Detail Table */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Users className="size-3.5 text-blue-600" />
                            Daftar Kehadiran Peserta Didik
                        </h3>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold">
                                        <th className="py-2 px-3 w-10 text-center">No</th>
                                        <th className="py-2 px-3">Nama Siswa</th>
                                        <th className="py-2 px-3">NISN</th>
                                        <th className="py-2 px-3">Kelas</th>
                                        <th className="py-2 px-3 text-center">Kehadiran</th>
                                        <th className="py-2 px-3">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {report.attendees.map((att, idx) => (
                                        <tr key={att.id} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                                            <td className="py-2 px-3 font-bold text-slate-900">{att.student?.name}</td>
                                            <td className="py-2 px-3 font-mono text-slate-500">{att.student?.nisn || '-'}</td>
                                            <td className="py-2 px-3 text-slate-600">{att.student?.classroom?.name || '-'}</td>
                                            <td className="py-2 px-3 text-center">
                                                {att.is_present ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                        ✓ Hadir
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                        ✗ Tidak Hadir
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-slate-500">{att.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Certification Note */}
                    <div className="text-center py-4 text-[11px] text-slate-400 space-y-1">
                        <p className="flex items-center justify-center gap-1 font-semibold text-slate-600">
                            <ShieldCheck className="size-4 text-emerald-600" />
                            Sistem E-Verifikasi Dokumen Resmi {school.name || ''}
                        </p>
                        <p>
                            Dokumen digital ini diverifikasi langsung dari basis data sekolah. Keaslian data terjamin secara sah.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal Zoom Photo */}
            <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
                <DialogContent className="max-w-4xl p-2 sm:p-4 bg-black/95 text-white border-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Foto Dokumentasi Resolusi Penuh</DialogTitle>
                        <DialogDescription>Tampilan resolusi penuh foto dokumentasi kegiatan</DialogDescription>
                    </DialogHeader>
                    <div className="relative flex flex-col items-center justify-center p-2">
                        {selectedPhoto && (
                            <img
                                src={selectedPhoto}
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
