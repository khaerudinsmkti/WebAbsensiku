<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExtracurricularReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'coach_id',
        'extracurricular_name',
        'session_type',
        'date',
        'start_time',
        'end_time',
        'location',
        'activity_material',
        'student_progress',
        'obstacles_and_followup',
        'photo_path',
        'photos',
        'status',
        'approved_by',
        'approved_at',
        'approval_notes',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'photos' => 'array',
        'approved_at' => 'datetime',
    ];

    protected $appends = [
        'photo_url',
        'photo_urls',
        'status_label',
    ];

    public function getPhotoUrlAttribute(): ?string
    {
        if (is_array($this->photos) && count($this->photos) > 0) {
            return '/storage/' . ltrim($this->photos[0], '/');
        }

        if (! $this->photo_path) {
            return null;
        }

        return '/storage/' . ltrim($this->photo_path, '/');
    }

    /**
     * Get all photo URLs for this report.
     *
     * @return array<int, string>
     */
    public function getPhotoUrlsAttribute(): array
    {
        $urls = [];
        if (is_array($this->photos) && count($this->photos) > 0) {
            foreach ($this->photos as $path) {
                if ($path) {
                    $urls[] = '/storage/' . ltrim($path, '/');
                }
            }
        } elseif ($this->photo_path) {
            $urls[] = '/storage/' . ltrim($this->photo_path, '/');
        }

        return $urls;
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'approved' => 'Disetujui',
            'rejected' => 'Perlu Revisi',
            default => 'Menunggu Persetujuan',
        };
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function attendees(): HasMany
    {
        return $this->hasMany(ExtracurricularReportAttendee::class, 'extracurricular_report_id');
    }

    public function presentAttendees(): HasMany
    {
        return $this->hasMany(ExtracurricularReportAttendee::class, 'extracurricular_report_id')->where('is_present', true);
    }
}
