<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];

    protected $appends = [
        'logo_url',
        'principal_photo_url',
        'profile_image_url',
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
     * Get or create the singleton instance of school settings.
     */
    public static function getSetting(): self
    {
        return static::firstOrCreate([], [
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
