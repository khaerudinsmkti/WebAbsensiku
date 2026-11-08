import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

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
    status: string;
    status_label: string;
    verification_token?: string;
    approved_at?: string;
    approval_notes?: string;
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
    verifyUrl?: string;
    qrCodeBase64?: string;
}

export default function ExtracurricularPrint({ report, school, verifyUrl, qrCodeBase64 }: Props) {
    const presentAttendees = report.attendees.filter((a) => a.is_present);
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

    const printedDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title={`Cetak Laporan Ekskul - ${report.extracurricular_name} (${report.date})`} />

            <div className="min-h-screen bg-gray-100 py-6 px-4 print:bg-white print:p-0">
                {/* Floating Action Bar (Hidden on print) */}
                <div className="max-w-[210mm] mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm print:hidden">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.close()}
                        className="text-xs"
                    >
                        <ArrowLeft className="size-3.5 mr-1" />
                        Tutup / Kembali
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 hidden sm:inline mr-1">
                            Status: <strong className="text-emerald-600">Disetujui Kepala Sekolah</strong>
                        </span>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-xs border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100"
                        >
                            <a href={`/extracurricular/reports/${report.id}/pdf`} target="_blank" rel="noreferrer">
                                <Download className="size-3.5 mr-1 text-orange-600" />
                                Unduh File PDF
                            </a>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handlePrint}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                        >
                            <Printer className="size-3.5 mr-1.5" />
                            Cetak Sekarang (Print / PDF)
                        </Button>
                    </div>
                </div>

                {/* A4 Sheet Container */}
                <div className="max-w-[210mm] mx-auto bg-white p-6 sm:p-10 shadow-md rounded-xl print:shadow-none print:rounded-none print:p-0 print:max-w-none text-[#1e293b] font-sans text-[10px] leading-relaxed">
                    {/* Header Kop Surat (Persis Jurnal Kepala Sekolah) */}
                    <div className="flex items-center justify-between gap-4 mb-1">
                        {school.logo_url && (
                            <div className="w-[75px] shrink-0 text-center">
                                <img
                                    src={school.logo_url}
                                    alt="Logo Sekolah"
                                    className="max-w-[65px] max-h-[65px] object-contain mx-auto"
                                />
                            </div>
                        )}
                        <div className="flex-1 text-center">
                            <h1 className="text-[15px] font-bold uppercase text-[#0f172a] tracking-wide leading-tight">
                                {school.name || 'SD NEGERI DIGITAL'}
                            </h1>
                            <h2 className="text-[12px] font-bold uppercase text-[#ea580c] tracking-wider my-0.5">
                                LAPORAN KEGIATAN EKSTRAKURIKULER
                            </h2>
                            {school.address && (
                                <p className="text-[8.5px] text-[#475569] leading-tight">
                                    {school.address}
                                    {school.city ? `, ${school.city}` : ''}
                                    {school.phone ? ` | Telp: ${school.phone}` : ''}
                                </p>
                            )}
                        </div>
                        {school.logo_url && <div className="w-[75px] shrink-0" />}
                    </div>

                    {/* Garis Pembatas Ganda */}
                    <div className="border-t-2 border-[#0f172a] border-b border-[#0f172a] h-[2px] mt-1.5 mb-2.5" />

                    {/* Meta Table (2 Kolom Informasi) */}
                    <table className="w-full border-collapse mb-2.5 text-[9.5px]">
                        <tbody>
                            <tr>
                                <td className="w-[17%] font-bold py-0.5">Nama Pelatih</td>
                                <td className="w-[2%] py-0.5">:</td>
                                <td className="w-[36%] font-bold py-0.5">{coachName}</td>
                                <td className="w-[15%] font-bold py-0.5">Jenis Sesi</td>
                                <td className="w-[2%] py-0.5">:</td>
                                <td className="w-[28%] py-0.5">{report.session_type}</td>
                            </tr>
                            {coachNip ? (
                                <>
                                    <tr>
                                        <td className="font-bold py-0.5">NIP</td>
                                        <td className="py-0.5">:</td>
                                        <td className="py-0.5">{coachNip}</td>
                                        <td className="font-bold py-0.5">Hari / Tanggal</td>
                                        <td className="py-0.5">:</td>
                                        <td className="py-0.5">{formattedDate}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold py-0.5">Ekstrakurikuler</td>
                                        <td className="py-0.5">:</td>
                                        <td className="font-bold py-0.5">{report.extracurricular_name}</td>
                                        <td className="font-bold py-0.5">Waktu & Tempat</td>
                                        <td className="py-0.5">:</td>
                                        <td className="py-0.5">{report.start_time} - {report.end_time} WIB ({report.location})</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold py-0.5">Status Laporan</td>
                                        <td className="py-0.5">:</td>
                                        <td className="py-0.5 text-emerald-700 font-bold">Disetujui Kepala Sekolah</td>
                                        <td className="font-bold py-0.5">Kehadiran Murid</td>
                                        <td className="py-0.5">:</td>
                                        <td className="py-0.5"><strong>{presentCount} Hadir</strong> dari {totalCount} Siswa ({attendancePercent}%)</td>
                                    </tr>
                                </>
                            ) : (
                                <>
                                    <tr>
                                        <td className="font-bold py-0.5">Ekstrakurikuler</td>
                                        <td className="py-0.5">:</td>
                                        <td className="font-bold py-0.5">{report.extracurricular_name}</td>
                                        <td className="font-bold py-0.5">Hari / Tanggal</td>
                                        <td className="py-0.5">:</td>
                                        <td className="py-0.5">{formattedDate}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold py-0.5">Status Laporan</td>
                                        <td className="py-0.5">:</td>
                                        <td className="py-0.5 text-emerald-700 font-bold">Disetujui Kepala Sekolah</td>
                                        <td className="font-bold py-0.5">Waktu & Tempat</td>
                                        <td className="py-0.5">:</td>
                                        <td className="py-0.5">{report.start_time} - {report.end_time} WIB ({report.location})</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold py-0.5">Total Presensi</td>
                                        <td className="py-0.5">:</td>
                                        <td colSpan={4} className="py-0.5"><strong>{presentCount} Hadir</strong> dari {totalCount} Siswa ({attendancePercent}%)</td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>

                    {/* Tabel Utama (Format Mirip Lampiran Jurnal Kepala Sekolah) */}
                    <table className="w-full border-collapse border border-[#64748b] mb-3 text-[9px]">
                        <thead>
                            <tr className="bg-[#fff7ed] text-[#9a3412] uppercase font-bold text-[8.5px]">
                                <th className="border border-[#64748b] p-1.5 w-[4%] text-center">NO</th>
                                <th className="border border-[#64748b] p-1.5 w-[16%] text-center">HARI / TANGGAL</th>
                                <th className="border border-[#64748b] p-1.5 w-[22%] text-center">KEGIATAN YANG DIIKUTI</th>
                                <th className="border border-[#64748b] p-1.5 w-[38%] text-center">ISI / URAIAN KEGIATAN</th>
                                <th className="border border-[#64748b] p-1.5 w-[20%] text-center">DOKUMENTASI</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-[#64748b] p-2 text-center font-bold align-top">
                                    1
                                </td>
                                <td className="border border-[#64748b] p-2 align-top">
                                    <div className="font-bold text-[#0f172a]">{formattedDate}</div>
                                    <div className="text-[8px] text-gray-500 mt-1">
                                        Pukul {report.start_time} - {report.end_time} WIB
                                    </div>
                                    <div className="text-[8px] text-gray-500 mt-0.5">
                                        Tempat: {report.location}
                                    </div>
                                </td>
                                <td className="border border-[#64748b] p-2 align-top">
                                    <div className="font-bold text-[#0f172a]">{report.extracurricular_name}</div>
                                    <div className="text-[8px] text-[#ea580c] font-semibold mt-1">
                                        {report.session_type}
                                    </div>
                                </td>
                                <td className="border border-[#64748b] p-2 align-top space-y-1.5">
                                    <div>
                                        <span className="font-bold text-[#334155] block">• Materi & Aktivitas Latihan:</span>
                                        <div className="whitespace-pre-line text-[#1e293b] mt-0.5">{report.activity_material}</div>
                                    </div>

                                    <div>
                                        <span className="font-bold text-[#334155] block">• Perkembangan & Hasil Murid:</span>
                                        <div className="whitespace-pre-line text-[#1e293b] mt-0.5">{report.student_progress}</div>
                                    </div>

                                    <div>
                                        <span className="font-bold text-[#334155] block">• Kendala & Rencana Tindak Lanjut:</span>
                                        <div className="whitespace-pre-line text-[#1e293b] mt-0.5">{report.obstacles_and_followup}</div>
                                    </div>

                                    {report.approval_notes && (
                                        <div className="pt-1 border-t border-dashed border-gray-300">
                                            <span className="font-bold text-emerald-800 block">• Catatan Kepala Sekolah:</span>
                                            <div className="italic text-emerald-900 mt-0.5">"{report.approval_notes}"</div>
                                        </div>
                                    )}
                                </td>
                                <td className="border border-[#64748b] p-2 text-center align-top">
                                    {documentationPhotos.length > 0 ? (
                                        <div className="flex flex-col items-center gap-1.5">
                                            {documentationPhotos.map((url, idx) => (
                                                <div key={idx} className="w-full flex justify-center">
                                                    <img
                                                        src={url}
                                                        alt={`Dokumentasi #${idx + 1}`}
                                                        className="max-w-[115px] max-h-[85px] border border-[#cbd5e1] rounded object-contain"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-[8.5px] italic">- Tidak ada foto -</span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Tabel Daftar Presensi Siswa */}
                    <div className="font-bold uppercase text-[9px] text-[#0f172a] mb-1">
                        DAFTAR KEHADIRAN ANGGOTA EKSTRAKURIKULER:
                    </div>
                    <table className="w-full border-collapse border border-[#94a3b8] mb-3 text-[8.5px]">
                        <thead>
                            <tr className="bg-[#fff7ed] text-[#9a3412] uppercase font-bold text-[8px]">
                                <th className="border border-[#94a3b8] p-1 w-[5%] text-center">NO</th>
                                <th className="border border-[#94a3b8] p-1 w-[35%] text-left">NAMA SISWA</th>
                                <th className="border border-[#94a3b8] p-1 w-[15%] text-center">NISN</th>
                                <th className="border border-[#94a3b8] p-1 w-[15%] text-center">KELAS</th>
                                <th className="border border-[#94a3b8] p-1 w-[15%] text-center">KEHADIRAN</th>
                                <th className="border border-[#94a3b8] p-1 w-[15%] text-left">KETERANGAN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.attendees.map((att, idx) => (
                                <tr key={att.id}>
                                    <td className="border border-[#94a3b8] p-1 text-center font-mono">{idx + 1}</td>
                                    <td className="border border-[#94a3b8] p-1 font-bold">{att.student?.name}</td>
                                    <td className="border border-[#94a3b8] p-1 text-center font-mono">{att.student?.nisn || '-'}</td>
                                    <td className="border border-[#94a3b8] p-1 text-center">{att.student?.classroom?.name || '-'}</td>
                                    <td className="border border-[#94a3b8] p-1 text-center">
                                        {att.is_present ? (
                                            <span className="text-emerald-700 font-bold">✓ Hadir</span>
                                        ) : (
                                            <span className="text-gray-400">✗ Tidak Hadir</span>
                                        )}
                                    </td>
                                    <td className="border border-[#94a3b8] p-1 text-gray-600">{att.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Area Tanda Tangan (Mengetahui Kepala Sekolah di Kiri, Pelatih di Kanan) */}
                    <table className="w-full border-collapse mt-4 text-[9.5px] break-inside-avoid">
                        <tbody>
                            <tr>
                                <td className="w-1/2 text-center align-top">
                                    <p>Mengetahui,</p>
                                    <p className="font-bold mt-0.5">Kepala Sekolah {school.name || ''}</p>
                                    {qrCodeBase64 ? (
                                        <div className="my-1.5 flex flex-col items-center justify-center">
                                            <img
                                                src={qrCodeBase64}
                                                alt="Barcode Validasi Dokumen"
                                                className="size-18 border border-gray-200 p-0.5 bg-white rounded shadow-2xs"
                                            />
                                            <span className="text-[7.5px] font-bold text-emerald-700 mt-0.5">
                                                ✓ TTE Terverifikasi Digital
                                            </span>
                                            <span className="text-[7px] text-gray-400">
                                                Scan barcode untuk validasi
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="h-16" />
                                    )}
                                    <p className="font-bold underline text-[10px]">{principalName}</p>
                                    <p className="text-[9px] text-gray-700 mt-0.5">NIP. {principalNip}</p>
                                </td>
                                <td className="w-1/2 text-center align-top">
                                    <p>{school.city || 'Jakarta'}, {printedDate}</p>
                                    <p className="font-bold mt-0.5">Pelatih / Pembina Ekstrakurikuler</p>
                                    <div className="h-16" />
                                    <p className="font-bold underline text-[10px]">{coachName}</p>
                                    {/* Jika NIP tidak diisi maka baris NIP tidak usah ditampilkan */}
                                    {coachNip && (
                                        <p className="text-[9px] text-gray-700 mt-0.5">NIP. {coachNip}</p>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Catatan Validasi Dokumen (Scan Barcode) */}
                    {qrCodeBase64 && (
                        <div className="mt-4 border border-dashed border-emerald-500 bg-emerald-50/70 p-2.5 rounded-lg text-[8px] text-emerald-950 flex items-center gap-2.5 break-inside-avoid">
                            <span className="text-base select-none shrink-0">🛡️</span>
                            <div className="leading-tight">
                                <strong className="text-emerald-800">Verifikasi Dokumen Resmi:</strong> Dokumen laporan kegiatan ekstrakurikuler ini telah disahkan secara digital oleh Kepala Sekolah.
                                Pindai (scan) barcode QR-Code pada tanda tangan Kepala Sekolah menggunakan kamera smartphone untuk membuktikan keaslian dan melihat detail lengkap laporan ini pada portal resmi sekolah.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
