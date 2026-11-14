<?php

namespace App\Services;

use App\Models\RolePermission;
use Illuminate\Support\Facades\Cache;

class PermissionService
{
    public const CACHE_KEY = 'app_role_permissions_matrix';

    /**
     * Get the defined system roles with labels and visual styling metadata.
     */
    public static function getRoles(): array
    {
        return [
            'admin' => [
                'key' => 'admin',
                'name' => 'Administrator',
                'badge' => 'Super User',
                'description' => 'Akses penuh dan mutlak ke seluruh modul dan konfigurasi sistem tanpa batasan.',
                'color' => 'red',
                'is_locked' => true, // Admin permissions cannot be turned off
            ],
            'principal' => [
                'key' => 'principal',
                'name' => 'Kepala Sekolah',
                'badge' => 'Pimpinan',
                'description' => 'Supervisi akademik, pemantauan presensi, jurnal harian, dan evaluasi laporan sekolah.',
                'color' => 'blue',
                'is_locked' => false,
            ],
            'teacher' => [
                'key' => 'teacher',
                'name' => 'Guru & Wali Kelas',
                'badge' => 'Pendidik',
                'description' => 'Pengisian presensi harian, keterlambatan, penyesuaian absen, serta rekap kelas.',
                'color' => 'emerald',
                'is_locked' => false,
            ],
            'publisher' => [
                'key' => 'publisher',
                'name' => 'Tim Publikasi / Humas',
                'badge' => 'Redaksi',
                'description' => 'Pengelolaan warta berita, agenda, galeri foto, profil sekolah, dan pesan publik.',
                'color' => 'amber',
                'is_locked' => false,
            ],
            'student' => [
                'key' => 'student',
                'name' => 'Siswa & Orang Tua',
                'badge' => 'Peserta Didik',
                'description' => 'Akses melihat presensi mandiri, pengajuan izin, kalender pendidikan, dan warta sekolah.',
                'color' => 'slate',
                'is_locked' => false,
            ],
            'coach' => [
                'key' => 'coach',
                'name' => 'Pelatih Ekskul',
                'badge' => 'Pelatih',
                'description' => 'Pengelolaan laporan kegiatan ekskul, presensi murid ekskul, dan dokumentasi latihan.',
                'color' => 'purple',
                'is_locked' => false,
            ],
        ];
    }

    /**
     * Get module categories.
     */
    public static function getCategories(): array
    {
        return [
            'presensi' => [
                'key' => 'presensi',
                'name' => 'Presensi & Akademik',
                'description' => 'Pengelolaan absensi harian, keterlambatan, permohonan izin/sakit, dan laporan kehadiran.',
                'icon' => 'ClipboardCheck',
            ],
            'master' => [
                'key' => 'master',
                'name' => 'Master Data Sekolah',
                'description' => 'Pengelolaan data induk siswa, guru & staf, kelas, rombel, dan jadwal piket.',
                'icon' => 'Database',
            ],
            'publikasi' => [
                'key' => 'publikasi',
                'name' => 'Publikasi & Humas',
                'description' => 'Pengelolaan konten publik, warta berita, galeri dokumentasi, profil, dan layanan kontak.',
                'icon' => 'Newspaper',
            ],
            'sistem' => [
                'key' => 'sistem',
                'name' => 'Pengaturan & Keamanan',
                'description' => 'Konfigurasi profil sekolah, jam presensi, kalender libur, dan matriks hak akses.',
                'icon' => 'Sliders',
            ],
        ];
    }

    /**
     * Get all modules and their granular permissions.
     */
    public static function getModules(): array
    {
        return [
            // Kategori: Presensi & Akademik
            'attendances' => [
                'key' => 'attendances',
                'name' => 'Presensi Harian Siswa',
                'category' => 'presensi',
                'description' => 'Pencatatan dan pemantauan kehadiran siswa per kelas setiap hari sekolah.',
                'icon' => 'UserCheck',
                'permissions' => [
                    'view' => ['label' => 'Melihat Presensi', 'description' => 'Melihat rekap dan status presensi harian siswa.'],
                    'create' => ['label' => 'Input Presensi', 'description' => 'Melakukan entri absensi harian (hadir/sakit/izin/alfa).'],
                    'edit' => ['label' => 'Ubah Presensi', 'description' => 'Menyunting catatan kehadiran yang sudah tersimpan.'],
                    'delete' => ['label' => 'Hapus Presensi', 'description' => 'Mereset atau menghapus rekaman presensi kelas.'],
                ],
            ],
            'lateness' => [
                'key' => 'lateness',
                'name' => 'Keterlambatan Siswa',
                'category' => 'presensi',
                'description' => 'Pencatatan siswa yang tiba setelah jam masuk dan penerbitan slip izin masuk.',
                'icon' => 'Clock',
                'permissions' => [
                    'view' => ['label' => 'Lihat Data Terlambat', 'description' => 'Melihat daftar rekaman keterlambatan siswa.'],
                    'create' => ['label' => 'Catat Terlambat', 'description' => 'Menginput siswa terlambat pada gerbang piket.'],
                    'print' => ['label' => 'Cetak Slip Izin', 'description' => 'Mencetak surat izin masuk kelas bagi siswa terlambat.'],
                ],
            ],
            'adjustments' => [
                'key' => 'adjustments',
                'name' => 'Absen Khusus & Dispensasi',
                'category' => 'presensi',
                'description' => 'Pengajuan permohonan izin terencana, cuti sakit dengan surat dokter, atau dispensasi dinas.',
                'icon' => 'CalendarDays',
                'permissions' => [
                    'view' => ['label' => 'Lihat Permohonan', 'description' => 'Melihat daftar permohonan izin & dispensasi.'],
                    'create' => ['label' => 'Ajukan Permohonan', 'description' => 'Membuat dan mengunggah bukti pengajuan izin/sakit.'],
                    'edit' => ['label' => 'Sunting Absen Khusus', 'description' => 'Mengubah data permohonan izin pulang awal/absen khusus.'],
                    'delete' => ['label' => 'Hapus Absen Khusus', 'description' => 'Menghapus permohonan izin pulang awal/absen khusus.'],
                    'approve' => ['label' => 'Validasi / Setujui', 'description' => 'Menyetujui atau menolak permohonan absen khusus.'],
                ],
            ],
            'principal_journals' => [
                'key' => 'principal_journals',
                'name' => 'Jurnal Kepala Sekolah',
                'category' => 'presensi',
                'description' => 'Catatan agenda kerja, refleksi manajerial, supervisi kelas, dan arahan pembinaan kepala sekolah.',
                'icon' => 'BookOpenCheck',
                'permissions' => [
                    'view' => ['label' => 'Lihat Jurnal', 'description' => 'Membaca riwayat entri jurnal supervisi pimpinan.'],
                    'manage' => ['label' => 'Kelola Jurnal', 'description' => 'Membuat, menyunting, dan menghapus catatan jurnal pimpinan.'],
                ],
            ],
            'reports' => [
                'key' => 'reports',
                'name' => 'Rekapitulasi & Laporan',
                'category' => 'presensi',
                'description' => 'Analitik statistik kehadiran, grafik persentase bulanan/semester, dan laporan resmi.',
                'icon' => 'FileSpreadsheet',
                'permissions' => [
                    'view' => ['label' => 'Lihat Statistik', 'description' => 'Membuka dasbor rekapitulasi dan grafik persentase.'],
                    'export' => ['label' => 'Ekspor Laporan (Excel/PDF)', 'description' => 'Mengunduh rekap presensi dalam format spreadsheet atau dokumen cetak.'],
                ],
            ],
            'extracurricular' => [
                'key' => 'extracurricular',
                'name' => 'Laporan Ekstrakurikuler',
                'category' => 'presensi',
                'description' => 'Laporan sesi kegiatan ekstrakurikuler, presensi siswa, evaluasi perkembangan murid, dan persetujuan kepala sekolah.',
                'icon' => 'Award',
                'permissions' => [
                    'view' => ['label' => 'Lihat Laporan Ekskul', 'description' => 'Melihat daftar laporan kegiatan dan kehadiran murid ekskul.'],
                    'create' => ['label' => 'Buat Laporan Baru', 'description' => 'Menginput laporan sesi latihan dan checklist kehadiran murid.'],
                    'edit' => ['label' => 'Sunting Laporan', 'description' => 'Mengubah data laporan kegiatan yang belum disetujui.'],
                    'delete' => ['label' => 'Hapus Laporan', 'description' => 'Menghapus arsip laporan kegiatan ekskul.'],
                    'roster' => ['label' => 'Atur Anggota Siswa', 'description' => 'Mengatur daftar murid ekskul default sebagai anggota tetap.'],
                    'approve' => ['label' => 'Persetujuan Kepala Sekolah', 'description' => 'Menyetujui atau meminta revisi laporan ekskul.'],
                    'print' => ['label' => 'Cetak Lembar Laporan', 'description' => 'Mencetak dokumen resmi laporan ekskul yang disetujui.'],
                ],
            ],

            // Kategori: Master Data
            'master_students' => [
                'key' => 'master_students',
                'name' => 'Data Siswa & Alumni',
                'category' => 'master',
                'description' => 'Data pokok murid aktif, data NISN, perpindahan kelas, riwayat kelulusan, dan alumni.',
                'icon' => 'Users',
                'permissions' => [
                    'view' => ['label' => 'Lihat Siswa', 'description' => 'Melihat direktori data murid dan biodata.'],
                    'create' => ['label' => 'Tambah Siswa', 'description' => 'Mendaftarkan siswa baru satu per satu.'],
                    'edit' => ['label' => 'Edit Siswa', 'description' => 'Menyunting biodata, NISN, atau status murid.'],
                    'delete' => ['label' => 'Hapus Siswa', 'description' => 'Menghapus data siswa dari pangkalan data.'],
                    'import' => ['label' => 'Impor Massal (Excel)', 'description' => 'Mengunggah file Excel berisi banyak siswa sekaligus.'],
                    'alumni' => ['label' => 'Kenaikan & Kelulusan', 'description' => 'Memproses kenaikan tingkat kelas dan arsip alumni.'],
                ],
            ],
            'master_teachers' => [
                'key' => 'master_teachers',
                'name' => 'Data Guru & Tenaga Kependidikan',
                'category' => 'master',
                'description' => 'Pengelolaan akun pengajar, data NIP, hak peran pengguna, dan biodata staf.',
                'icon' => 'Shield',
                'permissions' => [
                    'view' => ['label' => 'Lihat Guru & Staf', 'description' => 'Melihat daftar dewan guru dan tenaga kependidikan.'],
                    'manage' => ['label' => 'Kelola Akun Guru', 'description' => 'Menambah, menyunting data, dan mengatur akun login dewan guru.'],
                ],
            ],
            'master_classes' => [
                'key' => 'master_classes',
                'name' => 'Data Kelas & Jadwal Piket',
                'category' => 'master',
                'description' => 'Pengaturan rombongan belajar, penugasan wali kelas, dan giliran piket mingguan.',
                'icon' => 'GraduationCap',
                'permissions' => [
                    'view' => ['label' => 'Lihat Kelas & Piket', 'description' => 'Melihat susunan kelas dan roster piket harian.'],
                    'manage' => ['label' => 'Atur Rombel & Piket', 'description' => 'Menambah/mengubah kelas, wali kelas, dan jadwal guru piket.'],
                ],
            ],

            // Kategori: Publikasi & Humas
            'news' => [
                'key' => 'news',
                'name' => 'Warta, Berita & Pengumuman',
                'category' => 'publikasi',
                'description' => 'Penerbitan warta sekolah, agenda kegiatan, pengumuman penting, dan surat edaran.',
                'icon' => 'Newspaper',
                'permissions' => [
                    'view' => ['label' => 'Lihat Draf & Warta', 'description' => 'Melihat daftar berita di portal administrasi.'],
                    'create' => ['label' => 'Tulis Berita Baru', 'description' => 'Menyusun naskah warta, foto pendukung, dan lampiran PDF.'],
                    'edit' => ['label' => 'Sunting Berita', 'description' => 'Memperbarui naskah tulisan dan lampiran warta.'],
                    'publish' => ['label' => 'Terbitkan ke Publik', 'description' => 'Mengubah status berita menjadi terbit di portal publik.'],
                    'delete' => ['label' => 'Hapus Berita', 'description' => 'Menghapus postingan warta sekolah.'],
                ],
            ],
            'galleries' => [
                'key' => 'galleries',
                'name' => 'Galeri Foto Kegiatan',
                'category' => 'publikasi',
                'description' => 'Dokumentasi visual kegiatan belajar, upacara, perlombaan, dan pentas seni sekolah.',
                'icon' => 'Images',
                'permissions' => [
                    'view' => ['label' => 'Lihat Galeri', 'description' => 'Melihat album foto kegiatan sekolah.'],
                    'manage' => ['label' => 'Kelola Album & Foto', 'description' => 'Mengunggah foto resolusi tinggi, caption, dan menghapus dokumentasi.'],
                ],
            ],
            'school_profile' => [
                'key' => 'school_profile',
                'name' => 'Profil Sekolah & Pendidik',
                'category' => 'publikasi',
                'description' => 'Visi misi institusi, sejarah, nilai inti, pilar unggulan, dan kartu profil pengajar.',
                'icon' => 'Building2',
                'permissions' => [
                    'view' => ['label' => 'Lihat Profil', 'description' => 'Melihat konfigurasi profil publik sekolah.'],
                    'manage' => ['label' => 'Sunting Profil & Guru', 'description' => 'Mengubah visi misi, nilai budaya sekolah, dan biodata pengajar di website.'],
                ],
            ],
            'principal_greeting' => [
                'key' => 'principal_greeting',
                'name' => 'Sambutan Kepala Sekolah',
                'category' => 'publikasi',
                'description' => 'Pesan pembuka, narasi sambutan resmi pimpinan institusi, dan foto kepala sekolah.',
                'icon' => 'MessageSquareQuote',
                'permissions' => [
                    'view' => ['label' => 'Lihat Sambutan', 'description' => 'Melihat narasi sambutan kepala sekolah.'],
                    'manage' => ['label' => 'Sunting Sambutan & Foto', 'description' => 'Memperbarui isi pidato sambutan dan foto resmi pimpinan.'],
                ],
            ],
            'contact_messages' => [
                'key' => 'contact_messages',
                'name' => 'Pesan Masuk & Pengaduan',
                'category' => 'publikasi',
                'description' => 'Pesan aspirasi, pertanyaan masyarakat, dan kontak yang masuk dari portal publik.',
                'icon' => 'PhoneCall',
                'permissions' => [
                    'view' => ['label' => 'Membaca Pesan', 'description' => 'Melihat isi pesan masuk dari wali murid dan masyarakat.'],
                    'manage' => ['label' => 'Kelola Status Pesan', 'description' => 'Menandai pesan selesai dibaca atau menghapus pesan.'],
                ],
            ],

            // Kategori: Pengaturan & Keamanan
            'school_settings' => [
                'key' => 'school_settings',
                'name' => 'Identitas & Konfigurasi Sekolah',
                'category' => 'sistem',
                'description' => 'Nama resmi, alamat, logo, waktu toleransi jam masuk presensi, dan tema warna sistem.',
                'icon' => 'School',
                'permissions' => [
                    'view' => ['label' => 'Lihat Pengaturan', 'description' => 'Melihat ringkasan konfigurasi operasional sekolah.'],
                    'manage' => ['label' => 'Ubah Pengaturan & Tema', 'description' => 'Menyimpan identitas, jam masuk presensi, dan tema visual.'],
                ],
            ],
            'holidays' => [
                'key' => 'holidays',
                'name' => 'Kalender Pendidikan & Libur',
                'category' => 'sistem',
                'description' => 'Jadwal libur nasional, jeda semester, dan penetapan 5 atau 6 hari sekolah efektif.',
                'icon' => 'Calendar',
                'permissions' => [
                    'view' => ['label' => 'Lihat Kalender', 'description' => 'Melihat agenda libur dan hari efektif belajar.'],
                    'manage' => ['label' => 'Kelola Hari Libur', 'description' => 'Menambah hari libur baru, sinkronisasi kalender, atau ganti sistem hari sekolah.'],
                ],
            ],
            'pwa_notifications' => [
                'key' => 'pwa_notifications',
                'name' => 'Pengaturan Notifikasi PWA',
                'category' => 'sistem',
                'description' => 'Konfigurasi interval pengingat presensi otomatis guru, jam aktif operasional, dan notifikasi PWA.',
                'icon' => 'BellRing',
                'permissions' => [
                    'view' => ['label' => 'Lihat Pengaturan', 'description' => 'Melihat konfigurasi notifikasi PWA dan jadwal pengingat.'],
                    'manage' => ['label' => 'Kelola Notifikasi PWA', 'description' => 'Menyimpan interval, jam operasional, template pesan, dan preferensi notifikasi.'],
                ],
            ],
            'permissions' => [
                'key' => 'permissions',
                'name' => 'Matriks Hak Akses Pengguna',
                'category' => 'sistem',
                'description' => 'Konfigurasi granular izin dan hak wewenang akses per peran di sistem web.',
                'icon' => 'ShieldCheck',
                'permissions' => [
                    'view' => ['label' => 'Lihat Matriks', 'description' => 'Membuka dasbor tabel matriks hak akses pengguna.'],
                    'manage' => ['label' => 'Ubah Hak Akses', 'description' => 'Menyimpan perubahan wewenang dan mereset matriks peran.'],
                ],
            ],
        ];
    }

    /**
     * Get the default baseline matrix configuration.
     */
    public static function getDefaultMatrix(): array
    {
        $modules = static::getModules();
        $roles = array_keys(static::getRoles());
        $matrix = [];

        foreach ($roles as $role) {
            $matrix[$role] = [];
            foreach ($modules as $modKey => $mod) {
                $matrix[$role][$modKey] = [];
                foreach ($mod['permissions'] as $permKey => $perm) {
                    $isGranted = false;

                    if ($role === 'admin') {
                        $isGranted = true;
                    } elseif ($role === 'principal') {
                        // Kepala sekolah has high oversight
                        if ($modKey === 'permissions') {
                            $isGranted = ($permKey === 'view');
                        } elseif ($modKey === 'school_settings') {
                            $isGranted = ($permKey === 'view');
                        } else {
                            $isGranted = true;
                        }
                    } elseif ($role === 'teacher') {
                        // Guru & wali kelas (hanya modul presensi & rekap laporan)
                        if ($modKey === 'attendances') {
                            $isGranted = in_array($permKey, ['view', 'create', 'edit']);
                        } elseif ($modKey === 'lateness') {
                            $isGranted = true;
                        } elseif ($modKey === 'adjustments') {
                            $isGranted = in_array($permKey, ['view', 'create', 'edit', 'delete']);
                        } elseif ($modKey === 'reports') {
                            $isGranted = true;
                        }
                    } elseif ($role === 'coach') {
                        // Pelatih Ekskul (hanya modul ekstrakurikuler)
                        if ($modKey === 'extracurricular') {
                            $isGranted = in_array($permKey, ['view', 'create', 'edit', 'delete', 'roster', 'print']);
                        }
                    } elseif ($role === 'publisher') {
                        // Tim Humas & Publikasi (hanya modul publikasi & humas)
                        if (in_array($modKey, ['news', 'galleries', 'school_profile', 'principal_greeting', 'contact_messages'])) {
                            $isGranted = true;
                        }
                    } elseif ($role === 'student') {
                        // Siswa & Orang tua
                        if (in_array($modKey, ['attendances', 'lateness'])) {
                            $isGranted = ($permKey === 'view');
                        } elseif ($modKey === 'adjustments') {
                            $isGranted = in_array($permKey, ['view', 'create']);
                        }
                    }

                    $matrix[$role][$modKey][$permKey] = $isGranted;
                }
            }
        }

        return $matrix;
    }

    /**
     * Get the current active permission matrix from database (with auto-seed from defaults if empty).
     */
    public static function getMatrix(): array
    {
        return Cache::remember(self::CACHE_KEY, 86400, function () {
            $records = RolePermission::all();

            $defaults = static::getDefaultMatrix();

            if ($records->isEmpty()) {
                // Auto-seed defaults into DB
                static::seedDefaults();
                return $defaults;
            }

            // Overlay DB records over defaults so any new modules will have fallbacks
            $matrix = $defaults;
            foreach ($records as $record) {
                if (isset($matrix[$record->role][$record->module][$record->permission])) {
                    // Admin is always locked to true
                    if ($record->role === 'admin') {
                        $matrix[$record->role][$record->module][$record->permission] = true;
                    } else {
                        $matrix[$record->role][$record->module][$record->permission] = (bool) $record->is_granted;
                    }
                }
            }

            return $matrix;
        });
    }

    /**
     * Seed or re-seed the default matrix into the role_permissions table.
     */
    public static function seedDefaults(): void
    {
        $defaults = static::getDefaultMatrix();
        $now = now();
        $rows = [];

        foreach ($defaults as $role => $modules) {
            foreach ($modules as $modKey => $perms) {
                foreach ($perms as $permKey => $granted) {
                    $rows[] = [
                        'role' => $role,
                        'module' => $modKey,
                        'permission' => $permKey,
                        'is_granted' => (bool) $granted,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }

        RolePermission::truncate();
        foreach (array_chunk($rows, 100) as $chunk) {
            RolePermission::insert($chunk);
        }

        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Update the permission matrix with new values from administrator.
     */
    public static function updateMatrix(array $newMatrix): void
    {
        $defaults = static::getDefaultMatrix();
        $roles = static::getRoles();

        foreach ($newMatrix as $role => $modules) {
            // Skip non-existent roles or locked admin role
            if (! isset($roles[$role]) || $roles[$role]['is_locked']) {
                continue;
            }

            if (! is_array($modules)) {
                continue;
            }

            foreach ($modules as $modKey => $perms) {
                if (! is_array($perms)) {
                    continue;
                }

                foreach ($perms as $permKey => $isGranted) {
                    // Ensure the module and permission exist in system definitions
                    if (isset($defaults[$role][$modKey][$permKey])) {
                        RolePermission::updateOrCreate(
                            [
                                'role' => $role,
                                'module' => $modKey,
                                'permission' => $permKey,
                            ],
                            [
                                'is_granted' => (bool) $isGranted,
                            ]
                        );
                    }
                }
            }
        }

        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Check if a specific role has permission for a module and action.
     */
    public static function hasPermission(string $role, string $module, string $permission = 'view'): bool
    {
        if ($role === 'admin') {
            return true;
        }

        $matrix = static::getMatrix();

        return (bool) ($matrix[$role][$module][$permission] ?? false);
    }
}
