<?php

namespace App\Console\Commands;

use App\Models\AcademicHoliday;
use App\Models\SchoolSetting;
use App\Models\User;
use App\Services\WebPushService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendAttendanceRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:send-reminders {--force : Abaikan pengecekan jam operasional dan hari libur}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim notifikasi Web Push VAPID ke guru yang belum melakukan absensi harian kelasnya.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $setting = SchoolSetting::getSetting();
        $isForced = (bool) $this->option('force');

        // 1. Cek apakah fitur pengingat PWA diaktifkan
        if (! $setting->pwa_reminder_enabled && ! $isForced) {
            $this->info('Fitur pengingat presensi PWA sedang dinonaktifkan di Pengaturan Sekolah.');
            return self::SUCCESS;
        }

        $now = Carbon::now();
        $today = $now->toDateString();

        // 2. Cek hari libur sekolah (Kecuali jika --force)
        if (! $isForced) {
            $holiday = AcademicHoliday::getOffDay($today);
            if ($holiday) {
                $this->info("Hari ini adalah hari libur sekolah: {$holiday->name}. Pengingat presensi tidak dikirimkan.");
                return self::SUCCESS;
            }
        }

        // 3. Cek rentang jam operasional pengingat (Kecuali jika --force)
        if (! $isForced) {
            $startTime = substr($setting->pwa_reminder_start_time ?? '07:00', 0, 5);
            $endTime = substr($setting->pwa_reminder_end_time ?? '14:00', 0, 5);

            $currentHm = $now->format('H:i');
            if ($currentHm < $startTime || $currentHm > $endTime) {
                $this->info("Saat ini ({$currentHm}) di luar jam operasional pengingat ({$startTime} s.d {$endTime}).");
                return self::SUCCESS;
            }
        }

        // 4. Ambil semua guru aktif
        $teachers = User::where('role', 'teacher')->get();

        if ($teachers->isEmpty()) {
            $this->info('Tidak ada pengguna dengan peran guru yang terdaftar.');
            return self::SUCCESS;
        }

        $this->info("Memeriksa status absensi untuk {$teachers->count()} guru...");

        $notifiedCount = 0;
        $title = $setting->pwa_reminder_title ?: 'Pengingat Presensi Siswa ⏰';
        $customMessage = $setting->pwa_reminder_message;

        foreach ($teachers as $teacher) {
            $status = $teacher->getPendingAttendanceStatus($today);

            if (! $status || empty($status['needs_attendance']) || empty($status['pending_classes'])) {
                continue;
            }

            $pendingClasses = $status['pending_classes'];
            $classNames = implode(', ', array_column($pendingClasses, 'name'));

            $body = $customMessage
                ? "{$customMessage} (Kelas: {$classNames})"
                : "Halo Bpk/Ibu {$teacher->name}, presensi siswa untuk kelas {$classNames} hari ini belum diisi. Harap segera melakukan absensi.";

            $payload = [
                'title' => $title,
                'body' => $body,
                'icon' => $setting->logo_url ?: '/icons/icon-192x192.png',
                'badge' => '/icons/icon-192x192.png',
                'url' => route('attendances.index'),
                'tag' => 'attendance-reminder-' . $today,
                'timestamp' => now()->timestamp * 1000,
            ];

            $result = WebPushService::sendToUser($teacher, $payload);

            if (! empty($result['success']) && $result['sent_count'] > 0) {
                $notifiedCount += $result['sent_count'];
                $this->line("  ✓ Notifikasi terkirim ke {$teacher->name} ({$result['sent_count']} perangkat) - Kelas: {$classNames}");
            } else {
                $this->line("  - {$teacher->name} belum mengisi {$classNames}, namun belum mendaftarkan izin notifikasi di perangkatnya.");
            }
        }

        $this->info("Selesai. Total {$notifiedCount} notifikasi push berhasil dikirimkan ke perangkat guru.");

        return self::SUCCESS;
    }
}
