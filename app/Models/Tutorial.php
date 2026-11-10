<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tutorial extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'youtube_url',
        'youtube_id',
        'description',
        'target_roles',
        'order',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'target_roles' => 'array',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    protected $appends = [
        'thumbnail_url',
        'embed_url',
        'target_role_labels',
    ];

    /**
     * System roles available for tutorial targeting.
     */
    public static function getAvailableRoles(): array
    {
        return [
            'teacher' => [
                'key' => 'teacher',
                'name' => 'Guru & Wali Kelas',
                'badge' => 'Guru',
                'description' => 'Akses guru presensi harian, jurnal, keterlambatan, dan rekap kelas.',
                'color' => 'emerald',
            ],
            'principal' => [
                'key' => 'principal',
                'name' => 'Kepala Sekolah',
                'badge' => 'Kepsek',
                'description' => 'Akses supervisi kepala sekolah, monitoring jurnal, dan persetujuan laporan.',
                'color' => 'blue',
            ],
            'publisher' => [
                'key' => 'publisher',
                'name' => 'Tim Publikasi / Humas',
                'badge' => 'Publisher',
                'description' => 'Akses penerbitan warta berita, galeri dokumentasi, profil sekolah, dan pesan publik.',
                'color' => 'amber',
            ],
            'coach' => [
                'key' => 'coach',
                'name' => 'Pelatih Ekskul',
                'badge' => 'Pelatih',
                'description' => 'Akses input laporan sesi ekstrakurikuler, presensi murid, dan foto latihan.',
                'color' => 'purple',
            ],
            'admin' => [
                'key' => 'admin',
                'name' => 'Administrator',
                'badge' => 'Admin',
                'description' => 'Akses penuh pengaturan sistem, master data, hak akses, dan manajemen sekolah.',
                'color' => 'red',
            ],
            'student' => [
                'key' => 'student',
                'name' => 'Siswa & Orang Tua',
                'badge' => 'Siswa',
                'description' => 'Akses portal siswa, riwayat kehadiran mandiri, dan agenda sekolah.',
                'color' => 'slate',
            ],
        ];
    }

    /**
     * Extract 11-character YouTube video ID from various YouTube URL formats.
     */
    public static function extractYoutubeId(?string $url): ?string
    {
        if (empty($url)) {
            return null;
        }

        $url = trim($url);

        // Standard patterns: watch?v=ID, youtu.be/ID, embed/ID, shorts/ID, live/ID
        $pattern = '%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?|shorts|live)/|.*[?&]v=)|youtu\.be/)([^"&?/\s]{11})%i';
        if (preg_match($pattern, $url, $matches)) {
            return $matches[1];
        }

        // Direct 11-char ID check
        if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $url)) {
            return $url;
        }

        return null;
    }

    /**
     * Get high quality YouTube thumbnail URL.
     */
    public function getThumbnailUrlAttribute(): string
    {
        if (empty($this->youtube_id)) {
            return '';
        }

        return "https://img.youtube.com/vi/{$this->youtube_id}/hqdefault.jpg";
    }

    /**
     * Get privacy-enhanced YouTube embed player URL.
     */
    public function getEmbedUrlAttribute(): string
    {
        if (empty($this->youtube_id)) {
            return '';
        }

        return "https://www.youtube-nocookie.com/embed/{$this->youtube_id}?autoplay=1&rel=0&modestbranding=1";
    }

    /**
     * Get formatted target role labels with visual metadata.
     */
    public function getTargetRoleLabelsAttribute(): array
    {
        $allRoles = static::getAvailableRoles();
        $targetRoles = is_array($this->target_roles) ? $this->target_roles : [];
        $labels = [];

        foreach ($targetRoles as $roleKey) {
            if (isset($allRoles[$roleKey])) {
                $labels[] = $allRoles[$roleKey];
            } else {
                $labels[] = [
                    'key' => $roleKey,
                    'name' => ucfirst($roleKey),
                    'badge' => ucfirst($roleKey),
                    'color' => 'gray',
                ];
            }
        }

        return $labels;
    }

    /**
     * Scope query to only tutorials matching a specific user role.
     */
    public function scopeForRole(Builder $query, ?string $role): Builder
    {
        if (empty($role) || $role === 'admin') {
            return $query;
        }

        return $query->where(function (Builder $q) use ($role) {
            $q->whereJsonContains('target_roles', $role)
                ->orWhereJsonContains('target_roles', 'all');
        });
    }

    /**
     * The admin user who registered this tutorial.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
