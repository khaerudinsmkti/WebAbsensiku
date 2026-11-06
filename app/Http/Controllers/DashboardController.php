<?php

namespace App\Http\Controllers;

use App\Models\AcademicHoliday;
use App\Models\Classroom;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        if ($user && $user->isPublisher()) {
            return redirect()->route('news.index');
        }

        $today = Carbon::today()->toDateString();
        $date = $request->input('date', $today);

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $carbonDate = Carbon::parse($date);
        $dailyLabel = $carbonDate->day . ' ' . ($monthNames[$carbonDate->month] ?? '') . ' ' . $carbonDate->year;

        $monthStart = $carbonDate->copy()->startOfMonth()->toDateString();
        $monthEnd = $carbonDate->copy()->endOfMonth()->toDateString();
        $monthlyLabel = ($monthNames[$carbonDate->month] ?? '') . ' ' . $carbonDate->year;

        $yearStart = $carbonDate->copy()->startOfYear()->toDateString();
        $yearEnd = $carbonDate->copy()->endOfYear()->toDateString();
        $yearlyLabel = 'Tahun ' . $carbonDate->year;

        $isDutyToday = $user->isDutyTeacherToday($date);
        $isOverallAuthorized = $user->isAdmin() || $user->isPrincipal() || $isDutyToday;

        // Single query for classrooms + homeroomTeacher + active student counts
        $classroomsQuery = Classroom::with('homeroomTeacher:id,name,nip')
            ->withCount(['students' => function ($q) {
                $q->where('is_active', true)->where('is_alumni', false);
            }])
            ->orderBy('name');

        if (! $isOverallAuthorized) {
            $classroomsQuery->where('homeroom_teacher_id', $user->id);
        }
        $classrooms = $classroomsQuery->get();
        $classroomsById = $classrooms->keyBy('id');

        $selectedClassroomId = $request->input('classroom_id');

        if (! $isOverallAuthorized) {
            if (! $selectedClassroomId || ! $classroomsById->has((int) $selectedClassroomId)) {
                $selectedClassroomId = $classrooms->first()?->id;
            }
        } else {
            if ($selectedClassroomId && ! $classroomsById->has((int) $selectedClassroomId)) {
                $selectedClassroomId = null;
            }
        }

        $selectedClassroomId = $selectedClassroomId ? (int) $selectedClassroomId : null;
        $hasNoAssignedClass = ! $isOverallAuthorized && $classrooms->isEmpty();

        $userRoleLabel = 'Guru Pengajar';
        if ($user->isAdmin()) {
            $userRoleLabel = 'Administrator';
        } elseif ($user->isPrincipal()) {
            $userRoleLabel = 'Kepala Sekolah';
        } elseif ($user->isStudent()) {
            $userRoleLabel = 'Siswa';
        } else {
            $homeroomNames = $classrooms
                ->where('homeroom_teacher_id', $user->id)
                ->pluck('name')
                ->join(', ');

            if ($homeroomNames && $isDutyToday) {
                $userRoleLabel = 'Wali Kelas ' . $homeroomNames . ' • Guru Piket';
            } elseif ($homeroomNames) {
                $userRoleLabel = 'Wali Kelas ' . $homeroomNames;
            } elseif ($isDutyToday) {
                $userRoleLabel = 'Guru Piket';
            } else {
                $userRoleLabel = 'Guru Pengajar';
            }
        }

        // Compute total active students directly from already loaded classroom counts
        $totalStudents = 0;
        if (! $hasNoAssignedClass) {
            if ($selectedClassroomId) {
                $totalStudents = (int) ($classroomsById->get($selectedClassroomId)?->students_count ?? 0);
            } else {
                $totalStudents = (int) $classrooms->sum('students_count');
            }
        }

        // Combined single-pass query for Daily, Monthly, and Yearly Attendance Stats
        $dHadir = $dSakit = $dIzin = $dAlpha = $dTerlambat = $dRecords = $dAdjustments = 0;
        $mHadir = $mSakit = $mIzin = $mAlpha = $mTerlambat = $mRecords = $mAdjustments = 0;
        $yHadir = $ySakit = $yIzin = $yAlpha = $yTerlambat = $yRecords = $yAdjustments = 0;

        if (! $hasNoAssignedClass) {
            $statsRow = DB::table('attendances')
                ->join('students', 'attendances.student_id', '=', 'students.id')
                ->whereBetween('attendances.date', [$yearStart, $yearEnd])
                ->where('students.is_active', true)
                ->where('students.is_alumni', false)
                ->when($selectedClassroomId, fn ($q) => $q->where('students.classroom_id', $selectedClassroomId))
                ->selectRaw("
                    COUNT(*) as y_records,
                    COALESCE(SUM(CASE WHEN attendances.status = 'present' THEN 1 ELSE 0 END), 0) as y_hadir,
                    COALESCE(SUM(CASE WHEN attendances.status = 'sick' THEN 1 ELSE 0 END), 0) as y_sakit,
                    COALESCE(SUM(CASE WHEN attendances.status = 'permit' THEN 1 ELSE 0 END), 0) as y_izin,
                    COALESCE(SUM(CASE WHEN attendances.status = 'absent' THEN 1 ELSE 0 END), 0) as y_alpha,
                    COALESCE(SUM(CASE WHEN attendances.is_late = 1 THEN 1 ELSE 0 END), 0) as y_terlambat,

                    COALESCE(SUM(CASE WHEN attendances.date BETWEEN ? AND ? THEN 1 ELSE 0 END), 0) as m_records,
                    COALESCE(SUM(CASE WHEN attendances.date BETWEEN ? AND ? AND attendances.status = 'present' THEN 1 ELSE 0 END), 0) as m_hadir,
                    COALESCE(SUM(CASE WHEN attendances.date BETWEEN ? AND ? AND attendances.status = 'sick' THEN 1 ELSE 0 END), 0) as m_sakit,
                    COALESCE(SUM(CASE WHEN attendances.date BETWEEN ? AND ? AND attendances.status = 'permit' THEN 1 ELSE 0 END), 0) as m_izin,
                    COALESCE(SUM(CASE WHEN attendances.date BETWEEN ? AND ? AND attendances.status = 'absent' THEN 1 ELSE 0 END), 0) as m_alpha,
                    COALESCE(SUM(CASE WHEN attendances.date BETWEEN ? AND ? AND attendances.is_late = 1 THEN 1 ELSE 0 END), 0) as m_terlambat,

                    COALESCE(SUM(CASE WHEN attendances.date = ? THEN 1 ELSE 0 END), 0) as d_records,
                    COALESCE(SUM(CASE WHEN attendances.date = ? AND attendances.status = 'present' THEN 1 ELSE 0 END), 0) as d_hadir,
                    COALESCE(SUM(CASE WHEN attendances.date = ? AND attendances.status = 'sick' THEN 1 ELSE 0 END), 0) as d_sakit,
                    COALESCE(SUM(CASE WHEN attendances.date = ? AND attendances.status = 'permit' THEN 1 ELSE 0 END), 0) as d_izin,
                    COALESCE(SUM(CASE WHEN attendances.date = ? AND attendances.status = 'absent' THEN 1 ELSE 0 END), 0) as d_alpha,
                    COALESCE(SUM(CASE WHEN attendances.date = ? AND attendances.is_late = 1 THEN 1 ELSE 0 END), 0) as d_terlambat
                ", [
                    $monthStart, $monthEnd,
                    $monthStart, $monthEnd,
                    $monthStart, $monthEnd,
                    $monthStart, $monthEnd,
                    $monthStart, $monthEnd,
                    $monthStart, $monthEnd,
                    $date, $date, $date, $date, $date, $date,
                ])
                ->first();

            if ($statsRow) {
                $dRecords = (int) $statsRow->d_records;
                $dHadir = (int) $statsRow->d_hadir;
                $dSakit = (int) $statsRow->d_sakit;
                $dIzin = (int) $statsRow->d_izin;
                $dAlpha = (int) $statsRow->d_alpha;
                $dTerlambat = (int) $statsRow->d_terlambat;

                $mRecords = (int) $statsRow->m_records;
                $mHadir = (int) $statsRow->m_hadir;
                $mSakit = (int) $statsRow->m_sakit;
                $mIzin = (int) $statsRow->m_izin;
                $mAlpha = (int) $statsRow->m_alpha;
                $mTerlambat = (int) $statsRow->m_terlambat;

                $yRecords = (int) $statsRow->y_records;
                $yHadir = (int) $statsRow->y_hadir;
                $ySakit = (int) $statsRow->y_sakit;
                $yIzin = (int) $statsRow->y_izin;
                $yAlpha = (int) $statsRow->y_alpha;
                $yTerlambat = (int) $statsRow->y_terlambat;
            }

            $adjRow = DB::table('attendance_adjustments')
                ->join('attendances', 'attendance_adjustments.attendance_id', '=', 'attendances.id')
                ->join('students', 'attendances.student_id', '=', 'students.id')
                ->whereBetween('attendances.date', [$yearStart, $yearEnd])
                ->where('students.is_active', true)
                ->where('students.is_alumni', false)
                ->when($selectedClassroomId, fn ($q) => $q->where('students.classroom_id', $selectedClassroomId))
                ->selectRaw("
                    COUNT(*) as y_adj,
                    COALESCE(SUM(CASE WHEN attendances.date BETWEEN ? AND ? THEN 1 ELSE 0 END), 0) as m_adj,
                    COALESCE(SUM(CASE WHEN attendances.date = ? THEN 1 ELSE 0 END), 0) as d_adj
                ", [$monthStart, $monthEnd, $date])
                ->first();

            if ($adjRow) {
                $dAdjustments = (int) $adjRow->d_adj;
                $mAdjustments = (int) $adjRow->m_adj;
                $yAdjustments = (int) $adjRow->y_adj;
            }
        }

        $dailyStats = [
            'period' => 'daily',
            'label' => 'Harian',
            'sublabel' => $dailyLabel,
            'total_students' => $totalStudents,
            'total_hadir' => $dHadir,
            'total_sakit' => $dSakit,
            'total_izin' => $dIzin,
            'total_alpha' => $dAlpha,
            'total_terlambat' => $dTerlambat,
            'total_adjustments' => $dAdjustments,
            'attendance_rate' => $totalStudents > 0 ? round(($dHadir / $totalStudents) * 100, 1) : 0,
            'total_records' => $dRecords,
        ];

        $monthlyStats = [
            'period' => 'monthly',
            'label' => 'Bulanan',
            'sublabel' => $monthlyLabel,
            'total_students' => $totalStudents,
            'total_hadir' => $mHadir,
            'total_sakit' => $mSakit,
            'total_izin' => $mIzin,
            'total_alpha' => $mAlpha,
            'total_terlambat' => $mTerlambat,
            'total_adjustments' => $mAdjustments,
            'attendance_rate' => $mRecords > 0 ? round(($mHadir / $mRecords) * 100, 1) : 0,
            'total_records' => $mRecords,
        ];

        $yearlyStats = [
            'period' => 'yearly',
            'label' => 'Tahunan',
            'sublabel' => $yearlyLabel,
            'total_students' => $totalStudents,
            'total_hadir' => $yHadir,
            'total_sakit' => $ySakit,
            'total_izin' => $yIzin,
            'total_alpha' => $yAlpha,
            'total_terlambat' => $yTerlambat,
            'total_adjustments' => $yAdjustments,
            'attendance_rate' => $yRecords > 0 ? round(($yHadir / $yRecords) * 100, 1) : 0,
            'total_records' => $yRecords,
        ];

        // 4. Top Students (Single grouped query for both Monthly & Yearly across all 4 categories)
        $topStudents = [
            'monthly' => ['terlambat' => [], 'sakit' => [], 'izin' => [], 'alpha' => []],
            'yearly' => ['terlambat' => [], 'sakit' => [], 'izin' => [], 'alpha' => []],
        ];

        if (! $hasNoAssignedClass) {
            $studentAggs = DB::table('attendances')
                ->join('students', 'attendances.student_id', '=', 'students.id')
                ->whereBetween('attendances.date', [$yearStart, $yearEnd])
                ->where('students.is_active', true)
                ->where('students.is_alumni', false)
                ->when($selectedClassroomId, fn ($q) => $q->where('students.classroom_id', $selectedClassroomId))
                ->where(function ($q) {
                    $q->where('attendances.is_late', true)
                        ->orWhereIn('attendances.status', ['sick', 'permit', 'absent']);
                })
                ->groupBy('attendances.student_id')
                ->selectRaw("
                    attendances.student_id,
                    SUM(CASE WHEN attendances.is_late = 1 THEN 1 ELSE 0 END) as y_terlambat,
                    SUM(CASE WHEN attendances.is_late = 1 THEN attendances.late_minutes ELSE 0 END) as y_minutes,
                    SUM(CASE WHEN attendances.status = 'sick' THEN 1 ELSE 0 END) as y_sakit,
                    SUM(CASE WHEN attendances.status = 'permit' THEN 1 ELSE 0 END) as y_izin,
                    SUM(CASE WHEN attendances.status = 'absent' THEN 1 ELSE 0 END) as y_alpha,

                    SUM(CASE WHEN attendances.date BETWEEN ? AND ? AND attendances.is_late = 1 THEN 1 ELSE 0 END) as m_terlambat,
                    SUM(CASE WHEN attendances.date BETWEEN ? AND ? AND attendances.is_late = 1 THEN attendances.late_minutes ELSE 0 END) as m_minutes,
                    SUM(CASE WHEN attendances.date BETWEEN ? AND ? AND attendances.status = 'sick' THEN 1 ELSE 0 END) as m_sakit,
                    SUM(CASE WHEN attendances.date BETWEEN ? AND ? AND attendances.status = 'permit' THEN 1 ELSE 0 END) as m_izin,
                    SUM(CASE WHEN attendances.date BETWEEN ? AND ? AND attendances.status = 'absent' THEN 1 ELSE 0 END) as m_alpha
                ", [
                    $monthStart, $monthEnd,
                    $monthStart, $monthEnd,
                    $monthStart, $monthEnd,
                    $monthStart, $monthEnd,
                    $monthStart, $monthEnd,
                ])
                ->get();

            if ($studentAggs->isNotEmpty()) {
                $pickTop5 = fn (string $col) => $studentAggs
                    ->where($col, '>', 0)
                    ->sortByDesc($col)
                    ->take(5)
                    ->values();

                $buckets = [
                    'm_terlambat' => $pickTop5('m_terlambat'),
                    'm_sakit' => $pickTop5('m_sakit'),
                    'm_izin' => $pickTop5('m_izin'),
                    'm_alpha' => $pickTop5('m_alpha'),
                    'y_terlambat' => $pickTop5('y_terlambat'),
                    'y_sakit' => $pickTop5('y_sakit'),
                    'y_izin' => $pickTop5('y_izin'),
                    'y_alpha' => $pickTop5('y_alpha'),
                ];

                $topStudentIds = collect($buckets)
                    ->flatten(1)
                    ->pluck('student_id')
                    ->unique()
                    ->values()
                    ->all();

                $studentsMap = ! empty($topStudentIds)
                    ? Student::whereIn('id', $topStudentIds)
                        ->select('id', 'name', 'nisn', 'nis', 'gender', 'classroom_id')
                        ->get()
                        ->keyBy('id')
                    : collect();

                $formatBucket = function ($rows, string $countCol, ?string $minCol = null) use ($studentsMap, $classroomsById) {
                    $result = [];
                    foreach ($rows as $row) {
                        $st = $studentsMap->get($row->student_id);
                        if (! $st) {
                            continue;
                        }
                        $result[] = [
                            'id' => $st->id,
                            'name' => $st->name,
                            'nisn' => $st->nisn,
                            'nis' => $st->nis,
                            'classroom_name' => $classroomsById->get($st->classroom_id)?->name ?? '-',
                            'gender' => $st->gender,
                            'count' => (int) $row->{$countCol},
                            'minutes' => $minCol ? (int) ($row->{$minCol} ?? 0) : 0,
                        ];
                    }

                    return $result;
                };

                $topStudents = [
                    'monthly' => [
                        'terlambat' => $formatBucket($buckets['m_terlambat'], 'm_terlambat', 'm_minutes'),
                        'sakit' => $formatBucket($buckets['m_sakit'], 'm_sakit'),
                        'izin' => $formatBucket($buckets['m_izin'], 'm_izin'),
                        'alpha' => $formatBucket($buckets['m_alpha'], 'm_alpha'),
                    ],
                    'yearly' => [
                        'terlambat' => $formatBucket($buckets['y_terlambat'], 'y_terlambat', 'y_minutes'),
                        'sakit' => $formatBucket($buckets['y_sakit'], 'y_sakit'),
                        'izin' => $formatBucket($buckets['y_izin'], 'y_izin'),
                        'alpha' => $formatBucket($buckets['y_alpha'], 'y_alpha'),
                    ],
                ];
            }
        }

        $isFutureDate = $date > $today;
        $holiday = AcademicHoliday::getOffDay($date);

        // Reuse $isOverallAuthorized & $classrooms already loaded above for Unmarked Classrooms
        $canViewUnmarkedClasses = $isOverallAuthorized;
        $unmarkedClassrooms = [];
        $totalClassroomsCount = 0;

        if ($canViewUnmarkedClasses) {
            $totalClassroomsCount = $classrooms->where('students_count', '>', 0)->count();

            $attendanceCounts = DB::table('attendances')
                ->join('students', 'attendances.student_id', '=', 'students.id')
                ->where('attendances.date', $date)
                ->where('students.is_active', true)
                ->where('students.is_alumni', false)
                ->selectRaw('students.classroom_id, COUNT(attendances.student_id) as attended_count')
                ->groupBy('students.classroom_id')
                ->pluck('attended_count', 'classroom_id');

            foreach ($classrooms as $cls) {
                $totalActive = (int) $cls->students_count;
                if ($totalActive === 0) {
                    continue;
                }
                $attended = (int) ($attendanceCounts[$cls->id] ?? 0);

                if ($attended < $totalActive) {
                    $unmarkedClassrooms[] = [
                        'id' => $cls->id,
                        'name' => $cls->name,
                        'academic_year' => $cls->academic_year,
                        'homeroom_teacher' => $cls->homeroomTeacher ? [
                            'id' => $cls->homeroomTeacher->id,
                            'name' => $cls->homeroomTeacher->name,
                            'nip' => $cls->homeroomTeacher->nip,
                        ] : null,
                        'total_students' => $totalActive,
                        'attended_students' => $attended,
                        'status' => $attended === 0 ? 'unmarked' : 'partial',
                    ];
                }
            }
        }

        return Inertia::render('dashboard', [
            'userRoleLabel' => $userRoleLabel,
            'classrooms' => $classrooms,
            'selectedClassroomId' => $selectedClassroomId,
            'isOverallAuthorized' => $isOverallAuthorized,
            'hasNoAssignedClass' => $hasNoAssignedClass,
            'selectedDate' => $date,
            'isFutureDate' => $isFutureDate,
            'canViewUnmarkedClasses' => $canViewUnmarkedClasses,
            'unmarkedClassrooms' => $unmarkedClassrooms,
            'totalClassroomsCount' => $totalClassroomsCount,
            'holiday' => $holiday ? [
                'name' => $holiday->name,
                'type' => $holiday->type,
                'type_name' => $holiday->type_name,
                'description' => $holiday->description,
            ] : null,
            'stats' => $dailyStats,
            'recap' => [
                'daily' => $dailyStats,
                'monthly' => $monthlyStats,
                'yearly' => $yearlyStats,
            ],
            'top_students' => $topStudents,
            'students' => [],
        ]);
    }
}
