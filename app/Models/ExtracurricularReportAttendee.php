<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExtracurricularReportAttendee extends Model
{
    use HasFactory;

    protected $fillable = [
        'extracurricular_report_id',
        'student_id',
        'is_present',
        'notes',
    ];

    protected $casts = [
        'is_present' => 'boolean',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(ExtracurricularReport::class, 'extracurricular_report_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
