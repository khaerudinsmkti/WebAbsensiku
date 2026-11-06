<?php

namespace App\Http\Controllers;

use App\Models\AcademicHoliday;
use App\Models\Classroom;
use App\Models\SchoolSetting;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    protected array $monthNames = [
        1 => 'Januari',
        2 => 'Februari',
        3 => 'Maret',
        4 => 'April',
        5 => 'Mei',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'Agustus',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    /**
     * Helper to resolve filters, classrooms, matrix days and student attendances.
     */
    protected function resolveReportData(Request $request): array
    {
        $user = $request->user();
        $isRestrictedTeacher = $user->role === 'teacher' && ! $user->isDutyTeacherToday();

        $classroomsQuery = Classroom::with('homeroomTeacher:id,name,nip')->orderBy('name');
        if ($isRestrictedTeacher) {
            $classroomsQuery->where('homeroom_teacher_id', $user->id);
        }
        $classrooms = $classroomsQuery->get();

        $selectedClassroomId = $request->input('classroom_id');
        if ($isRestrictedTeacher) {
            if (! $selectedClassroomId || ! $classrooms->contains('id', (int) $selectedClassroomId)) {
                $selectedClassroomId = $classrooms->first()?->id;
            }
        } elseif (! $selectedClassroomId) {
            $selectedClassroomId = $classrooms->first()?->id;
        }

        $selectedClassroomId = $selectedClassroomId ? (int) $selectedClassroomId : 0;
        $classroom = $selectedClassroomId ? $classrooms->firstWhere('id', $selectedClassroomId) : null;

        $filterType = $request->input('filter_type', 'monthly');
        $month = (int) $request->input('month', Carbon::today()->month);
        $year = (int) $request->input('year', Carbon::today()->year);

        if ($filterType === 'monthly') {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();
            $periodLabel = 'Bulan ' . ($this->monthNames[$month] ?? '') . ' ' . $year;
        } elseif ($filterType === 'yearly') {
            $startDate = Carbon::createFromDate($year, 1, 1)->startOfYear()->toDateString();
            $endDate = Carbon::createFromDate($year, 12, 31)->endOfYear()->toDateString();
            $periodLabel = 'Tahun ' . $year;
        } else {
            $filterType = 'custom';
            $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
            $endDate = $request->input('end_date', Carbon::today()->toDateString());
            $periodLabel = Carbon::parse($startDate)->format('d/m/Y') . ' s.d. ' . Carbon::parse($endDate)->format('d/m/Y');
        }

        $carbonStart = Carbon::parse($startDate);
        $carbonEnd = Carbon::parse($endDate);
        $daysCount = $carbonStart->diffInDays($carbonEnd) + 1;

        // Single query for official holidays in this date range (reused for both matrix and periodHolidays)
        $periodHolidays = AcademicHoliday::where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
                ->orWhereBetween('end_date', [$startDate, $endDate])
                ->orWhere(function ($sub) use ($startDate, $endDate) {
                    $sub->where('start_date', '<=', $startDate)
                        ->where('end_date', '>=', $endDate);
                });
        })->orderBy('start_date')->get();

        $holidayDates = [];
        foreach ($periodHolidays as $h) {
            $curr = Carbon::parse($h->start_date);
            $endC = Carbon::parse($h->end_date);
            if ($curr->lt($carbonStart)) {
                $curr = $carbonStart->copy();
            }
            if ($endC->gt($carbonEnd)) {
                $endC = $carbonEnd->copy();
            }
            while ($curr->lte($endC)) {
                $dStr = $curr->toDateString();
                $holidayDates[$dStr] = [
                    'name' => $h->name,
                    'type' => $h->type,
                    'type_name' => $h->type_name,
                    'description' => $h->description,
                ];
                $curr->addDay();
            }
        }

        $indoDays = [
            0 => ['name' => 'Minggu', 'initial' => 'M'],
            1 => ['name' => 'Senin', 'initial' => 'S'],
            2 => ['name' => 'Selasa', 'initial' => 'S'],
            3 => ['name' => 'Rabu', 'initial' => 'R'],
            4 => ['name' => 'Kamis', 'initial' => 'K'],
            5 => ['name' => 'Jumat', 'initial' => 'J'],
            6 => ['name' => 'Sabtu', 'initial' => 'S'],
        ];

        $days = [];
        $isSaturdayOff = AcademicHoliday::isSaturdayHoliday();

        if ($filterType === 'monthly' || $daysCount <= 31) {
            $temp = $carbonStart->copy();
            while ($temp->lte($carbonEnd)) {
                $dateStr = $temp->toDateString();
                $isHoliday = isset($holidayDates[$dateStr]);
                $holidayInfo = $holidayDates[$dateStr] ?? null;
                $dayOfWeek = $temp->dayOfWeek;
                $dayData = $indoDays[$dayOfWeek] ?? [
                    'name' => $temp->translatedFormat('D'),
                    'initial' => strtoupper(substr($temp->translatedFormat('D'), 0, 1)),
                ];
                $isSunday = $temp->isSunday();
                $isSaturday = $temp->isSaturday();
                $isSaturdayHoliday = $isSaturday && $isSaturdayOff;
                $isWeekend = $isSunday || $isSaturdayHoliday;

                $days[] = [
                    'date' => $dateStr,
                    'day' => $temp->day,
                    'day_name' => $dayData['name'],
                    'day_initial' => $dayData['initial'],
                    'is_sunday' => $isSunday,
                    'is_saturday' => $isSaturday,
                    'is_saturday_off' => $isSaturdayHoliday,
                    'is_weekend' => $isWeekend,
                    'is_holiday' => $isHoliday,
                    'holiday_name' => $holidayInfo['name'] ?? null,
                    'holiday_type' => $holidayInfo['type'] ?? null,
                    'holiday_type_name' => $holidayInfo['type_name'] ?? null,
                    'holiday_description' => $holidayInfo['description'] ?? null,
                ];
                $temp->addDay();
            }
        }

        // Calculate effective school days (excluding weekends and official holidays)
        $effectiveSchoolDays = 0;
        $dailyTotals = [];
        foreach ($days as $dayInfo) {
            if (! $dayInfo['is_weekend'] && ! $dayInfo['is_holiday']) {
                $effectiveSchoolDays++;
            }
            $dailyTotals[$dayInfo['day']] = [
                'hadir' => 0,
                'sakit' => 0,
                'izin' => 0,
                'alpha' => 0,
                'terlambat' => 0,
                'is_sunday' => $dayInfo['is_sunday'],
                'is_saturday' => $dayInfo['is_saturday'],
                'is_weekend' => $dayInfo['is_weekend'],
                'is_holiday' => $dayInfo['is_holiday'],
                'holiday_name' => $dayInfo['holiday_name'],
            ];
        }

        $students = [];
        $maleCount = 0;
        $femaleCount = 0;
        $sumHadir = $sumSakit = $sumIzin = $sumAlpha = $sumTerlambat = $sumPulangAwal = 0;

        if ($selectedClassroomId) {
            $studentsData = Student::where('classroom_id', $selectedClassroomId)
                ->where('is_active', true)
                ->select('id', 'classroom_id', 'nisn', 'nis', 'name', 'gender')
                ->orderBy('name')
                ->get();

            $studentIds = $studentsData->pluck('id')->all();

            if (! empty($studentIds)) {
                if (! empty($days)) {
                    // Matrix mode (<= 31 days): single lightweight query without hydrating Eloquent models
                    $rawAttendances = DB::table('attendances')
                        ->whereIn('student_id', $studentIds)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->selectRaw('
                            attendances.student_id,
                            attendances.date,
                            attendances.status,
                            attendances.is_late,
                            attendances.late_minutes,
                            attendances.check_in_time,
                            attendances.notes,
                            EXISTS(SELECT 1 FROM attendance_adjustments WHERE attendance_adjustments.attendance_id = attendances.id) as has_adjustment
                        ')
                        ->get()
                        ->groupBy('student_id');

                    foreach ($studentsData as $student) {
                        if ($student->gender === 'L') {
                            $maleCount++;
                        } elseif ($student->gender === 'P') {
                            $femaleCount++;
                        }

                        $atts = $rawAttendances->get($student->id, collect());
                        $hadir = 0;
                        $sakit = 0;
                        $izin = 0;
                        $alpha = 0;
                        $terlambat = 0;
                        $pulangAwal = 0;
                        $attsByDate = [];

                        foreach ($atts as $att) {
                            $dateKey = substr((string) $att->date, 0, 10);
                            $attsByDate[$dateKey] = $att;

                            if ($att->status === 'present') {
                                $hadir++;
                                if ($att->is_late) {
                                    $terlambat++;
                                }
                            } elseif ($att->status === 'sick') {
                                $sakit++;
                            } elseif ($att->status === 'permit') {
                                $izin++;
                            } elseif ($att->status === 'absent') {
                                $alpha++;
                            }

                            if ($att->has_adjustment) {
                                $pulangAwal++;
                            }
                        }

                        $totalRecorded = $hadir + $sakit + $izin + $alpha;
                        $denominator = $effectiveSchoolDays > 0 ? $effectiveSchoolDays : ($totalRecorded > 0 ? $totalRecorded : 1);
                        $percentage = min(100, round(($hadir / $denominator) * 100, 1));

                        $dailyAttendances = [];
                        foreach ($days as $dayInfo) {
                            $d = $dayInfo['day'];
                            $dateStr = $dayInfo['date'];
                            $att = $attsByDate[$dateStr] ?? null;

                            if ($att) {
                                if ($att->status === 'present') {
                                    $dailyTotals[$d]['hadir']++;
                                    if ($att->is_late) {
                                        $dailyTotals[$d]['terlambat']++;
                                    }
                                    $code = $att->is_late ? 'T' : 'H';
                                    $statusLabel = $att->is_late ? 'Terlambat (' . ($att->late_minutes ?? 0) . ' menit)' : 'Hadir Tepat Waktu';
                                } elseif ($att->status === 'sick') {
                                    $dailyTotals[$d]['sakit']++;
                                    $code = 'S';
                                    $statusLabel = 'Sakit' . ($att->notes ? ' (' . $att->notes . ')' : '');
                                } elseif ($att->status === 'permit') {
                                    $dailyTotals[$d]['izin']++;
                                    $code = 'I';
                                    $statusLabel = 'Izin' . ($att->notes ? ' (' . $att->notes . ')' : '');
                                } elseif ($att->status === 'absent') {
                                    $dailyTotals[$d]['alpha']++;
                                    $code = 'A';
                                    $statusLabel = 'Alpa (Tanpa Keterangan)';
                                } else {
                                    $code = '-';
                                    $statusLabel = '-';
                                }

                                $dailyAttendances[$d] = [
                                    'code' => $code,
                                    'status' => $att->status,
                                    'status_label' => $statusLabel,
                                    'is_late' => (bool) $att->is_late,
                                    'late_minutes' => (int) ($att->late_minutes ?? 0),
                                    'check_in_time' => $att->check_in_time,
                                    'notes' => $att->notes,
                                ];
                            } else {
                                if ($dayInfo['is_holiday']) {
                                    $code = 'L';
                                    $status = 'holiday';
                                    $statusLabel = 'Libur: ' . ($dayInfo['holiday_name'] ?? 'Libur Resmi Sekolah');
                                } elseif ($dayInfo['is_sunday'] || ($dayInfo['is_saturday_off'] ?? false)) {
                                    $code = '-';
                                    $status = 'weekend';
                                    $statusLabel = 'Libur Akhir Pekan';
                                } else {
                                    $code = '.';
                                    $status = 'empty';
                                    $statusLabel = 'Belum Ada Presensi';
                                }

                                $dailyAttendances[$d] = [
                                    'code' => $code,
                                    'status' => $status,
                                    'status_label' => $statusLabel,
                                    'is_late' => false,
                                    'late_minutes' => 0,
                                    'check_in_time' => null,
                                    'notes' => $dayInfo['holiday_name'] ?? ($dayInfo['is_weekend'] ? 'Libur Akhir Pekan' : null),
                                ];
                            }
                        }

                        $sumHadir += $hadir;
                        $sumSakit += $sakit;
                        $sumIzin += $izin;
                        $sumAlpha += $alpha;
                        $sumTerlambat += $terlambat;
                        $sumPulangAwal += $pulangAwal;

                        $students[] = [
                            'id' => $student->id,
                            'nisn' => $student->nisn,
                            'nis' => $student->nis,
                            'name' => $student->name,
                            'gender' => $student->gender,
                            'hadir' => $hadir,
                            'sakit' => $sakit,
                            'izin' => $izin,
                            'alpha' => $alpha,
                            'terlambat' => $terlambat,
                            'pulang_awal' => $pulangAwal,
                            'percentage' => $percentage,
                            'daily_attendances' => $dailyAttendances,
                        ];
                    }
                } else {
                    // Summary-only mode (> 31 days / Yearly): aggregate directly in SQL without loading thousands of rows
                    $aggByStudent = DB::table('attendances')
                        ->whereIn('student_id', $studentIds)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->groupBy('student_id')
                        ->selectRaw("
                            student_id,
                            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as hadir,
                            SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END) as sakit,
                            SUM(CASE WHEN status = 'permit' THEN 1 ELSE 0 END) as izin,
                            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as alpha,
                            SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) as terlambat,
                            SUM(CASE WHEN EXISTS(SELECT 1 FROM attendance_adjustments WHERE attendance_adjustments.attendance_id = attendances.id) THEN 1 ELSE 0 END) as pulang_awal
                        ")
                        ->get()
                        ->keyBy('student_id');

                    foreach ($studentsData as $student) {
                        if ($student->gender === 'L') {
                            $maleCount++;
                        } elseif ($student->gender === 'P') {
                            $femaleCount++;
                        }

                        $agg = $aggByStudent->get($student->id);
                        $hadir = (int) ($agg->hadir ?? 0);
                        $sakit = (int) ($agg->sakit ?? 0);
                        $izin = (int) ($agg->izin ?? 0);
                        $alpha = (int) ($agg->alpha ?? 0);
                        $terlambat = (int) ($agg->terlambat ?? 0);
                        $pulangAwal = (int) ($agg->pulang_awal ?? 0);

                        $totalRecorded = $hadir + $sakit + $izin + $alpha;
                        $denominator = $totalRecorded > 0 ? $totalRecorded : 1;
                        $percentage = min(100, round(($hadir / $denominator) * 100, 1));

                        $sumHadir += $hadir;
                        $sumSakit += $sakit;
                        $sumIzin += $izin;
                        $sumAlpha += $alpha;
                        $sumTerlambat += $terlambat;
                        $sumPulangAwal += $pulangAwal;

                        $students[] = [
                            'id' => $student->id,
                            'nisn' => $student->nisn,
                            'nis' => $student->nis,
                            'name' => $student->name,
                            'gender' => $student->gender,
                            'hadir' => $hadir,
                            'sakit' => $sakit,
                            'izin' => $izin,
                            'alpha' => $alpha,
                            'terlambat' => $terlambat,
                            'pulang_awal' => $pulangAwal,
                            'percentage' => $percentage,
                            'daily_attendances' => [],
                        ];
                    }
                }
            }
        }

        $genderStats = [
            'male' => $maleCount,
            'female' => $femaleCount,
            'total' => $maleCount + $femaleCount,
        ];

        $summary = [
            'total_students' => count($students),
            'total_hadir' => $sumHadir,
            'total_sakit' => $sumSakit,
            'total_izin' => $sumIzin,
            'total_alpha' => $sumAlpha,
            'total_terlambat' => $sumTerlambat,
            'total_pulang_awal' => $sumPulangAwal,
            'effective_school_days' => $effectiveSchoolDays,
        ];

        return [
            'classrooms' => $classrooms,
            'selectedClassroomId' => (int) $selectedClassroomId,
            'classroom' => $classroom,
            'filterType' => $filterType,
            'month' => $month,
            'year' => $year,
            'monthName' => $this->monthNames[$month] ?? 'Januari',
            'startDate' => $startDate,
            'endDate' => $endDate,
            'periodLabel' => $periodLabel,
            'days' => $days,
            'students' => $students,
            'dailyTotals' => $dailyTotals,
            'summary' => $summary,
            'genderStats' => $genderStats,
            'monthNames' => $this->monthNames,
            'periodHolidays' => $periodHolidays,
        ];
    }

    public function index(Request $request): Response
    {
        $data = $this->resolveReportData($request);

        return Inertia::render('reports/index', [
            'classrooms' => $data['classrooms'],
            'selectedClassroomId' => $data['selectedClassroomId'],
            'filterType' => $data['filterType'],
            'month' => $data['month'],
            'year' => $data['year'],
            'monthName' => $data['monthName'],
            'startDate' => $data['startDate'],
            'endDate' => $data['endDate'],
            'periodLabel' => $data['periodLabel'],
            'days' => $data['days'],
            'students' => $data['students'],
            'dailyTotals' => $data['dailyTotals'],
            'summary' => $data['summary'],
            'genderStats' => $data['genderStats'],
            'monthNames' => $this->monthNames,
            'periodHolidays' => $data['periodHolidays'],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $data = $this->resolveReportData($request);
        $classroom = $data['classroom'];
        $className = $classroom ? str_replace(' ', '_', $classroom->name) : 'Semua_Kelas';
        $periodLabel = str_replace(' ', '_', $data['periodLabel']);
        $days = $data['days'];
        $students = $data['students'];
        $dailyTotals = $data['dailyTotals'];
        $genderStats = $data['genderStats'];
        $school = SchoolSetting::getSetting();

        $fileName = "Rekap_Presensi_{$className}_{$periodLabel}.xls";

        return response()->streamDownload(function () use ($students, $days, $classroom, $genderStats, $data, $school, $dailyTotals) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            $output = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            $output .= '<head>';
            $output .= '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
            $output .= '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Rekap Presensi</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
            $output .= '<style>';
            $output .= 'table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; }';
            $output .= 'th, td { border: 1px solid #B0BEC5; padding: 6px 8px; vertical-align: middle; }';
            $output .= 'th { background-color: #EA580C; color: #FFFFFF; font-weight: bold; text-align: center; }';
            $output .= 'th.sub { background-color: #F97316; font-size: 10px; }';
            $output .= '.text-center { text-align: center; }';
            $output .= '.text-left { text-align: left; }';
            $output .= '.text-right { text-align: right; }';
            $output .= '.font-bold { font-weight: bold; }';
            $output .= '.weekend { background-color: #FEE2E2; color: #DC2626; text-align: center; font-weight: bold; }';
            $output .= '.num { mso-number-format: "\@"; text-align: center; }';
            $output .= '.meta-title { font-size: 15px; font-weight: bold; color: #1E293B; text-align: center; border: none; }';
            $output .= '.meta-sub { font-size: 11px; color: #64748B; text-align: center; border: none; }';
            $output .= '.meta-info { font-size: 11px; font-weight: bold; color: #334155; border: none; }';
            $output .= '.footer-total { background-color: #F1F5F9; font-weight: bold; text-align: center; }';
            $output .= '</style>';
            $output .= '</head>';
            $output .= '<body>';

            $totalCols = 6 + count($days) + 6;

            // Header Meta Information
            $output .= '<table>';
            $output .= '<tr><td colspan="' . $totalCols . '" class="meta-title">' . htmlspecialchars(strtoupper($school->name ?? 'SEKOLAH DIGITAL')) . '</td></tr>';
            $output .= '<tr><td colspan="' . $totalCols . '" class="meta-title">DAFTAR HADIR SISWA (REKAPITULASI PRESENSI)</td></tr>';
            $output .= '<tr><td colspan="' . $totalCols . '" class="meta-sub">Periode: ' . htmlspecialchars($data['periodLabel']) . ' | Kelas: ' . htmlspecialchars($classroom?->name ?? 'Semua Kelas') . '</td></tr>';
            $output .= '<tr><td colspan="' . $totalCols . '" style="border:none;">&nbsp;</td></tr>';
            $output .= '</table>';

            // Main Matrix Table
            $output .= '<table>';
            $output .= '<thead>';
            $output .= '<tr>';
            $output .= '<th rowspan="2">No</th>';
            $output .= '<th rowspan="2">NISN</th>';
            $output .= '<th rowspan="2">NIS</th>';
            $output .= '<th rowspan="2">Nama Peserta Didik</th>';
            $output .= '<th rowspan="2">Kelas</th>';
            $output .= '<th rowspan="2">L/P</th>';

            if (count($days) > 0) {
                $output .= '<th colspan="' . count($days) . '">Tanggal</th>';
            }

            $output .= '<th colspan="6">Rekapitulasi Kehadiran</th>';
            $output .= '</tr>';

            // Subheader: Days 1-31 and Status Titles
            $output .= '<tr>';
            if (count($days) > 0) {
                foreach ($days as $day) {
                    $isWeekendOrHoliday = $day['is_weekend'] || !empty($day['is_holiday']);
                    $thClass = $isWeekendOrHoliday ? 'weekend' : 'sub';
                    $output .= '<th class="' . $thClass . '">' . $day['day'] . '<br><small>' . ($day['day_initial'] ?? '') . '</small></th>';
                }
            }
            $output .= '<th class="sub">Hadir (H)</th>';
            $output .= '<th class="sub">Sakit (S)</th>';
            $output .= '<th class="sub">Izin (I)</th>';
            $output .= '<th class="sub">Alpha (A)</th>';
            $output .= '<th class="sub">Telat (T)</th>';
            $output .= '<th class="sub">% Hadir</th>';
            $output .= '</tr>';
            $output .= '</thead>';

            // Rows
            $output .= '<tbody>';
            $no = 1;
            foreach ($students as $student) {
                $output .= '<tr>';
                $output .= '<td class="text-center font-bold">' . $no++ . '</td>';
                $output .= '<td class="num">' . htmlspecialchars($student['nisn']) . '</td>';
                $output .= '<td class="num">' . htmlspecialchars($student['nis']) . '</td>';
                $output .= '<td class="font-bold">' . htmlspecialchars($student['name']) . '</td>';
                $output .= '<td class="text-center">' . htmlspecialchars($classroom?->name ?? '-') . '</td>';
                $output .= '<td class="text-center font-bold">' . $student['gender'] . '</td>';

                if (count($days) > 0) {
                    foreach ($days as $day) {
                        $daily = $student['daily_attendances'][$day['day']] ?? null;
                        $code = $daily['code'] ?? ($day['is_weekend'] ? '-' : '.');
                        $isWeekendOrHoliday = $day['is_weekend'] || !empty($day['is_holiday']);
                        $cellClass = $isWeekendOrHoliday ? 'weekend' : 'text-center';
                        $output .= '<td class="' . $cellClass . '">' . htmlspecialchars($code) . '</td>';
                    }
                }

                $output .= '<td class="text-center font-bold" style="color:#059669;">' . $student['hadir'] . '</td>';
                $output .= '<td class="text-center font-bold" style="color:#2563EB;">' . $student['sakit'] . '</td>';
                $output .= '<td class="text-center font-bold" style="color:#D97706;">' . $student['izin'] . '</td>';
                $output .= '<td class="text-center font-bold" style="color:#DC2626;">' . $student['alpha'] . '</td>';
                $output .= '<td class="text-center font-bold" style="color:#7C3AED;">' . $student['terlambat'] . '</td>';
                $output .= '<td class="text-center font-bold">' . $student['percentage'] . '%</td>';
                $output .= '</tr>';
            }
            $output .= '</tbody>';

            // Footer: Daily Totals
            if (count($days) > 0) {
                $output .= '<tfoot>';
                $output .= '<tr>';
                $output .= '<td colspan="6" class="footer-total" style="text-align:right;">Jumlah Hadir Per Tanggal:</td>';
                foreach ($days as $day) {
                    $d = $day['day'];
                    $tot = $dailyTotals[$d]['hadir'] ?? 0;
                    $isWeekendOrHoliday = $day['is_weekend'] || !empty($day['is_holiday']);
                    $cellClass = $isWeekendOrHoliday ? 'weekend' : 'footer-total';
                    $output .= '<td class="' . $cellClass . '">' . ($isWeekendOrHoliday ? '-' : $tot) . '</td>';
                }
                $output .= '<td class="footer-total">' . $data['summary']['total_hadir'] . '</td>';
                $output .= '<td class="footer-total">' . $data['summary']['total_sakit'] . '</td>';
                $output .= '<td class="footer-total">' . $data['summary']['total_izin'] . '</td>';
                $output .= '<td class="footer-total">' . $data['summary']['total_alpha'] . '</td>';
                $output .= '<td class="footer-total">' . $data['summary']['total_terlambat'] . '</td>';
                $output .= '<td class="footer-total">-</td>';
                $output .= '</tr>';
                $output .= '</tfoot>';
            }

            $output .= '</table>';

            // Summary notes & signatures
            $output .= '<br/>';
            $output .= '<table>';
            $output .= '<tr><td colspan="4" class="meta-info">Keterangan Siswa:</td></tr>';
            $output .= '<tr><td colspan="4" style="border:none;">Jumlah Laki-laki = ' . ($genderStats['male'] ?? 0) . ' Siswa</td></tr>';
            $output .= '<tr><td colspan="4" style="border:none;">Jumlah Perempuan = ' . ($genderStats['female'] ?? 0) . ' Siswa</td></tr>';
            $output .= '<tr><td colspan="4" style="border:none;font-weight:bold;">Total = ' . ($genderStats['total'] ?? 0) . ' Siswa</td></tr>';
            $output .= '<tr><td colspan="4" style="border:none;">&nbsp;</td></tr>';
            $output .= '<tr>';
            $output .= '<td colspan="3" style="border:none;">Mengetahui,<br/>Kepala Sekolah ' . htmlspecialchars($school->name ?? '') . '<br/><br/><br/><br/><b>' . htmlspecialchars($school->principal_name ?? '-') . '</b><br/>NIP. ' . htmlspecialchars($school->principal_nip ?? '-') . '</td>';
            $output .= '<td colspan="3" style="border:none;">' . htmlspecialchars($school->city ?? 'Kota') . ', ' . Carbon::today()->translatedFormat('d F Y') . '<br/>Wali Kelas ' . htmlspecialchars($classroom?->name ?? '') . '<br/><br/><br/><br/><b>' . htmlspecialchars($classroom?->homeroomTeacher?->name ?? '-') . '</b><br/>NIP. ' . htmlspecialchars($classroom?->homeroomTeacher?->nip ?? '-') . '</td>';
            $output .= '</tr>';
            $output .= '</table>';

            $output .= '</body></html>';

            fwrite($handle, $output);
            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }

    public function exportPdf(Request $request): HttpResponse
    {
        $data = $this->resolveReportData($request);
        $school = SchoolSetting::getSetting();

        // Convert school logo to base64 for reliable PDF rendering
        $logoBase64 = null;
        if ($school->logo_path && file_exists(storage_path('app/public/' . $school->logo_path))) {
            $imageData = base64_encode(file_get_contents(storage_path('app/public/' . $school->logo_path)));
            $mime = mime_content_type(storage_path('app/public/' . $school->logo_path));
            $logoBase64 = "data:{$mime};base64,{$imageData}";
        }

        $className = $data['classroom'] ? str_replace(' ', '_', $data['classroom']->name) : 'Semua_Kelas';
        $periodLabel = str_replace(' ', '_', $data['periodLabel']);
        $fileName = "Laporan_Presensi_{$className}_{$periodLabel}.pdf";

        $pdf = Pdf::loadView('reports.pdf', [
            ...$data,
            'school' => $school,
            'logoBase64' => $logoBase64,
            'title' => 'Laporan Presensi ' . ($data['classroom']->name ?? '') . ' - ' . $data['periodLabel'],
            'printedAt' => now()->translatedFormat('d F Y'),
        ]);

        $pdf->setPaper('a4', 'landscape');

        return $pdf->download($fileName);
    }
}
