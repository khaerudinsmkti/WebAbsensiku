<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $title }}</title>
    <style>
        @page {
            margin: 12mm 14mm 12mm 14mm;
            size: A4 portrait;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9.5px;
            color: #1e293b;
            line-height: 1.35;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .logo-cell {
            width: 75px;
            text-align: center;
        }
        .logo-img {
            max-width: 65px;
            max-height: 65px;
        }
        .school-title {
            text-align: center;
        }
        .school-name {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
            color: #0f172a;
        }
        .school-subtitle {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 2px 0;
            color: #ea580c;
            letter-spacing: 0.5px;
        }
        .school-address {
            font-size: 8.5px;
            color: #475569;
            margin: 2px 0 0 0;
        }
        .divider-double {
            border-top: 2px solid #0f172a;
            border-bottom: 1px solid #0f172a;
            height: 2px;
            margin: 6px 0 10px 0;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 9.5px;
        }
        .meta-table td {
            padding: 1.5px 3px;
            vertical-align: top;
        }
        .journal-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            margin-bottom: 10px;
            font-size: 9px;
        }
        .journal-table th, .journal-table td {
            border: 1px solid #64748b;
            padding: 5px 6px;
            vertical-align: top;
        }
        .journal-table th {
            background-color: #fff7ed;
            color: #9a3412;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            font-size: 8.5px;
        }
        .text-center {
            text-align: center;
        }
        .font-bold {
            font-weight: bold;
        }
        .section-title {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            color: #0f172a;
            margin: 6px 0 2px 0;
        }
        .doc-img {
            max-width: 115px;
            max-height: 85px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            margin: 2px auto;
            display: block;
        }
        .attendance-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 3px;
            margin-bottom: 12px;
            font-size: 8.5px;
        }
        .attendance-table th, .attendance-table td {
            border: 1px solid #94a3b8;
            padding: 3.5px 5px;
            vertical-align: middle;
        }
        .attendance-table th {
            background-color: #fff7ed;
            color: #9a3412;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            font-size: 8px;
        }
        .badge-present {
            color: #047857;
            font-weight: bold;
        }
        .badge-absent {
            color: #64748b;
        }
        .signature-table {
            width: 100%;
            margin-top: 14px;
            border-collapse: collapse;
            font-size: 9.5px;
            page-break-inside: avoid;
        }
        .signature-table td {
            vertical-align: top;
            text-align: center;
        }
        .content-block {
            margin-bottom: 5px;
        }
        .content-label {
            font-weight: bold;
            color: #334155;
            display: block;
            margin-bottom: 1px;
        }
    </style>
</head>
<body>
    {{-- Header Kop Surat --}}
    <table class="header-table">
        <tr>
            @if(!empty($logoBase64))
                <td class="logo-cell">
                    <img src="{{ $logoBase64 }}" class="logo-img" alt="Logo">
                </td>
            @endif
            <td class="school-title">
                <p class="school-name">{{ $school->name ?? 'SD NEGERI DIGITAL' }}</p>
                <p class="school-subtitle">LAPORAN KEGIATAN EKSTRAKURIKULER</p>
                @if(!empty($school->address))
                    <p class="school-address">
                        {{ $school->address }}{{ !empty($school->city) ? ', ' . $school->city : '' }}
                        {{ !empty($school->phone) ? ' | Telp: ' . $school->phone : '' }}
                    </p>
                @endif
            </td>
            @if(!empty($logoBase64))
                <td class="logo-cell"></td>
            @endif
        </tr>
    </table>

    <div class="divider-double"></div>

    {{-- Meta Table --}}
    <table class="meta-table">
        <tr>
            <td style="width: 17%; font-weight: bold;">Nama Pelatih</td>
            <td style="width: 2%;">:</td>
            <td style="width: 36%; font-weight: bold;">{{ $coachName }}</td>
            <td style="width: 15%; font-weight: bold;">Jenis Sesi</td>
            <td style="width: 2%;">:</td>
            <td style="width: 28%;">{{ $report->session_type }}</td>
        </tr>
        @if(!empty($coachNip) && trim($coachNip) !== '-' && trim($coachNip) !== '')
            <tr>
                <td style="font-weight: bold;">NIP</td>
                <td>:</td>
                <td>{{ $coachNip }}</td>
                <td style="font-weight: bold;">Hari / Tanggal</td>
                <td>:</td>
                <td>{{ $formattedDate }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Ekstrakurikuler</td>
                <td>:</td>
                <td class="font-bold">{{ $report->extracurricular_name }}</td>
                <td style="font-weight: bold;">Waktu & Tempat</td>
                <td>:</td>
                <td>{{ $report->start_time }} - {{ $report->end_time }} WIB ({{ $report->location }})</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Status</td>
                <td>:</td>
                <td style="color: #047857; font-weight: bold;">Disetujui Kepala Sekolah</td>
                <td style="font-weight: bold;">Kehadiran Murid</td>
                <td>:</td>
                <td><strong>{{ $presentCount }} Hadir</strong> dari {{ count($attendees) }} Murid ({{ $attendancePercent }}%)</td>
            </tr>
        @else
            <tr>
                <td style="font-weight: bold;">Ekstrakurikuler</td>
                <td>:</td>
                <td class="font-bold">{{ $report->extracurricular_name }}</td>
                <td style="font-weight: bold;">Hari / Tanggal</td>
                <td>:</td>
                <td>{{ $formattedDate }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Status</td>
                <td>:</td>
                <td style="color: #047857; font-weight: bold;">Disetujui Kepala Sekolah</td>
                <td style="font-weight: bold;">Waktu & Tempat</td>
                <td>:</td>
                <td>{{ $report->start_time }} - {{ $report->end_time }} WIB ({{ $report->location }})</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Total Presensi</td>
                <td>:</td>
                <td colspan="4"><strong>{{ $presentCount }} Hadir</strong> dari {{ count($attendees) }} Murid ({{ $attendancePercent }}%)</td>
            </tr>
        @endif
    </table>

    {{-- Tabel Utama Sesi Kegiatan (Mirip Jurnal Kepala Sekolah) --}}
    <table class="journal-table">
        <thead>
            <tr>
                <th style="width: 4%;">NO</th>
                <th style="width: 16%;">HARI / TANGGAL</th>
                <th style="width: 22%;">KEGIATAN YANG DIIKUTI</th>
                <th style="width: 38%;">ISI / URAIAN KEGIATAN</th>
                <th style="width: 20%;">DOKUMENTASI</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="text-center font-bold">1</td>
                <td>
                    <div class="font-bold">{{ $formattedDate }}</div>
                    <div style="font-size: 8px; color: #475569; margin-top: 2px;">
                        Pukul {{ $report->start_time }} - {{ $report->end_time }} WIB
                    </div>
                    <div style="font-size: 8px; color: #475569; margin-top: 1px;">
                        Lokasi: {{ $report->location }}
                    </div>
                </td>
                <td>
                    <div class="font-bold" style="color: #0f172a;">{{ $report->extracurricular_name }}</div>
                    <div style="font-size: 8px; color: #ea580c; margin-top: 2px; font-weight: 600;">
                        {{ $report->session_type }}
                    </div>
                </td>
                <td>
                    <div class="content-block">
                        <span class="content-label">• Materi & Aktivitas Latihan:</span>
                        <div style="white-space: pre-line; color: #1e293b;">{{ $report->activity_material }}</div>
                    </div>

                    <div class="content-block" style="margin-top: 4px;">
                        <span class="content-label">• Perkembangan & Hasil Murid:</span>
                        <div style="white-space: pre-line; color: #1e293b;">{{ $report->student_progress }}</div>
                    </div>

                    <div class="content-block" style="margin-top: 4px;">
                        <span class="content-label">• Kendala & Tindak Lanjut:</span>
                        <div style="white-space: pre-line; color: #1e293b;">{{ $report->obstacles_and_followup }}</div>
                    </div>

                    @if(!empty($report->approval_notes))
                        <div class="content-block" style="margin-top: 4px; padding-top: 3px; border-top: 1px dashed #cbd5e1;">
                            <span class="content-label" style="color: #047857;">• Catatan Kepala Sekolah:</span>
                            <div style="font-style: italic; color: #065f46;">"{{ $report->approval_notes }}"</div>
                        </div>
                    @endif
                </td>
                <td class="text-center">
                    @if(!empty($photosBase64) && count($photosBase64) > 0)
                        @foreach($photosBase64 as $b64)
                            <img src="{{ $b64 }}" class="doc-img" alt="Dokumentasi">
                        @endforeach
                    @else
                        <span style="color: #94a3b8; font-size: 8.5px;">- Tidak ada foto -</span>
                    @endif
                </td>
            </tr>
        </tbody>
    </table>

    {{-- Tabel Daftar Kehadiran Siswa --}}
    <div class="section-title">DAFTAR KEHADIRAN ANGGOTA EKSTRAKURIKULER:</div>
    <table class="attendance-table">
        <thead>
            <tr>
                <th style="width: 5%;">NO</th>
                <th style="width: 35%;">NAMA SISWA</th>
                <th style="width: 15%;">NISN</th>
                <th style="width: 15%;">KELAS</th>
                <th style="width: 15%;">KEHADIRAN</th>
                <th style="width: 15%;">KETERANGAN</th>
            </tr>
        </thead>
        <tbody>
            @foreach($attendees as $idx => $att)
                <tr>
                    <td class="text-center">{{ $idx + 1 }}</td>
                    <td class="font-bold">{{ $att->student->name ?? '-' }}</td>
                    <td class="text-center">{{ $att->student->nisn ?? '-' }}</td>
                    <td class="text-center">{{ $att->student->classroom->name ?? '-' }}</td>
                    <td class="text-center">
                        @if($att->is_present)
                            <span class="badge-present">✓ Hadir</span>
                        @else
                            <span class="badge-absent">✗ Tidak Hadir</span>
                        @endif
                    </td>
                    <td>{{ $att->notes ?: '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Tanda Tangan: Mengetahui Kepala Sekolah (Kiri) & Pelatih (Kanan) --}}
    <table class="signature-table">
        <tr>
            <td style="width: 50%;">
                Mengetahui,<br>
                <strong>Kepala Sekolah {{ $school->name ?? '' }}</strong>
                <br><br><br><br><br>
                <strong style="text-decoration: underline;">{{ $principalName }}</strong><br>
                NIP. {{ $principalNip ?: '-' }}
            </td>
            <td style="width: 50%;">
                {{ $school->city ?? 'Jakarta' }}, {{ $printedAt }}<br>
                <strong>Pelatih / Pembina Ekstrakurikuler</strong>
                <br><br><br><br><br>
                <strong style="text-decoration: underline;">{{ $coachName }}</strong><br>
                @if(!empty($coachNip) && trim($coachNip) !== '-' && trim($coachNip) !== '')
                    NIP. {{ $coachNip }}
                @endif
            </td>
        </tr>
    </table>
</body>
</html>
