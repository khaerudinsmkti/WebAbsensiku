<?php

namespace App\Http\Controllers;

use App\Models\SchoolSetting;
use App\Services\PwaManifestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PwaNotificationSettingController extends Controller
{
    /**
     * Display the PWA notification settings page.
     */
    public function edit(): Response
    {
        $setting = SchoolSetting::getSetting();

        $pwaConfig = [
            'pwa_reminder_enabled' => (bool) ($setting->pwa_reminder_enabled ?? true),
            'pwa_reminder_interval_minutes' => (int) ($setting->pwa_reminder_interval_minutes ?? 60),
            'pwa_reminder_start_time' => substr($setting->pwa_reminder_start_time ?? '07:00', 0, 5),
            'pwa_reminder_end_time' => substr($setting->pwa_reminder_end_time ?? '14:00', 0, 5),
            'pwa_reminder_title' => $setting->pwa_reminder_title ?? 'Pengingat Presensi Siswa ⏰',
            'pwa_reminder_message' => $setting->pwa_reminder_message ?? 'Presensi kelas hari ini belum selesai diinput. Mohon segera mengisi absensi siswa.',
            'pwa_notify_news' => (bool) ($setting->pwa_notify_news ?? true),
            'pwa_sound_enabled' => (bool) ($setting->pwa_sound_enabled ?? true),
            'school_name' => $setting->name,
            'logo_url' => $setting->logo_url,
        ];

        return Inertia::render('admin/pwa-notifications', [
            'config' => $pwaConfig,
        ]);
    }

    /**
     * Update the PWA notification settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'pwa_reminder_enabled' => 'required|boolean',
            'pwa_reminder_interval_minutes' => 'required|integer|in:15,30,45,60,90,120,180',
            'pwa_reminder_start_time' => 'required|string|max:5',
            'pwa_reminder_end_time' => 'required|string|max:5',
            'pwa_reminder_title' => 'required|string|max:150',
            'pwa_reminder_message' => 'nullable|string|max:500',
            'pwa_notify_news' => 'required|boolean',
            'pwa_sound_enabled' => 'required|boolean',
        ], [
            'pwa_reminder_title.required' => 'Judul pengingat presensi wajib diisi.',
            'pwa_reminder_interval_minutes.in' => 'Pilihan interval pengingat tidak valid.',
            'pwa_reminder_start_time.required' => 'Jam mulai pengingat wajib diisi.',
            'pwa_reminder_end_time.required' => 'Jam selesai pengingat wajib diisi.',
        ]);

        $setting = SchoolSetting::getSetting();

        $setting->update([
            'pwa_reminder_enabled' => $validated['pwa_reminder_enabled'],
            'pwa_reminder_interval_minutes' => $validated['pwa_reminder_interval_minutes'],
            'pwa_reminder_start_time' => substr($validated['pwa_reminder_start_time'], 0, 5),
            'pwa_reminder_end_time' => substr($validated['pwa_reminder_end_time'], 0, 5),
            'pwa_reminder_title' => $validated['pwa_reminder_title'],
            'pwa_reminder_message' => $validated['pwa_reminder_message'] ?? null,
            'pwa_notify_news' => $validated['pwa_notify_news'],
            'pwa_sound_enabled' => $validated['pwa_sound_enabled'],
        ]);

        PwaManifestService::syncManifest();

        return back()->with('success', 'Pengaturan notifikasi PWA dan pengingat presensi berhasil diperbarui!');
    }
}
