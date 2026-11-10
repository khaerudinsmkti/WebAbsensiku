<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Pengingat Presensi Otomatis ke Ponsel Guru via VAPID Web Push
Schedule::command('attendance:send-reminders')
    ->hourly()
    ->between('06:30', '16:00')
    ->withoutOverlapping()
    ->runInBackground();

