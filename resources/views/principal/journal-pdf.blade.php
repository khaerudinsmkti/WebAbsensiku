<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $title }}</title>
    <style>
        @page {
            margin: 15mm 14mm 15mm 14mm;
            size: A4 portrait;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            color: #1e293b;
            line-height: 1.4;
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
            font-size: 9px;
            color: #475569;
            margin: 2px 0 0 0;
        }
        .divider-double {
            border-top: 2px solid #0f172a;
            border-bottom: 1px solid #0f172a;
            height: 2px;
            margin: 6px 0 12px 0;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 10px;
        }
        .meta-table td {
            padding: 2px 4px;
        }
        .journal-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            font-size: 9.5px;
        }
        .journal-table th, .journal-table td {
            border: 1px solid #64748b;
            padding: 6px 8px;
            vertical-align: top;
        }
        .journal-table th {
            background-color: #fff7ed;
            color: #9a3412;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            font-size: 9px;
        }
        .text-center {
            text-align: center;
        }
        .font-bold {
            font-weight: bold;
        }
        .doc-img {
            max-width: 115px;
            max-height: 85px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            margin: 2px;
            display: inline-block;
        }
        .signature-table {
            width: 100%;
            margin-top: 24px;
            border-collapse: collapse;
            font-size: 10px;
        }
        .signature-table td {
            vertical-align: top;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            @if(!empty($logoBase64))
                <td class="logo-cell">
                    <img src="{{ $logoBase64 }}" class="logo-img" alt="Logo">
                </td>
            @endif
            <td class="school-title">
                <p class="school-name">{{ $school->name ?? 'SD NEGERI DIGITAL' }}</p>
                <p class="school-subtitle">JURNAL KEGIATAN HARIAN KEPALA SEKOLAH</p>
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

    <table class="meta-table">
        <tr>
            <td style="width: 18%; font-weight: bold;">Nama Kepala Sekolah</td>
            <td style="width: 2%;">:</td>
            <td style="width: 35%; font-weight: bold;">{{ $principalName }}</td>
            <td style="width: 15%; font-weight: bold;">Periode Jurnal</td>
            <td style="width: 2%;">:</td>
            <td style="width: 28%;">{{ $periodLabel }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">NIP</td>
            <td>:</td>
            <td>{{ $principalNip ?: '-' }}</td>
            <td style="font-weight: bold;">Total Kegiatan</td>
            <td>:</td>
            <td>{{ count($journals) }} Kegiatan</td>
        </tr>
    </table>

    <table class="journal-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 18%;">Hari / Tanggal</th>
                <th style="width: 24%;">Kegiatan yang Diikuti</th>
                <th style="width: 33%;">Isi / Uraian Kegiatan</th>
                <th style="width: 20%;">Dokumentasi</th>
            </tr>
        </thead>
        <tbody>
            @forelse($journals as $idx => $item)
                <tr>
                    <td class="text-center font-bold">{{ $idx + 1 }}</td>
                    <td>{{ $item['formatted_date'] }}</td>
                    <td class="font-bold">{{ $item['activity_name'] }}</td>
                    <td style="white-space: pre-line;">{{ $item['activity_content'] }}</td>
                    <td class="text-center">
                        @if(!empty($item['photos_base64']))
                            @foreach($item['photos_base64'] as $b64)
                                <img src="{{ $b64 }}" class="doc-img" alt="Dokumentasi">
                            @endforeach
                            @if($item['total_photos'] > count($item['photos_base64']))
                                <div style="font-size: 8px; color: #64748b; margin-top: 2px;">
                                    +{{ $item['total_photos'] - count($item['photos_base64']) }} foto lainnya
                                </div>
                            @endif
                        @else
                            <span style="color: #94a3b8; font-size: 8.5px;">-</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" class="text-center" style="padding: 18px; color: #64748b;">
                        Tidak ada catatan jurnal kegiatan pada periode ini.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="signature-table">
        <tr>
            <td style="width: 60%;"></td>
            <td style="width: 40%; text-align: center;">
                {{ $school->city ?? 'Jakarta' }}, {{ $printedAt }}<br>
                <strong>Kepala Sekolah {{ $school->name ?? '' }}</strong>
                <br><br><br><br><br>
                <strong style="text-decoration: underline;">{{ $principalName }}</strong><br>
                NIP. {{ $principalNip ?: '-' }}
            </td>
        </tr>
    </table>
</body>
</html>

