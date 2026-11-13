<?php

use App\Http\Controllers\AttendanceAdjustmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\LatenessController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\PrincipalJournalController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SchoolProfileController;
use App\Http\Controllers\SchoolSettingController;
use App\Http\Controllers\TeacherProfileController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [WelcomeController::class, 'index'])->name('home');
Route::get('/profil', [WelcomeController::class, 'profile'])->name('public.profile');
Route::get('/profil/guru', [WelcomeController::class, 'teacherProfiles'])->name('public.profile.teachers');
Route::get('/berita', [WelcomeController::class, 'news'])->name('public.news');
Route::post('/berita/{news}/view', [WelcomeController::class, 'incrementNewsView'])->name('public.news.view');
Route::get('/galeri', [WelcomeController::class, 'gallery'])->name('public.gallery');
Route::get('/kalender', [WelcomeController::class, 'calendar'])->name('public.calendar');
Route::get('/kontak', [WelcomeController::class, 'contact'])->name('public.contact');
Route::post('/kontak/kirim', [ContactController::class, 'publicStore'])->name('contact.public.store');

// Verifikasi Publik Keabsahan Dokumen Laporan Ekskul (Scan Barcode / QR Code Terenkripsi)
Route::get('/verify/extracurricular/{identifier}', [\App\Http\Controllers\ExtracurricularController::class, 'verify'])->name('extracurricular.verify');
Route::get('/verify/extracurricular/{identifier}/pdf', [\App\Http\Controllers\ExtracurricularController::class, 'exportPdf'])->name('extracurricular.public.pdf');
Route::get('/extracurricular/reports/{identifier}/verify', [\App\Http\Controllers\ExtracurricularController::class, 'verify']);

Route::redirect('/register', '/login');
Route::redirect('/registeruser', '/login');

Route::get('/manifest.json', function () {
    $manifestData = \App\Services\PwaManifestService::getManifestData();

    return response()->json($manifestData, 200, [
        'Content-Type' => 'application/manifest+json; charset=UTF-8',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
        'Pragma' => 'no-cache',
        'Expires' => '0',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
})->name('pwa.manifest');

Route::middleware(['auth', 'verified'])->group(function () {
    // 1. Dashboard Eksekutif & Ringkasan Realtime
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Web Push Notifications (VAPID)
    Route::get('/webpush/key', [\App\Http\Controllers\WebPushSubscriptionController::class, 'key'])->name('webpush.key');
    Route::post('/webpush/subscribe', [\App\Http\Controllers\WebPushSubscriptionController::class, 'subscribe'])->name('webpush.subscribe');
    Route::post('/webpush/unsubscribe', [\App\Http\Controllers\WebPushSubscriptionController::class, 'unsubscribe'])->name('webpush.unsubscribe');
    Route::post('/webpush/test', [\App\Http\Controllers\WebPushSubscriptionController::class, 'testNotification'])->name('webpush.test');

    // Jurnal Kepala Sekolah (Hanya untuk Role Kepala Sekolah)
    Route::middleware('role:principal')->group(function () {
        Route::get('/principal/journals', [PrincipalJournalController::class, 'index'])->name('principal.journals.index');
        Route::post('/principal/journals', [PrincipalJournalController::class, 'store'])->name('principal.journals.store');
        Route::post('/principal/journals/{principalJournal}', [PrincipalJournalController::class, 'update'])->name('principal.journals.update');
        Route::delete('/principal/journals/{principalJournal}', [PrincipalJournalController::class, 'destroy'])->name('principal.journals.destroy');
        Route::get('/principal/journals/export/excel', [PrincipalJournalController::class, 'exportExcel'])->name('principal.journals.export-excel');
        Route::get('/principal/journals/export/pdf', [PrincipalJournalController::class, 'exportPdf'])->name('principal.journals.export-pdf');
    });

    // Modul Presensi & Rekapitulasi (Admin, Kepala Sekolah, Guru Pengajar)
    Route::middleware('role:teacher,principal')->group(function () {
        // 2. Presensi Harian (Batch & Quick Update)
        Route::get('/attendances', [AttendanceController::class, 'index'])->name('attendances.index');
        Route::post('/attendances/batch', [AttendanceController::class, 'storeBatch'])->name('attendances.batch');
        Route::patch('/attendances/student/{student}', [AttendanceController::class, 'quickUpdate'])->name('attendances.quick-update');

        // 3. Pelacak Keterlambatan Siswa
        Route::get('/attendances/lateness', [LatenessController::class, 'index'])->name('attendances.lateness');
        Route::post('/attendances/lateness', [LatenessController::class, 'store'])->name('attendances.lateness.store');
        Route::put('/attendances/lateness/{attendance}', [LatenessController::class, 'update'])->name('attendances.lateness.update');
        Route::delete('/attendances/lateness/{attendance}', [LatenessController::class, 'destroy'])->name('attendances.lateness.destroy');

        // 4. Absen Khusus / Izin Pulang Awal
        Route::get('/attendances/adjustments', [AttendanceAdjustmentController::class, 'index'])->name('attendances.adjustments');
        Route::post('/attendances/adjustments', [AttendanceAdjustmentController::class, 'store'])->name('attendances.adjustments.store');

        // 5. Rekapitulasi & Ekspor Laporan
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');
        Route::get('/reports/export-pdf', [ReportController::class, 'exportPdf'])->name('reports.export-pdf');
    });

    // Modul Pengelolaan Berita (Publisher Berita, Admin & Kepala Sekolah)
    Route::middleware('role:publisher,admin,principal,teacher')->group(function () {
        Route::get('/news-management', [NewsController::class, 'index'])->name('news.index');

        // Kategori Berita (Harus didefinisikan SEBELUM rute wildcard {news})
        Route::post('/news-management/categories', [NewsController::class, 'storeCategory'])->name('news.categories.store');
        Route::put('/news-management/categories/{category}', [NewsController::class, 'updateCategory'])->name('news.categories.update')->whereNumber('category');
        Route::delete('/news-management/categories/{category}', [NewsController::class, 'destroyCategory'])->name('news.categories.destroy')->whereNumber('category');

        Route::post('/news-management/fetch-instagram', [NewsController::class, 'fetchInstagram'])->name('news.fetch-instagram');
        Route::post('/news-management/fetch-youtube-thumbnail', [NewsController::class, 'fetchYouTubeThumbnail'])->name('news.fetch-youtube-thumbnail');
        Route::post('/news-management', [NewsController::class, 'store'])->name('news.store');
        Route::post('/news-management/{news}', [NewsController::class, 'update'])->name('news.update')->whereNumber('news');
        Route::delete('/news-management/{news}', [NewsController::class, 'destroy'])->name('news.destroy')->whereNumber('news');
    });

    // Kelola Sambutan Kepala Sekolah & Kontak Kami (Publisher, Admin, Kepala Sekolah)
    Route::middleware('role:publisher,admin,principal')->group(function () {
        // Kelola Sambutan Kepala Sekolah, Profil Sekolah & Kontak Kami
        Route::get('/publisher/principal-greeting', [\App\Http\Controllers\PrincipalGreetingController::class, 'edit'])->name('publisher.greeting.edit');
        Route::post('/publisher/principal-greeting', [\App\Http\Controllers\PrincipalGreetingController::class, 'update'])->name('publisher.greeting.update');

        // Kelola Profil, Nilai-Nilai Utama & Hero Banner Sekolah
        Route::get('/manage/school-profile', [SchoolProfileController::class, 'edit'])->name('school-profile.edit');
        Route::post('/manage/school-profile', [SchoolProfileController::class, 'update'])->name('school-profile.update');
        Route::post('/manage/hero-banner', [SchoolProfileController::class, 'updateHero'])->name('hero-banner.update');

        // Kelola Profil Guru & Tenaga Pendidik
        Route::get('/manage/teacher-profiles', [TeacherProfileController::class, 'index'])->name('teacher-profiles.index');
        Route::post('/manage/teacher-profiles', [TeacherProfileController::class, 'store'])->name('teacher-profiles.store');
        Route::post('/manage/teacher-profiles/sync', [TeacherProfileController::class, 'syncFromMaster'])->name('teacher-profiles.sync');
        Route::post('/manage/teacher-profiles/{teacherProfile}', [TeacherProfileController::class, 'update'])->name('teacher-profiles.update');
        Route::delete('/manage/teacher-profiles/{teacherProfile}', [TeacherProfileController::class, 'destroy'])->name('teacher-profiles.destroy');

        // Kelola Galeri Foto Kegiatan Sekolah
        Route::get('/manage/galleries', [GalleryController::class, 'index'])->name('galleries.index');
        Route::post('/manage/galleries', [GalleryController::class, 'store'])->name('galleries.store');
        Route::post('/manage/galleries/{gallery}', [GalleryController::class, 'update'])->name('galleries.update');
        Route::delete('/manage/galleries/{gallery}', [GalleryController::class, 'destroy'])->name('galleries.destroy');

        // Kelola Kontak Kami & Pesan Pengunjung
        Route::get('/manage/contact', [ContactController::class, 'index'])->name('contact.index');
        Route::post('/manage/contact/settings', [ContactController::class, 'updateSettings'])->name('contact.settings.update');
        Route::patch('/manage/contact/messages/{message}/read', [ContactController::class, 'markAsRead'])->name('contact.messages.read');
        Route::delete('/manage/contact/messages/{message}', [ContactController::class, 'destroyMessage'])->name('contact.messages.destroy');
    });

    // 6. Master Data (Kelas, Siswa, Guru, Jadwal Piket) - Admin & Kepala Sekolah
    Route::middleware('role:admin,principal')->group(function () {
        Route::get('/master', [MasterDataController::class, 'index'])->name('master.index');
        // Kelas CRUD & Batch Import
        Route::post('/master/classrooms', [MasterDataController::class, 'storeClassroom'])->name('master.classrooms.store');
        Route::put('/master/classrooms/{classroom}', [MasterDataController::class, 'updateClassroom'])->name('master.classrooms.update');
        Route::delete('/master/classrooms/{classroom}', [MasterDataController::class, 'destroyClassroom'])->name('master.classrooms.destroy');
        Route::post('/master/classrooms/batch-import', [MasterDataController::class, 'batchImportClassrooms'])->name('master.classrooms.batch-import');
        Route::post('/master/duty-schedules', [MasterDataController::class, 'storeDutySchedule'])->name('master.duty-schedules.store');
        Route::put('/master/duty-schedules/{dutySchedule}', [MasterDataController::class, 'updateDutySchedule'])->name('master.duty-schedules.update');
        Route::delete('/master/duty-schedules/{dutySchedule}', [MasterDataController::class, 'destroyDutySchedule'])->name('master.duty-schedules.destroy');

        // Siswa CRUD & Batch Import
        Route::post('/master/students', [MasterDataController::class, 'storeStudent'])->name('master.students.store');
        Route::put('/master/students/{student}', [MasterDataController::class, 'updateStudent'])->name('master.students.update');
        Route::delete('/master/students/{student}', [MasterDataController::class, 'destroyStudent'])->name('master.students.destroy');
        Route::post('/master/students/batch-import', [MasterDataController::class, 'batchImportStudents'])->name('master.students.batch-import');
        Route::post('/master/promotions', [MasterDataController::class, 'processPromotions'])->name('master.promotions.process');
        Route::put('/master/alumni/{student}', [MasterDataController::class, 'updateAlumni'])->name('master.alumni.update');
        Route::post('/master/alumni/{student}/restore', [MasterDataController::class, 'restoreAlumni'])->name('master.alumni.restore');
        Route::post('/master/alumni/graduate', [MasterDataController::class, 'graduateStudent'])->name('master.alumni.graduate');
        Route::post('/master/alumni/bulk-destroy', [MasterDataController::class, 'bulkDestroyAlumni'])->name('master.alumni.bulk-destroy');
        Route::delete('/master/alumni/{student}', [MasterDataController::class, 'destroyAlumni'])->name('master.alumni.destroy');

        // Guru CRUD & Batch Import
        Route::post('/master/teachers', [MasterDataController::class, 'storeTeacher'])->name('master.teachers.store');
        Route::put('/master/teachers/{user}', [MasterDataController::class, 'updateTeacher'])->name('master.teachers.update');
        Route::delete('/master/teachers/{user}', [MasterDataController::class, 'destroyTeacher'])->name('master.teachers.destroy');
        Route::post('/master/teachers/batch-import', [MasterDataController::class, 'batchImportTeachers'])->name('master.teachers.batch-import');

        // Pengaturan Sekolah (Identitas, Logo, Jam Masuk, Kepala Sekolah)
        Route::get('/admin/school-settings', [SchoolSettingController::class, 'edit'])->name('school-settings.edit');
        Route::post('/admin/school-settings', [SchoolSettingController::class, 'update'])->name('school-settings.update');

        // Kalender Pendidikan & Hari Libur Nasional
        Route::get('/admin/holidays', [HolidayController::class, 'index'])->name('holidays.index');
        Route::post('/admin/holidays', [HolidayController::class, 'store'])->name('holidays.store');
        Route::patch('/admin/holidays/school-days', [HolidayController::class, 'updateSchoolDays'])->name('holidays.school-days');
        Route::put('/admin/holidays/{holiday}', [HolidayController::class, 'update'])->name('holidays.update');
        Route::delete('/admin/holidays/{holiday}', [HolidayController::class, 'destroy'])->name('holidays.destroy');
        Route::post('/admin/holidays/seed', [HolidayController::class, 'seed'])->name('holidays.seed');

        // Notifikasi PWA & Pengingat Presensi Guru - Admin & Kepala Sekolah
        Route::get('/admin/pwa-notifications', [\App\Http\Controllers\PwaNotificationSettingController::class, 'edit'])->name('admin.pwa-notifications.edit');
        Route::post('/admin/pwa-notifications', [\App\Http\Controllers\PwaNotificationSettingController::class, 'update'])->name('admin.pwa-notifications.update');
    });

    // Matriks Pengaturan Hak Akses
    Route::middleware('role:admin,principal')->group(function () {
        Route::get('/admin/permissions', [\App\Http\Controllers\PermissionMatrixController::class, 'index'])->name('permissions.index');
    });

    Route::middleware('role:admin')->group(function () {
        Route::post('/admin/permissions', [\App\Http\Controllers\PermissionMatrixController::class, 'update'])->name('permissions.update');
        Route::post('/admin/permissions/reset', [\App\Http\Controllers\PermissionMatrixController::class, 'reset'])->name('permissions.reset');

        // Manajemen Video Tutorial (Khusus Administrator)
        Route::get('/admin/tutorials', [\App\Http\Controllers\TutorialController::class, 'adminIndex'])->name('admin.tutorials.index');
        Route::post('/admin/tutorials', [\App\Http\Controllers\TutorialController::class, 'store'])->name('admin.tutorials.store');
        Route::put('/admin/tutorials/{tutorial}', [\App\Http\Controllers\TutorialController::class, 'update'])->name('admin.tutorials.update');
        Route::delete('/admin/tutorials/{tutorial}', [\App\Http\Controllers\TutorialController::class, 'destroy'])->name('admin.tutorials.destroy');
        Route::patch('/admin/tutorials/{tutorial}/toggle', [\App\Http\Controllers\TutorialController::class, 'toggleActive'])->name('admin.tutorials.toggle');
    });

    // 7. Modul Kegiatan Ekstrakurikuler (Lapor Ekskul, Roster Anggota, Persetujuan & Cetak)
    Route::middleware('role:admin,principal,coach,teacher')->group(function () {
        Route::get('/extracurricular/reports', [\App\Http\Controllers\ExtracurricularController::class, 'index'])->name('extracurricular.index');
        Route::get('/extracurricular/reports/create', [\App\Http\Controllers\ExtracurricularController::class, 'create'])->name('extracurricular.create');
        Route::post('/extracurricular/reports', [\App\Http\Controllers\ExtracurricularController::class, 'store'])->name('extracurricular.store');
        Route::get('/extracurricular/reports/{report}', [\App\Http\Controllers\ExtracurricularController::class, 'show'])->name('extracurricular.show');
        Route::get('/extracurricular/reports/{report}/edit', [\App\Http\Controllers\ExtracurricularController::class, 'edit'])->name('extracurricular.edit');
        Route::match(['put', 'post'], '/extracurricular/reports/{report}', [\App\Http\Controllers\ExtracurricularController::class, 'update'])->name('extracurricular.update');
        Route::delete('/extracurricular/reports/{report}', [\App\Http\Controllers\ExtracurricularController::class, 'destroy'])->name('extracurricular.destroy');
        Route::post('/extracurricular/reports/{report}/approve', [\App\Http\Controllers\ExtracurricularController::class, 'approve'])->name('extracurricular.approve');
        Route::get('/extracurricular/reports/{report}/print', [\App\Http\Controllers\ExtracurricularController::class, 'print'])->name('extracurricular.print');
        Route::get('/extracurricular/reports/{report}/pdf', [\App\Http\Controllers\ExtracurricularController::class, 'exportPdf'])->name('extracurricular.pdf');
        Route::get('/extracurricular/roster', [\App\Http\Controllers\ExtracurricularController::class, 'roster'])->name('extracurricular.roster');
        Route::post('/extracurricular/roster', [\App\Http\Controllers\ExtracurricularController::class, 'saveRoster'])->name('extracurricular.roster.save');
    });

    // 8. Portal Video Tutorial & Panduan Pengguna (Semua Peran Terdaftar)
    Route::get('/tutorials', [\App\Http\Controllers\TutorialController::class, 'index'])->name('tutorials.index');
});

require __DIR__.'/settings.php';
