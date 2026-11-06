<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TeacherProfileController extends Controller
{
    public const DEFAULT_STATUSES = [
        'PNS',
        'PPPK',
        'KKI',
        'Honorer',
        'GTY',
        'Tendik',
    ];

    /**
     * Display teacher profile management page for Publisher, Principal, and Admin.
     */
    public function index(Request $request): Response
    {
        TeacherProfile::ensureTableExists();

        $search = $request->input('search');
        $status = $request->input('status');

        $query = TeacherProfile::orderBy('sort_order')
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

        $existingStatuses = TeacherProfile::select('employment_status')
            ->distinct()
            ->pluck('employment_status')
            ->filter()
            ->toArray();

        $statuses = array_values(array_unique(array_merge(self::DEFAULT_STATUSES, $existingStatuses)));

        $classrooms = Classroom::orderBy('name')->pluck('name')->values();

        $stats = [
            'total' => TeacherProfile::count(),
            'active' => TeacherProfile::where('is_active', true)->count(),
            'pns_pppk' => TeacherProfile::whereIn('employment_status', ['PNS', 'PPPK'])->count(),
            'homeroom_count' => TeacherProfile::whereNotNull('homeroom_class')
                ->where('homeroom_class', '!=', '')
                ->where('homeroom_class', '!=', '-')
                ->count(),
        ];

        return Inertia::render('publisher/teacher-profiles', [
            'teachers' => $teachers,
            'statuses' => $statuses,
            'classrooms' => $classrooms,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
            ],
        ]);
    }

    /**
     * Store a newly created teacher profile with compressed photo.
     */
    public function store(Request $request): RedirectResponse
    {
        TeacherProfile::ensureTableExists();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'subject' => 'nullable|string|max:150',
            'homeroom_class' => 'nullable|string|max:100',
            'employment_status' => 'required|string|max:50',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'photo_base64' => 'nullable|string',
            'photo' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:10240',
        ], [
            'name.required' => 'Nama lengkap guru wajib diisi.',
            'employment_status.required' => 'Status kepegawaian (PNS, PPPK, KKI, dll) wajib diisi.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();

        $photoPath = null;
        $fileSize = 0;

        if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
            $res = $this->compressAndSavePhotoBytes(file_get_contents($request->file('photo')->getRealPath()));
            if ($res) {
                $photoPath = $res['path'];
                $fileSize = $res['size'];
            }
        } elseif (! empty($validated['photo_base64'])) {
            $res = $this->compressAndSaveBase64Photo($validated['photo_base64']);
            if ($res) {
                $photoPath = $res['path'];
                $fileSize = $res['size'];
            }
        }

        $maxOrder = (int) TeacherProfile::max('sort_order');

        TeacherProfile::create([
            'name' => $validated['name'],
            'subject' => $validated['subject'] ?: 'Guru Kelas',
            'homeroom_class' => (! empty($validated['homeroom_class']) && $validated['homeroom_class'] !== '-')
                ? $validated['homeroom_class']
                : null,
            'employment_status' => $validated['employment_status'],
            'photo_path' => $photoPath,
            'file_size' => $fileSize,
            'sort_order' => $validated['sort_order'] ?? ($maxOrder + 1),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', "Profil guru {$validated['name']} berhasil ditambahkan.");
    }

    /**
     * Update an existing teacher profile.
     */
    public function update(Request $request, TeacherProfile $teacherProfile): RedirectResponse
    {
        TeacherProfile::ensureTableExists();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'subject' => 'nullable|string|max:150',
            'homeroom_class' => 'nullable|string|max:100',
            'employment_status' => 'required|string|max:50',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'photo_base64' => 'nullable|string',
            'photo' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();

        $photoPath = $teacherProfile->photo_path;
        $fileSize = $teacherProfile->file_size;

        if ($request->boolean('remove_photo')) {
            if ($photoPath && Storage::disk('public')->exists($photoPath)) {
                Storage::disk('public')->delete($photoPath);
            }
            $photoPath = null;
            $fileSize = 0;
        }

        if ($request->hasFile('photo') && $request->file('photo')->isValid()) {
            $res = $this->compressAndSavePhotoBytes(file_get_contents($request->file('photo')->getRealPath()));
            if ($res) {
                if ($photoPath && Storage::disk('public')->exists($photoPath)) {
                    Storage::disk('public')->delete($photoPath);
                }
                $photoPath = $res['path'];
                $fileSize = $res['size'];
            }
        } elseif (! empty($validated['photo_base64'])) {
            $res = $this->compressAndSaveBase64Photo($validated['photo_base64']);
            if ($res) {
                if ($photoPath && Storage::disk('public')->exists($photoPath)) {
                    Storage::disk('public')->delete($photoPath);
                }
                $photoPath = $res['path'];
                $fileSize = $res['size'];
            }
        }

        $teacherProfile->update([
            'name' => $validated['name'],
            'subject' => $validated['subject'] ?: 'Guru Kelas',
            'homeroom_class' => (! empty($validated['homeroom_class']) && $validated['homeroom_class'] !== '-')
                ? $validated['homeroom_class']
                : null,
            'employment_status' => $validated['employment_status'],
            'photo_path' => $photoPath,
            'file_size' => $fileSize,
            'sort_order' => $validated['sort_order'] ?? $teacherProfile->sort_order,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', "Profil guru {$teacherProfile->name} berhasil diperbarui.");
    }

    /**
     * Delete a teacher profile and its photo from storage.
     */
    public function destroy(TeacherProfile $teacherProfile): RedirectResponse
    {
        TeacherProfile::ensureTableExists();

        if ($teacherProfile->photo_path && Storage::disk('public')->exists($teacherProfile->photo_path)) {
            Storage::disk('public')->delete($teacherProfile->photo_path);
        }

        $name = $teacherProfile->name;
        $teacherProfile->delete();

        return back()->with('success', "Profil guru {$name} berhasil dihapus.");
    }

    /**
     * Sync teacher profiles from Master Data Guru (users table) & Classrooms.
     */
    public function syncFromMaster(): RedirectResponse
    {
        TeacherProfile::ensureTableExists();

        $users = User::with('homeroomClassrooms')
            ->whereIn('role', ['principal', 'teacher'])
            ->orderByRaw("CASE WHEN role = 'principal' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get();

        $added = 0;
        $updated = 0;
        $maxOrder = (int) TeacherProfile::max('sort_order');

        foreach ($users as $user) {
            $homeroomNames = $user->homeroomClassrooms->pluck('name')->implode(', ');
            $existing = TeacherProfile::where('user_id', $user->id)
                ->orWhere('name', $user->name)
                ->first();

            if ($existing) {
                $existing->update([
                    'user_id' => $user->id,
                    'homeroom_class' => $homeroomNames ?: $existing->homeroom_class,
                ]);
                $updated++;
            } else {
                $maxOrder++;
                TeacherProfile::create([
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'subject' => $user->role === 'principal'
                        ? 'Kepala Sekolah'
                        : ($homeroomNames ? 'Guru Kelas' : 'Guru Mata Pelajaran'),
                    'homeroom_class' => $homeroomNames ?: null,
                    'employment_status' => 'PNS',
                    'sort_order' => $maxOrder,
                    'is_active' => true,
                ]);
                $added++;
            }
        }

        return back()->with('success', "Sinkronisasi selesai: {$added} profil guru baru ditambahkan dan {$updated} data diperbarui dari Master Data Guru.");
    }

    protected function compressAndSaveBase64Photo(string $base64Data): ?array
    {
        if (str_contains($base64Data, ',')) {
            $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        }

        $decoded = base64_decode($base64Data);
        if ($decoded === false || strlen($decoded) === 0) {
            return null;
        }

        return $this->compressAndSavePhotoBytes($decoded);
    }

    protected function compressAndSavePhotoBytes(string $rawBytes, int $maxDimension = 900, int $quality = 75): ?array
    {
        if (function_exists('imagecreatefromstring')) {
            $srcImg = @imagecreatefromstring($rawBytes);
            if ($srcImg !== false) {
                $srcWidth = imagesx($srcImg);
                $srcHeight = imagesy($srcImg);

                $targetWidth = $srcWidth;
                $targetHeight = $srcHeight;

                if ($srcWidth > $maxDimension || $srcHeight > $maxDimension) {
                    if ($srcWidth >= $srcHeight) {
                        $targetWidth = $maxDimension;
                        $targetHeight = (int) max(1, round(($srcHeight / $srcWidth) * $maxDimension));
                    } else {
                        $targetHeight = $maxDimension;
                        $targetWidth = (int) max(1, round(($srcWidth / $srcHeight) * $maxDimension));
                    }
                }

                $dstImg = imagecreatetruecolor($targetWidth, $targetHeight);
                $white = imagecolorallocate($dstImg, 255, 255, 255);
                imagefill($dstImg, 0, 0, $white);

                imagecopyresampled(
                    $dstImg,
                    $srcImg,
                    0,
                    0,
                    0,
                    0,
                    $targetWidth,
                    $targetHeight,
                    $srcWidth,
                    $srcHeight
                );

                ob_start();
                imagejpeg($dstImg, null, $quality);
                $compressedBytes = ob_get_clean();

                imagedestroy($srcImg);
                imagedestroy($dstImg);

                if ($compressedBytes !== false && strlen($compressedBytes) > 0) {
                    $fileName = 'teacher_photos/' . Str::random(40) . '.jpg';
                    Storage::disk('public')->put($fileName, $compressedBytes);

                    return [
                        'path' => $fileName,
                        'size' => strlen($compressedBytes),
                    ];
                }
            }
        }

        $fileName = 'teacher_photos/' . Str::random(40) . '.jpg';
        Storage::disk('public')->put($fileName, $rawBytes);

        return [
            'path' => $fileName,
            'size' => strlen($rawBytes),
        ];
    }
}

