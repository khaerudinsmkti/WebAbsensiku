<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceAdjustment;
use App\Models\Classroom;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceAdjustmentController extends Controller
{
    public function index(Request $request): Response
    {
        $today = Carbon::today()->toDateString();
        $date = $request->input('date', $today);
        $user = $request->user();

        // Fetch adjustments for the date
        $adjustmentsQuery = AttendanceAdjustment::whereHas('attendance', function ($q) use ($date) {
            $q->where('date', $date);
        })
        ->with(['attendance.student.classroom', 'approvedBy'])
        ->latest();

        if ($user->role === 'teacher' && ! $user->isDutyTeacherToday()) {
            $adjustmentsQuery->whereHas('attendance.student.classroom', function ($q) use ($user) {
                $q->where('homeroom_teacher_id', $user->id);
            });
        }

        $adjustments = $adjustmentsQuery->get()
            ->map(function ($adj) use ($user) {
                $studentClassroom = $adj->attendance?->student?->classroom;
                $canManage = $user->isAdmin()
                    || $user->isPrincipal()
                    || $user->isDutyTeacherToday()
                    || ($studentClassroom && $studentClassroom->homeroom_teacher_id === $user->id)
                    || $adj->approved_by === $user->id;

                return [
                    'id' => $adj->id,
                    'attendance_id' => $adj->attendance_id,
                    'student_id' => $adj->attendance?->student_id,
                    'student_name' => $adj->attendance?->student?->name ?? 'Siswa',
                    'nisn' => $adj->attendance?->student?->nisn ?? '-',
                    'classroom' => $adj->attendance?->student?->classroom?->name ?? '-',
                    'type' => $adj->type,
                    'type_name' => $adj->type_name,
                    'departure_time' => substr($adj->departure_time, 0, 5),
                    'reason' => $adj->reason,
                    'pickup_person' => $adj->pickup_person,
                    'attachment_url' => $adj->attachment_path ? asset('storage/' . $adj->attachment_path) : null,
                    'has_attachment' => ! empty($adj->attachment_path),
                    'approved_by' => $adj->approvedBy?->name ?? 'Sistem',
                    'created_at' => $adj->created_at->format('H:i'),
                    'can_manage' => $canManage,
                ];
            });

        // Students who are present today and can request mid-day leave
        $eligibleStudentsQuery = Attendance::where('date', $date)
            ->where('status', 'present')
            ->with('student.classroom');

        if ($user->role === 'teacher' && ! $user->isDutyTeacherToday()) {
            $eligibleStudentsQuery->whereHas('student.classroom', function ($q) use ($user) {
                $q->where('homeroom_teacher_id', $user->id);
            });
        }

        $eligibleStudents = $eligibleStudentsQuery->get()
            ->map(function ($att) {
                return [
                    'attendance_id' => $att->id,
                    'student_id' => $att->student_id,
                    'name' => $att->student->name,
                    'nisn' => $att->student->nisn,
                    'classroom_id' => $att->student->classroom_id,
                    'classroom' => $att->student->classroom->name,
                ];
            });

        // Classrooms list for filter
        $classroomsQuery = Classroom::orderBy('name');
        if ($user->role === 'teacher' && ! $user->isDutyTeacherToday()) {
            $classroomsQuery->where('homeroom_teacher_id', $user->id);
        }
        $classrooms = $classroomsQuery->get(['id', 'name']);

        $isFutureDate = $date > $today;
        $holiday = \App\Models\AcademicHoliday::getOffDay($date);

        return Inertia::render('attendances/adjustments', [
            'selectedDate' => $date,
            'isFutureDate' => $isFutureDate,
            'holiday' => $holiday ? [
                'name' => $holiday->name,
                'type' => $holiday->type,
                'type_name' => $holiday->type_name,
                'description' => $holiday->description,
            ] : null,
            'adjustments' => $adjustments,
            'eligibleStudents' => $eligibleStudents,
            'classrooms' => $classrooms,
            'defaultDepartureTime' => now()->format('H:i'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'attendance_id' => 'required|exists:attendances,id',
            'type' => 'required|in:early_leave_sick,early_leave_urgent,other',
            'departure_time' => 'required',
            'reason' => 'required|string|max:500',
            'pickup_person' => 'nullable|string|max:150',
            'proof' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:2048',
        ]);

        $attendance = Attendance::findOrFail($validated['attendance_id']);

        $today = Carbon::today()->toDateString();
        $attendanceDate = Carbon::parse($attendance->date)->toDateString();
        if ($attendanceDate > $today) {
            return back()->with('error', 'Tidak dapat menginput absen khusus untuk tanggal di masa mendatang (tanggal tidak boleh melebihi hari ini).');
        }

        $offDay = \App\Models\AcademicHoliday::getOffDay($attendanceDate);
        if ($offDay) {
            return back()->with('error', "Tanggal {$attendanceDate} adalah hari libur ({$offDay->name}). Absen khusus tidak dapat diinput.");
        }

        if ($request->user()->role === 'teacher' && ! $request->user()->isDutyTeacherToday()) {
            $isAuthorized = Attendance::where('id', $validated['attendance_id'])
                ->whereHas('student.classroom', function ($q) use ($request) {
                    $q->where('homeroom_teacher_id', $request->user()->id);
                })
                ->exists();

            if (! $isAuthorized) {
                abort(403, 'Anda tidak berwenang menginput izin pulang awal untuk siswa di luar kelas yang Anda ampu.');
            }
        }

        DB::transaction(function () use ($validated, $request, $attendance) {
            $path = null;
            if ($request->hasFile('proof')) {
                $path = $request->file('proof')->store('adjustments', 'public');
            }

            AttendanceAdjustment::create([
                'attendance_id' => $attendance->id,
                'approved_by' => $request->user()->id,
                'type' => $validated['type'],
                'departure_time' => substr($validated['departure_time'], 0, 5) . ':00',
                'reason' => $validated['reason'],
                'pickup_person' => $validated['pickup_person'] ?? null,
                'attachment_path' => $path,
            ]);

            $typeLabel = match ($validated['type']) {
                'early_leave_sick' => 'Sakit di Sekolah',
                'early_leave_urgent' => 'Izin Pulang Cepat',
                default => 'Absen Khusus',
            };

            $additionalNote = " | Pulang Awal ({$typeLabel}) pkl {$validated['departure_time']}: {$validated['reason']}";
            $attendance->update([
                'notes' => trim(($attendance->notes ?? '') . $additionalNote),
            ]);
        });

        return back()->with('success', 'Izin khusus pulang awal berhasil dicatat dan diverifikasi.');
    }

    /**
     * Update existing attendance adjustment.
     */
    public function update(Request $request, AttendanceAdjustment $adjustment): RedirectResponse
    {
        $this->authorizeAdjustmentAction($request, $adjustment);

        $validated = $request->validate([
            'type' => 'required|in:early_leave_sick,early_leave_urgent,other',
            'departure_time' => 'required',
            'reason' => 'required|string|max:500',
            'pickup_person' => 'nullable|string|max:150',
            'proof' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:2048',
            'delete_proof' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($validated, $request, $adjustment) {
            $attendance = $adjustment->attendance;

            if ($request->hasFile('proof')) {
                if ($adjustment->attachment_path && Storage::disk('public')->exists($adjustment->attachment_path)) {
                    Storage::disk('public')->delete($adjustment->attachment_path);
                }
                $adjustment->attachment_path = $request->file('proof')->store('adjustments', 'public');
            } elseif ($request->boolean('delete_proof')) {
                if ($adjustment->attachment_path && Storage::disk('public')->exists($adjustment->attachment_path)) {
                    Storage::disk('public')->delete($adjustment->attachment_path);
                }
                $adjustment->attachment_path = null;
            }

            $departureTime = substr($validated['departure_time'], 0, 5) . ':00';
            $adjustment->type = $validated['type'];
            $adjustment->departure_time = $departureTime;
            $adjustment->reason = $validated['reason'];
            $adjustment->pickup_person = $validated['pickup_person'] ?? null;
            $adjustment->save();

            if ($attendance) {
                $cleanedNotes = preg_replace('/(\s*\|\s*)?Pulang Awal \([^)]+\) pkl [^|]+/u', '', $attendance->notes ?? '');
                $typeLabel = match ($validated['type']) {
                    'early_leave_sick' => 'Sakit di Sekolah',
                    'early_leave_urgent' => 'Izin Pulang Cepat',
                    default => 'Absen Khusus',
                };
                $timeFormatted = substr($validated['departure_time'], 0, 5);
                $additionalNote = " | Pulang Awal ({$typeLabel}) pkl {$timeFormatted}: {$validated['reason']}";
                $baseNotes = trim($cleanedNotes ?? '');
                $attendance->update([
                    'notes' => $baseNotes !== '' ? "{$baseNotes}{$additionalNote}" : trim($additionalNote, " |"),
                ]);
            }
        });

        $studentName = $adjustment->fresh()->attendance?->student?->name ?? 'Siswa';
        return back()->with('success', "Data absen khusus {$studentName} berhasil diperbarui.");
    }

    /**
     * Delete attendance adjustment.
     */
    public function destroy(Request $request, AttendanceAdjustment $adjustment): RedirectResponse
    {
        $this->authorizeAdjustmentAction($request, $adjustment);

        $studentName = $adjustment->attendance?->student?->name ?? 'Siswa';

        DB::transaction(function () use ($adjustment) {
            $attendance = $adjustment->attendance;
            if ($attendance) {
                $cleanedNotes = preg_replace('/(\s*\|\s*)?Pulang Awal \([^)]+\) pkl [^|]+/u', '', $attendance->notes ?? '');
                $attendance->update([
                    'notes' => trim($cleanedNotes ?? '') ?: null,
                ]);
            }

            if ($adjustment->attachment_path && Storage::disk('public')->exists($adjustment->attachment_path)) {
                Storage::disk('public')->delete($adjustment->attachment_path);
            }

            $adjustment->delete();
        });

        return back()->with('success', "Data absen khusus {$studentName} berhasil dihapus.");
    }

    /**
     * Authorize user action for a specific adjustment record.
     */
    protected function authorizeAdjustmentAction(Request $request, AttendanceAdjustment $adjustment): void
    {
        $user = $request->user();
        if (! $user) {
            abort(401, 'Silakan login terlebih dahulu.');
        }

        if ($user->isAdmin() || $user->isPrincipal() || $user->isDutyTeacherToday()) {
            return;
        }

        if ($user->role === 'teacher') {
            $studentClassroom = $adjustment->attendance?->student?->classroom;
            $isHomeroom = $studentClassroom && $studentClassroom->homeroom_teacher_id === $user->id;
            $isCreator = $adjustment->approved_by === $user->id;

            if ($isHomeroom || $isCreator) {
                return;
            }
        }

        abort(403, 'Anda tidak berwenang mengelola data izin pulang awal ini.');
    }
}

