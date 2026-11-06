<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->index(['date', 'status', 'is_late'], 'idx_attendances_date_status_late');
            $table->index(['date', 'student_id'], 'idx_attendances_date_student');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->index(['classroom_id', 'is_active', 'is_alumni'], 'idx_students_classroom_active_alumni');
            $table->index(['is_active', 'is_alumni'], 'idx_students_active_alumni');
        });

        Schema::table('duty_schedules', function (Blueprint $table) {
            $table->index(['teacher_id', 'day_of_week', 'is_active'], 'idx_duty_teacher_day_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex('idx_attendances_date_status_late');
            $table->dropIndex('idx_attendances_date_student');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex('idx_students_classroom_active_alumni');
            $table->dropIndex('idx_students_active_alumni');
        });

        Schema::table('duty_schedules', function (Blueprint $table) {
            $table->dropIndex('idx_duty_teacher_day_active');
        });
    }
};

