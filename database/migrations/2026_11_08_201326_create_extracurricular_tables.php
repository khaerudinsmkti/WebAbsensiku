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
        // Drop first in case of partial creation in prior attempt
        Schema::dropIfExists('extracurricular_report_attendees');
        Schema::dropIfExists('extracurricular_reports');
        Schema::dropIfExists('extracurricular_members');

        // 1. Daftar Anggota Siswa Default yang Dikelola oleh Pelatih
        Schema::create('extracurricular_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coach_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('extracurricular_name', 100)->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->unique(['coach_id', 'student_id']);
            $table->index(['coach_id']);
        });

        // 2. Laporan Sesi Kegiatan Ekskul
        Schema::create('extracurricular_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coach_id')->constrained('users')->onDelete('cascade');
            $table->string('extracurricular_name', 100);
            $table->string('session_type', 80); // 'Latihan terjadwal (sesuai ketetapan Sudin)' atau 'Latihan tambahan'
            $table->date('date');
            $table->string('start_time', 10);
            $table->string('end_time', 10);
            $table->string('location', 150)->default('Halaman sekolah');
            $table->text('activity_material');
            $table->text('student_progress');
            $table->text('obstacles_and_followup');
            $table->string('photo_path', 255)->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            $table->timestamps();

            $table->index(['coach_id', 'date']);
            $table->index(['status']);
        });

        // 3. Daftar Kehadiran Siswa pada Tiap Laporan Sesi
        Schema::create('extracurricular_report_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('extracurricular_report_id')
                ->constrained('extracurricular_reports', 'id', 'ekskul_att_rep_fk')
                ->onDelete('cascade');
            $table->foreignId('student_id')
                ->constrained('students', 'id', 'ekskul_att_stu_fk')
                ->onDelete('cascade');
            $table->boolean('is_present')->default(true);
            $table->string('notes', 100)->nullable();
            $table->timestamps();

            $table->unique(['extracurricular_report_id', 'student_id'], 'ekskul_att_unique');
            $table->index(['extracurricular_report_id'], 'ekskul_att_rep_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('extracurricular_report_attendees');
        Schema::dropIfExists('extracurricular_reports');
        Schema::dropIfExists('extracurricular_members');
    }
};
