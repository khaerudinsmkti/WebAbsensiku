<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class SchoolSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'school_motto',
        'accreditation',
        'profile_description',
        'vision',
        'mission',
        'profile_image_path',
        'hero_badge',
        'hero_title',
        'hero_highlight',
        'hero_description',
        'hero_image_path',
        'hero_pillars',
        'core_values',
        'address',
        'city',
        'postal_code',
        'phone',
        'email',
        'principal_name',
        'principal_nip',
        'principal_photo_path',
        'principal_greeting_title',
        'principal_greeting',
        'principal_greeting_active',
        'whatsapp',
        'instagram',
        'facebook',
        'youtube',
        'tiktok',
        'operating_hours',
        'maps_embed_url',
        'contact_description',
        'contact_active',
        'start_time',
        'school_days_per_week',
        'logo_path',
    ];

    protected $casts = [
        'school_days_per_week' => 'integer',
        'principal_greeting_active' => 'boolean',
        'contact_active' => 'boolean',
        'hero_pillars' => 'array',
        'core_values' => 'array',
    ];

    protected $appends = [
        'logo_url',
        'principal_photo_url',
        'profile_image_url',
        'hero_image_url',
        'is_saturday_holiday',
    ];

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path ? asset('storage/' . $this->logo_path) : null;
    }

    public function getPrincipalPhotoUrlAttribute(): ?string
    {
        return $this->principal_photo_path ? asset('storage/' . $this->principal_photo_path) : null;
    }

    public function getProfileImageUrlAttribute(): ?string
    {
        return $this->profile_image_path ? asset('storage/' . $this->profile_image_path) : null;
    }

    public function getHeroImageUrlAttribute(): ?string
    {
        return $this->hero_image_path ? asset('storage/' . $this->hero_image_path) : null;
    }

    public static function defaultHeroPillars(): array
    {
        return [
            [
                'title' => 'Pendidikan Karakter',
                'description' => 'Membina akhlak mulia, kemandirian, empati, dan budi pekerti luhur sejak dini.',
            ],
            [
                'title' => 'Belajar Aktif & Ceria',
                'description' => 'Pembelajaran kontekstual yang menyenangkan dan menumbuhkan daya nalar kritis.',
            ],
            [
                'title' => 'Wadah Prestasi Siswa',
                'description' => 'Mendukung minat seni, olahraga, sains, serta kejuaraan akademik dan non-akademik.',
            ],
            [
                'title' => 'Sinergi Orang Tua',
                'description' => 'Komunikasi transparan dan kemitraan hangat antara sekolah dan keluarga.',
            ],
        ];
    }

    public static function defaultCoreValues(): array
    {
        return [
            [
                'title' => 'Budi Pekerti Luhur',
                'description' => 'Membiasakan 5S (Senyum, Salam, Sapa, Sopan, Santun) serta integritas dalam bersikap.',
            ],
            [
                'title' => 'Cerdas & Terampil',
                'description' => 'Mengasah literasi, numerasi, dan keterampilan berpikir kritis menghadapi tantangan era modern.',
            ],
            [
                'title' => 'Gotong Royong',
                'description' => 'Membangun semangat empati, kerja sama kelompok, serta kepedulian terhadap sesama dan lingkungan.',
            ],
            [
                'title' => 'Melek Digital',
                'description' => 'Pemanfaatan teknologi edukasi yang ramah anak, bijak, dan aman untuk memperluas wawasan dunia.',
            ],
        ];
    }

    public function getHeroBadgeAttribute($value): string
    {
        $schoolName = $this->attributes['name'] ?? 'AbsensiKu SD';
        return $value ?: "Selamat Datang di Portal Resmi {$schoolName}";
    }

    public function getHeroTitleAttribute($value): string
    {
        return $value ?: 'Mewujudkan Generasi Cerdas,';
    }

    public function getHeroHighlightAttribute($value): string
    {
        return $value ?: 'Kreatif, Ceria & Berakhlak Mulia';
    }

    public function getHeroDescriptionAttribute($value): string
    {
        $schoolName = $this->attributes['name'] ?? 'AbsensiKu SD';
        return $value ?: "Selamat datang di pusat informasi dan warta sekolah resmi {$schoolName}. Kami berdedikasi membangun lingkungan belajar yang ramah anak, berbudaya positif, dan menginspirasi setiap siswa untuk berkembang menjadi pribadi berprestasi.";
    }

    public function getHeroPillarsAttribute($value): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded) && count($decoded) > 0) {
                return $decoded;
            }
        } elseif (is_array($value) && count($value) > 0) {
            return $value;
        }

        return static::defaultHeroPillars();
    }

    public function getCoreValuesAttribute($value): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded) && count($decoded) > 0) {
                return $decoded;
            }
        } elseif (is_array($value) && count($value) > 0) {
            return $value;
        }

        return static::defaultCoreValues();
    }

    public function getProfileDescriptionAttribute($value): ?string
    {
        return $value ?: 'SD Digital Indonesia adalah institusi pendidikan dasar terkemuka yang berdedikasi menghadirkan pembelajaran modern berbasis teknologi serta penanaman budi pekerti luhur. Berdiri sejak tahun 2010, sekolah kami telah mendidik ribuan siswa berprestasi yang siap bersaing di kancah nasional maupun global.';
    }

    public function getVisionAttribute($value): ?string
    {
        return $value ?: 'Terwujudnya peserta didik yang beriman, bertakwa, berakhlak mulia, cerdas, terampil, berkarakter luhur, dan berwawasan global dalam era digital.';
    }

    public function getMissionAttribute($value): ?string
    {
        return $value ?: "1. Menanamkan nilai keimanan, ketakwaan, dan budi pekerti luhur dalam kehidupan sehari-hari.\n2. Melaksanakan pembelajaran aktif, inovatif, kreatif, dan menyenangkan berbasis teknologi ramah anak.\n3. Mengembangkan potensi bakat, minat, dan kecerdasan majemuk peserta didik secara optimal melalui kegiatan intrakulikuler dan ekstrakurikuler.\n4. Mewujudkan lingkungan sekolah yang bersih, sehat, aman, inklusif, dan kondusif untuk bertumbuh kembang.\n5. Menjalin kemitraan yang harmonis dan transparan antara pihak sekolah, komite, orang tua murid, dan masyarakat sekitar.";
    }

    public function getSchoolMottoAttribute($value): ?string
    {
        return $value ?: 'Membentuk Generasi Berkarakter, Cerdas, dan Berprestasi';
    }

    public function getAccreditationAttribute($value): ?string
    {
        return $value ?: 'Akreditasi A (Unggul)';
    }

    public function getIsSaturdayHolidayAttribute(): bool
    {
        return $this->isSaturdayHoliday();
    }

    /**
     * Check if Saturday is treated as a weekend holiday (5-day school week).
     */
    public function isSaturdayHoliday(): bool
    {
        return (int) ($this->school_days_per_week ?? 6) === 5;
    }

    /**
     * Ensure hero banner and core_values columns exist on school_settings table.
     */
    public static function ensureHeroAndCoreValueColumns(): void
    {
        try {
            if (Schema::hasTable('school_settings') && ! Schema::hasColumn('school_settings', 'core_values')) {
                Schema::table('school_settings', function (Blueprint $table) {
                    if (! Schema::hasColumn('school_settings', 'hero_badge')) {
                        $table->string('hero_badge')->nullable();
                    }
                    if (! Schema::hasColumn('school_settings', 'hero_title')) {
                        $table->string('hero_title')->nullable();
                    }
                    if (! Schema::hasColumn('school_settings', 'hero_highlight')) {
                        $table->string('hero_highlight')->nullable();
                    }
                    if (! Schema::hasColumn('school_settings', 'hero_description')) {
                        $table->text('hero_description')->nullable();
                    }
                    if (! Schema::hasColumn('school_settings', 'hero_image_path')) {
                        $table->string('hero_image_path')->nullable();
                    }
                    if (! Schema::hasColumn('school_settings', 'hero_pillars')) {
                        $table->json('hero_pillars')->nullable();
                    }
                    if (! Schema::hasColumn('school_settings', 'core_values')) {
                        $table->json('core_values')->nullable();
                    }
                });
            }
        } catch (\Throwable $e) {
            // Ignore schema check errors if DB is read-only
        }
    }

    protected static ?self $cachedSetting = null;

    protected static function booted(): void
    {
        static::saved(function (self $setting) {
            static::$cachedSetting = $setting;
        });

        static::deleted(function () {
            static::$cachedSetting = null;
        });
    }

    /**
     * Get or create the singleton instance of school settings (memoized per request).
     */
    public static function getSetting(): self
    {
        if (static::$cachedSetting !== null) {
            return static::$cachedSetting;
        }

        return static::$cachedSetting = static::firstOrCreate([], [
            'name' => 'SD Digital Indonesia',
            'address' => 'Jl. Pendidikan Merdeka No. 45',
            'city' => 'Jakarta Selatan',
            'postal_code' => '12150',
            'phone' => '(021) 7890123',
            'email' => 'info@sddigital.sch.id',
            'principal_name' => 'Drs. H. Mulyadi, M.Pd.',
            'principal_nip' => '197205121998031004',
            'principal_photo_path' => null,
            'principal_greeting_title' => 'Membangun Karakter, Meraih Prestasi Bersama',
            'principal_greeting' => 'Puji syukur kita panjatkan ke hadirat Tuhan Yang Maha Esa. Selamat datang di portal resmi sekolah kami. Kami berkomitmen untuk mewujudkan lingkungan pendidikan yang aman, inklusif, dan penuh kasih sayang bagi seluruh peserta didik. Bersama jajaran tenaga pendidik yang berdedikasi dan dukungan hangat para orang tua, kami membimbing anak-anak menjadi pribadi yang unggul, berakhlak mulia, serta siap menyongsong masa depan dengan ceria dan penuh percaya diri.',
            'principal_greeting_active' => true,
            'whatsapp' => '081234567890',
            'instagram' => 'sddigital_official',
            'facebook' => 'SD Digital Indonesia',
            'youtube' => 'SD Digital Channel',
            'tiktok' => 'sddigital.id',
            'operating_hours' => 'Senin - Jumat, 07:00 - 15:00 WIB',
            'maps_embed_url' => null,
            'contact_description' => 'Punya pertanyaan seputar penerimaan siswa baru, kurikulum, kegiatan belajar mengajar, atau kunjungan sekolah? Hubungi kami langsung melalui layanan kontak di bawah ini.',
            'contact_active' => true,
            'start_time' => '07:00',
            'school_days_per_week' => 6,
            'logo_path' => null,
        ]);
    }
}
