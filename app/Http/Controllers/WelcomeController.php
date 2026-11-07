<?php

namespace App\Http\Controllers;

use App\Models\AcademicHoliday;
use App\Models\Gallery;
use App\Models\News;
use App\Models\NewsCategory;
use App\Models\SchoolSetting;
use App\Models\TeacherProfile;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    /**
     * Public Homepage (Beranda Utama): Hero, 4 Pilar, Sambutan Kepala Sekolah, Berita Terkini.
     */
    public function index(): Response
    {
        News::ensureInstagramColumn();

        // News for public homepage - seluruh berita terpublikasi untuk pagination interaktif (default 9)
        $newsList = News::with(['category', 'author:id,name,role'])
            ->published()
            ->orderByDesc('published_at')
            ->get();

        $totalNewsCount = News::published()->count();

        $newsCategories = NewsCategory::withCount(['news' => fn ($q) => $q->published()])
            ->get();

        $schoolSetting = SchoolSetting::getSetting();
        $principalGreeting = [
            'name' => $schoolSetting->principal_name,
            'title' => $schoolSetting->principal_greeting_title ?? 'Sambutan Kepala Sekolah',
            'content' => $schoolSetting->principal_greeting,
            'is_active' => (bool) ($schoolSetting->principal_greeting_active ?? true),
            'photo_url' => $schoolSetting->principal_photo_url,
        ];

        $heroBanner = [
            'badge' => $schoolSetting->hero_badge,
            'title' => $schoolSetting->hero_title,
            'highlight' => $schoolSetting->hero_highlight,
            'description' => $schoolSetting->hero_description,
            'image_url' => $schoolSetting->hero_image_url,
            'pillars' => $schoolSetting->hero_pillars,
        ];

        Gallery::ensureTableExists();
        $galleries = Gallery::with('author:id,name')
            ->published()
            ->orderByDesc('activity_date')
            ->orderByDesc('created_at')
            ->get();
        $totalGalleriesCount = $galleries->count();

        return Inertia::render('welcome', [
            'news' => $newsList,
            'newsCategories' => $newsCategories,
            'totalNewsCount' => $totalNewsCount,
            'principalGreeting' => $principalGreeting,
            'heroBanner' => $heroBanner,
            'galleries' => $galleries,
            'totalGalleriesCount' => $totalGalleriesCount,
        ]);
    }

    /**
     * Display a paginated listing of news for the public portal.
     */
    public function news(Request $request): Response
    {
        News::ensureInstagramColumn();

        $search = $request->input('search');
        $categoryId = $request->input('category_id');
        $perPage = (int) $request->input('per_page', 9);
        if (!in_array($perPage, [9, 18, 27, 36])) {
            $perPage = 9;
        }

        $query = News::with(['category', 'author:id,name,role'])
            ->published()
            ->orderByDesc('published_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        if ($categoryId && $categoryId !== 'all') {
            $query->where('category_id', $categoryId);
        }

        $newsList = $query->paginate($perPage)->withQueryString();

        $newsCategories = NewsCategory::withCount(['news' => fn ($q) => $q->published()])
            ->get();

        return Inertia::render('news/public-index', [
            'news' => $newsList,
            'newsCategories' => $newsCategories,
            'filters' => [
                'search' => $search ?? '',
                'category_id' => $categoryId ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Increment view count when a visitor opens a news article.
     */
    public function incrementNewsView(News $news): \Illuminate\Http\JsonResponse
    {
        if ($news->is_published) {
            $news->increment('views_count');
        }

        return response()->json([
            'views_count' => (int) $news->views_count,
        ]);
    }

    /**
     * Public Photo Gallery Page (Menu Galeri Kegiatan).
     */
    public function gallery(Request $request): Response
    {
        Gallery::ensureTableExists();

        $search = $request->input('search');
        $category = $request->input('category');

        $query = Gallery::with('author:id,name')
            ->published()
            ->orderByDesc('activity_date')
            ->orderByDesc('created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        $galleries = $query->paginate(9)->withQueryString();

        $categories = Gallery::published()
            ->select('category')
            ->distinct()
            ->pluck('category')
            ->filter()
            ->values();

        return Inertia::render('gallery/public-index', [
            'galleries' => $galleries,
            'categories' => $categories,
            'filters' => [
                'search' => $search ?? '',
                'category' => $category ?? 'all',
            ],
        ]);
    }

    /**
     * Public Academic Calendar Page (Menu Kalender).
     */
    public function calendar(Request $request): Response
    {
        $today = Carbon::today();
        $month = (int) $request->input('month', $today->month);
        $year = (int) $request->input('year', $today->year);

        // Normalize month & year if navigated
        if ($month < 1) {
            $month = 12;
            $year--;
        } elseif ($month > 12) {
            $month = 1;
            $year++;
        }

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $currentDate = Carbon::createFromDate($year, $month, 1);
        $startOfMonth = $currentDate->copy()->startOfMonth();
        $endOfMonth = $currentDate->copy()->endOfMonth();
        $daysCount = $currentDate->daysInMonth;

        // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        $firstDayOfWeek = $startOfMonth->dayOfWeek;

        // Holidays for this month
        $holidays = AcademicHoliday::where(function ($q) use ($startOfMonth, $endOfMonth) {
            $q->whereBetween('start_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                ->orWhereBetween('end_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                ->orWhere(function ($sub) use ($startOfMonth, $endOfMonth) {
                    $sub->where('start_date', '<=', $startOfMonth->toDateString())
                        ->where('end_date', '>=', $endOfMonth->toDateString());
                });
        })->orderBy('start_date')->get();

        $days = [];
        $effectiveDays = 0;
        $holidayDays = 0;
        $isSaturdayOff = AcademicHoliday::isSaturdayHoliday();

        $dayNamesIndo = [
            0 => 'Minggu', 1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu',
        ];

        for ($i = 1; $i <= $daysCount; $i++) {
            $cur = Carbon::createFromDate($year, $month, $i);
            $dateStr = $cur->toDateString();
            $isSunday = $cur->isSunday();
            $isSaturday = $cur->isSaturday();
            $isSaturdayHoliday = $isSaturday && $isSaturdayOff;
            $isToday = $cur->isSameDay($today);
            $dayOfWeek = $cur->dayOfWeek;

            $matchingHoliday = $holidays->first(function ($h) use ($dateStr) {
                return $dateStr >= $h->start_date->toDateString() && $dateStr <= $h->end_date->toDateString();
            });

            $isWeekend = $isSunday || $isSaturdayHoliday;
            $isHoliday = $isWeekend || $matchingHoliday !== null;
            if ($isHoliday) {
                $holidayDays++;
            } else {
                $effectiveDays++;
            }

            $days[] = [
                'date' => $dateStr,
                'day' => $i,
                'day_of_week' => $dayOfWeek,
                'day_name' => $dayNamesIndo[$dayOfWeek] ?? '',
                'is_sunday' => $isSunday,
                'is_saturday' => $isSaturday,
                'is_saturday_off' => $isSaturdayHoliday,
                'is_holiday' => (bool) $matchingHoliday,
                'is_off' => $isHoliday,
                'is_today' => $isToday,
                'holiday_name' => $matchingHoliday?->name ?? ($isSunday ? 'Hari Minggu' : ($isSaturdayHoliday ? 'Hari Sabtu (Libur Akhir Pekan)' : null)),
                'holiday_type' => $matchingHoliday?->type ?? ($isWeekend ? 'weekend' : null),
                'holiday_type_name' => $matchingHoliday?->type_name ?? ($isWeekend ? 'Libur Akhir Pekan' : null),
                'holiday_description' => $matchingHoliday?->description ?? ($isSaturdayHoliday ? 'Sistem 5 Hari Sekolah: Sabtu & Minggu libur' : null),
            ];
        }

        $holidaysList = $holidays->map(fn ($h) => [
            'id' => $h->id,
            'name' => $h->name,
            'type' => $h->type,
            'type_name' => $h->type_name,
            'start_date' => $h->start_date->toDateString(),
            'end_date' => $h->end_date->toDateString(),
            'formatted_dates' => $h->formatted_dates,
            'description' => $h->description,
        ]);

        $prevDate = $currentDate->copy()->subMonth();
        $nextDate = $currentDate->copy()->addMonth();

        $calendar = [
            'month' => $month,
            'year' => $year,
            'month_name' => ($monthNames[$month] ?? '') . ' ' . $year,
            'is_current_month' => $month === $today->month && $year === $today->year,
            'prev_month' => $prevDate->month,
            'prev_year' => $prevDate->year,
            'next_month' => $nextDate->month,
            'next_year' => $nextDate->year,
            'first_day_of_week' => $firstDayOfWeek,
            'days_count' => (int) $daysCount,
            'days' => $days,
            'holidays' => $holidaysList,
            'effective_days' => (int) $effectiveDays,
            'holiday_days' => (int) $holidayDays,
            'total_days' => (int) $daysCount,
            'school_days_per_week' => $isSaturdayOff ? 5 : 6,
            'is_saturday_holiday' => $isSaturdayOff,
        ];

        return Inertia::render('calendar/public-index', [
            'calendar' => $calendar,
        ]);
    }

    /**
     * Public Contact Us Page (Menu Kontak).
     */
    public function contact(): Response
    {
        $schoolSetting = SchoolSetting::getSetting();

        $contactInfo = [
            'name' => $schoolSetting->name,
            'phone' => $schoolSetting->phone,
            'whatsapp' => $schoolSetting->whatsapp,
            'email' => $schoolSetting->email,
            'address' => $schoolSetting->address,
            'city' => $schoolSetting->city,
            'postal_code' => $schoolSetting->postal_code,
            'instagram' => $schoolSetting->instagram,
            'facebook' => $schoolSetting->facebook,
            'youtube' => $schoolSetting->youtube,
            'tiktok' => $schoolSetting->tiktok,
            'operating_hours' => $schoolSetting->operating_hours,
            'maps_embed_url' => $schoolSetting->maps_embed_url,
            'contact_description' => $schoolSetting->contact_description,
            'is_active' => (bool) ($schoolSetting->contact_active ?? true),
        ];

        return Inertia::render('contact/public-index', [
            'contactInfo' => $contactInfo,
        ]);
    }

    /**
     * Public School Profile Page (Menu Profil & Visi Misi).
     */
    public function profile(): Response
    {
        $schoolSetting = SchoolSetting::getSetting();

        $profileData = [
            'name' => $schoolSetting->name,
            'school_motto' => $schoolSetting->school_motto,
            'accreditation' => $schoolSetting->accreditation,
            'profile_description' => $schoolSetting->profile_description,
            'vision' => $schoolSetting->vision,
            'mission' => $schoolSetting->mission,
            'core_values' => $schoolSetting->core_values,
            'profile_image_url' => $schoolSetting->profile_image_url,
            'principal_name' => $schoolSetting->principal_name,
            'principal_photo_url' => $schoolSetting->principal_photo_url,
            'address' => $schoolSetting->address,
            'city' => $schoolSetting->city,
            'phone' => $schoolSetting->phone,
            'email' => $schoolSetting->email,
            'whatsapp' => $schoolSetting->whatsapp,
        ];

        return Inertia::render('profile/public-index', [
            'profile' => $profileData,
        ]);
    }

    /**
     * Public Teacher Profiles Page (Sub Menu Profil Guru).
     */
    public function teacherProfiles(Request $request): Response
    {
        TeacherProfile::ensureTableExists();

        $search = $request->input('search');
        $status = $request->input('status');

        $query = TeacherProfile::active()
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('homeroom_class', 'like', "%{$search}%")
                    ->orWhere('employment_status', 'like', "%{$search}%");
            });
        }

        if ($status && $status !== 'all') {
            $query->where('employment_status', $status);
        }

        $teachers = $query->paginate(12)->withQueryString();

        $statuses = TeacherProfile::active()
            ->select('employment_status')
            ->distinct()
            ->pluck('employment_status')
            ->filter()
            ->values();

        return Inertia::render('profile/public-teachers', [
            'teachers' => $teachers,
            'statuses' => $statuses,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
            ],
        ]);
    }
}
