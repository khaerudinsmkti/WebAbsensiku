<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string|null $nip
 * @property string|null $username
 * @property string $email
 * @property string $role
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'nip', 'username', 'email', 'password', 'role', 'email_verified_at'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isPrincipal(): bool
    {
        return $this->role === 'principal';
    }

    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isPublisher(): bool
    {
        return $this->role === 'publisher';
    }

    public function isCoach(): bool
    {
        return $this->role === 'coach';
    }

    public function extracurricularReports(): HasMany
    {
        return $this->hasMany(ExtracurricularReport::class, 'coach_id');
    }

    public function extracurricularMembers(): HasMany
    {
        return $this->hasMany(ExtracurricularMember::class, 'coach_id');
    }

    public function hasPermission(string $module, string $action = 'view'): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return \App\Services\PermissionService::hasPermission($this->role, $module, $action);
    }

    public function canManageNews(): bool
    {
        return $this->role === 'admin' || $this->role === 'publisher';
    }

    public function news(): HasMany
    {
        return $this->hasMany(News::class, 'user_id');
    }

    public function homeroomClassrooms(): HasMany
    {
        return $this->hasMany(Classroom::class, 'homeroom_teacher_id');
    }

    public function dutySchedules(): HasMany
    {
        return $this->hasMany(DutySchedule::class, 'teacher_id');
    }

    public function recordedAttendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'recorded_by');
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class, 'user_id');
    }

    protected array $dutyTeacherCache = [];

    /**
     * Check if user is duty teacher today (or on a given date).
     * Admin always has duty authority.
     */
    public function isDutyTeacherToday(Carbon|string|null $date = null): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $carbonDate = $date ? Carbon::parse($date) : now();
        $dayOfWeek = $carbonDate->dayOfWeekIso; // 1 = Senin, ..., 7 = Minggu

        if (array_key_exists($dayOfWeek, $this->dutyTeacherCache)) {
            return $this->dutyTeacherCache[$dayOfWeek];
        }

        return $this->dutyTeacherCache[$dayOfWeek] = $this->dutySchedules()
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Get pending attendance status for today.
     * Evaluates whether this teacher has classes that haven't been marked today.
     */
    public function getPendingAttendanceStatus(): ?array
    {
        // Pengingat khusus untuk peran guru (teacher)
        if ($this->role !== 'teacher') {
            return null;
        }

        $today = Carbon::today()->toDateString();

        // 1. Cek apakah hari ini adalah hari libur sekolah / akhir pekan libur
        $offDay = AcademicHoliday::getOffDay($today);
        if ($offDay) {
            return [
                'needs_attendance' => false,
                'is_holiday' => true,
                'holiday_name' => $offDay->name,
                'pending_classes' => [],
                'date' => $today,
                'formatted_date' => now()->translatedFormat('l, d F Y'),
            ];
        }

        // 2. Ambil kelas yang menjadi tanggung jawab guru ini
        $pendingClasses = [];

        // Kelas wali (homeroom)
        $homeroomClasses = $this->homeroomClassrooms()
            ->withCount(['students' => fn ($q) => $q->where('is_active', true)])
            ->get();

        foreach ($homeroomClasses as $classroom) {
            if ($classroom->students_count === 0) {
                continue;
            }

            // Hitung siswa yang sudah memiliki data absensi hari ini
            $recordedCount = Attendance::where('date', $today)
                ->whereIn('student_id', function ($query) use ($classroom) {
                    $query->select('id')
                        ->from('students')
                        ->where('classroom_id', $classroom->id)
                        ->where('is_active', true);
                })
                ->count();

            // Jika jumlah absensi tercatat kurang dari total siswa aktif, berarti belum selesai/belum diabsen
            if ($recordedCount < $classroom->students_count) {
                $pendingClasses[] = [
                    'id' => $classroom->id,
                    'name' => $classroom->name,
                    'academic_year' => $classroom->academic_year,
                    'students_count' => $classroom->students_count,
                    'recorded_count' => $recordedCount,
                    'is_homeroom' => true,
                ];
            }
        }

        // Jika guru ini piket hari ini dan tidak punya kelas wali, cek kelas di sekolah yang belum diabsen
        if (empty($pendingClasses) && $this->isDutyTeacherToday($today) && $homeroomClasses->isEmpty()) {
            $allClasses = Classroom::withCount(['students' => fn ($q) => $q->where('is_active', true)])
                ->orderBy('name')
                ->get();

            foreach ($allClasses as $classroom) {
                if ($classroom->students_count === 0) {
                    continue;
                }

                $recordedCount = Attendance::where('date', $today)
                    ->whereIn('student_id', function ($query) use ($classroom) {
                        $query->select('id')
                            ->from('students')
                            ->where('classroom_id', $classroom->id)
                            ->where('is_active', true);
                    })
                    ->count();

                if ($recordedCount < $classroom->students_count) {
                    $pendingClasses[] = [
                        'id' => $classroom->id,
                        'name' => $classroom->name,
                        'academic_year' => $classroom->academic_year,
                        'students_count' => $classroom->students_count,
                        'recorded_count' => $recordedCount,
                        'is_homeroom' => false,
                    ];
                }
            }
        }

        return [
            'needs_attendance' => !empty($pendingClasses),
            'is_holiday' => false,
            'holiday_name' => null,
            'pending_classes' => $pendingClasses,
            'date' => $today,
            'formatted_date' => now()->translatedFormat('l, d F Y'),
        ];
    }
}
