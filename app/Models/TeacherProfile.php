<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class TeacherProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'subject',
        'homeroom_class',
        'employment_status',
        'photo_path',
        'file_size',
        'sort_order',
        'is_active',
    ];

    protected $appends = [
        'photo_url',
        'formatted_size',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Ensure table exists and auto-sync initial teacher records from users if empty.
     */
    public static function ensureTableExists(): void
    {
        try {
            if (! Schema::hasTable('teacher_profiles')) {
                Schema::create('teacher_profiles', function (Blueprint $table) {
                    $table->id();
                    $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                    $table->string('name');
                    $table->string('subject')->nullable();
                    $table->string('homeroom_class')->nullable();
                    $table->string('employment_status')->default('PNS');
                    $table->string('photo_path')->nullable();
                    $table->unsignedBigInteger('file_size')->default(0);
                    $table->integer('sort_order')->default(0);
                    $table->boolean('is_active')->default(true);
                    $table->timestamps();
                });

                self::syncFromUsersIfEmpty();
            }
        } catch (\Throwable $e) {
            // Ignore when DB is offline during CLI build
        }
    }

    public static function syncFromUsersIfEmpty(): void
    {
        if (self::count() > 0) {
            return;
        }

        $teachers = User::with('homeroomClassrooms')
            ->whereIn('role', ['principal', 'teacher'])
            ->orderByRaw("CASE WHEN role = 'principal' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get();

        foreach ($teachers as $idx => $user) {
            $homeroomNames = $user->homeroomClassrooms->pluck('name')->implode(', ');
            self::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'subject' => $user->role === 'principal'
                    ? 'Kepala Sekolah'
                    : ($homeroomNames ? 'Guru Kelas' : 'Guru Mata Pelajaran'),
                'homeroom_class' => $homeroomNames ?: null,
                'employment_status' => 'PNS',
                'sort_order' => $idx + 1,
                'is_active' => true,
            ]);
        }
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if ($this->photo_path) {
            return asset('storage/' . $this->photo_path);
        }

        return null;
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = (int) ($this->file_size ?? 0);
        if ($bytes <= 0) {
            return '0 KB';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 1) . ' ' . $units[$i];
    }
}

