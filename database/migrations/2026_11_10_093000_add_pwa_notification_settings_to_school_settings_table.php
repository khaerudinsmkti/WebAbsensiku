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
        Schema::table('school_settings', function (Blueprint $table) {
            $table->boolean('pwa_reminder_enabled')->default(true)->after('theme_color');
            $table->unsignedSmallInteger('pwa_reminder_interval_minutes')->default(60)->after('pwa_reminder_enabled');
            $table->string('pwa_reminder_start_time', 5)->default('07:00')->after('pwa_reminder_interval_minutes');
            $table->string('pwa_reminder_end_time', 5)->default('14:00')->after('pwa_reminder_start_time');
            $table->string('pwa_reminder_title', 150)->default('Pengingat Presensi Siswa ⏰')->after('pwa_reminder_end_time');
            $table->text('pwa_reminder_message')->nullable()->after('pwa_reminder_title');
            $table->boolean('pwa_notify_news')->default(true)->after('pwa_reminder_message');
            $table->boolean('pwa_sound_enabled')->default(true)->after('pwa_notify_news');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            $table->dropColumn([
                'pwa_reminder_enabled',
                'pwa_reminder_interval_minutes',
                'pwa_reminder_start_time',
                'pwa_reminder_end_time',
                'pwa_reminder_title',
                'pwa_reminder_message',
                'pwa_notify_news',
                'pwa_sound_enabled',
            ]);
        });
    }
};
