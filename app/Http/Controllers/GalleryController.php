<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class GalleryController extends Controller
{
    public const DEFAULT_CATEGORIES = [
        'Kegiatan Sekolah',
        'Ekstrakurikuler',
        'Prestasi & Lomba',
        'Upacara & Peringatan',
        'Olahraga & Seni',
        'Kunjungan & Sosial',
    ];

    /**
     * Display gallery management page for Publisher, Principal, and Admin.
     */
    public function index(Request $request): Response
    {
        Gallery::ensureTableExists();

        $search = $request->input('search');
        $category = $request->input('category');
        $status = $request->input('status');

        $query = Gallery::with('author:id,name,role')
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

        if ($status === 'published') {
            $query->where('is_published', true);
        } elseif ($status === 'draft') {
            $query->where('is_published', false);
        }

        $galleries = $query->paginate(12)->withQueryString();

        $existingCategories = Gallery::select('category')
            ->distinct()
            ->pluck('category')
            ->filter()
            ->toArray();

        $categories = array_values(array_unique(array_merge(self::DEFAULT_CATEGORIES, $existingCategories)));

        $totalPhotos = 0;
        foreach (Gallery::select('images', 'image_path')->get() as $g) {
            if (! empty($g->images) && is_array($g->images)) {
                $totalPhotos += count($g->images);
            } elseif ($g->image_path) {
                $totalPhotos += 1;
            }
        }

        $totalBytes = (int) Gallery::sum('file_size');

        $stats = [
            'total_albums' => Gallery::count(),
            'published_albums' => Gallery::where('is_published', true)->count(),
            'total_photos' => $totalPhotos,
            'total_size_formatted' => $this->formatBytes($totalBytes),
        ];

        return Inertia::render('gallery/index', [
            'galleries' => $galleries,
            'categories' => $categories,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
                'category' => $category ?? 'all',
                'status' => $status ?? 'all',
            ],
        ]);
    }

    /**
     * Store a newly created gallery activity with compressed photos.
     */
    public function store(Request $request): RedirectResponse
    {
        Gallery::ensureTableExists();

        $rules = [
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
            'activity_date' => 'nullable|date',
            'is_published' => 'boolean',
            'images_base64' => 'nullable|array',
            'images_base64.*' => 'string',
        ];

        if ($request->hasFile('images')) {
            $rules['images.*'] = 'file|mimes:jpeg,png,jpg,webp,gif|max:15360';
        }

        $validator = Validator::make($request->all(), $rules, [
            'title.required' => 'Judul kegiatan wajib diisi.',
            'images.*.mimes' => 'Format foto harus JPG, JPEG, PNG, WebP, atau GIF.',
            'images.*.max' => 'Ukuran asli setiap foto maksimal 15 MB.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();

        $storedPaths = [];
        $totalBytes = 0;

        // 1. Process multipart binary files (if any)
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $imgFile) {
                if ($imgFile->isValid()) {
                    $res = $this->compressAndSaveRawImageBytes(file_get_contents($imgFile->getRealPath()));
                    if ($res) {
                        $storedPaths[] = $res['path'];
                        $totalBytes += $res['size'];
                    }
                }
            }
        }

        // 2. Process base64 compressed images from client
        if (! empty($validated['images_base64']) && is_array($validated['images_base64'])) {
            foreach ($validated['images_base64'] as $b64) {
                $res = $this->compressAndStoreBase64Image($b64);
                if ($res) {
                    $storedPaths[] = $res['path'];
                    $totalBytes += $res['size'];
                }
            }
        }

        if (empty($storedPaths)) {
            return back()->withErrors(['images' => 'Silakan pilih minimal 1 foto kegiatan untuk diunggah.'])->withInput();
        }

        Gallery::create([
            'title' => $validated['title'],
            'category' => $validated['category'] ?: 'Kegiatan Sekolah',
            'description' => $validated['description'] ?? null,
            'activity_date' => $validated['activity_date'] ?: now()->toDateString(),
            'image_path' => $storedPaths[0],
            'images' => $storedPaths,
            'file_size' => $totalBytes,
            'is_published' => $request->boolean('is_published', true),
            'user_id' => $request->user()?->id,
        ]);

        return back()->with('success', 'Galeri foto kegiatan berhasil disimpan dan telah dikompresi secara otomatis.');
    }

    /**
     * Update an existing gallery activity.
     */
    public function update(Request $request, Gallery $gallery): RedirectResponse
    {
        Gallery::ensureTableExists();

        $rules = [
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
            'activity_date' => 'nullable|date',
            'is_published' => 'boolean',
            'existing_images' => 'nullable|array',
            'existing_images.*' => 'string',
            'images_base64' => 'nullable|array',
            'images_base64.*' => 'string',
        ];

        if ($request->hasFile('images')) {
            $rules['images.*'] = 'file|mimes:jpeg,png,jpg,webp,gif|max:15360';
        }

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();

        $currentImages = is_array($gallery->images) ? $gallery->images : ($gallery->image_path ? [$gallery->image_path] : []);
        $keptImages = [];

        if ($request->has('existing_images')) {
            $keptInput = (array) $request->input('existing_images', []);
            foreach ($keptInput as $img) {
                if (is_string($img) && in_array($img, $currentImages)) {
                    $keptImages[] = $img;
                }
            }

            foreach ($currentImages as $oldImg) {
                if (! in_array($oldImg, $keptImages) && Storage::disk('public')->exists($oldImg)) {
                    Storage::disk('public')->delete($oldImg);
                }
            }
        } else {
            $keptImages = $currentImages;
        }

        $newPaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $imgFile) {
                if ($imgFile->isValid()) {
                    $res = $this->compressAndSaveRawImageBytes(file_get_contents($imgFile->getRealPath()));
                    if ($res) {
                        $newPaths[] = $res['path'];
                    }
                }
            }
        }

        if (! empty($validated['images_base64']) && is_array($validated['images_base64'])) {
            foreach ($validated['images_base64'] as $b64) {
                $res = $this->compressAndStoreBase64Image($b64);
                if ($res) {
                    $newPaths[] = $res['path'];
                }
            }
        }

        $finalImages = array_values(array_unique(array_merge($keptImages, $newPaths)));

        if (empty($finalImages)) {
            return back()->withErrors(['images' => 'Galeri harus memiliki minimal 1 foto kegiatan.'])->withInput();
        }

        $totalBytes = 0;
        foreach ($finalImages as $path) {
            if (Storage::disk('public')->exists($path)) {
                $totalBytes += Storage::disk('public')->size($path);
            }
        }

        $gallery->update([
            'title' => $validated['title'],
            'category' => $validated['category'] ?: 'Kegiatan Sekolah',
            'description' => $validated['description'] ?? null,
            'activity_date' => $validated['activity_date'] ?: ($gallery->activity_date?->toDateString() ?? now()->toDateString()),
            'image_path' => $finalImages[0],
            'images' => $finalImages,
            'file_size' => $totalBytes,
            'is_published' => $request->boolean('is_published', true),
        ]);

        return back()->with('success', 'Data galeri kegiatan berhasil diperbarui.');
    }

    /**
     * Delete a gallery activity and remove its photos from disk.
     */
    public function destroy(Gallery $gallery): RedirectResponse
    {
        Gallery::ensureTableExists();

        $allImages = is_array($gallery->images) ? $gallery->images : [];
        if ($gallery->image_path && ! in_array($gallery->image_path, $allImages)) {
            $allImages[] = $gallery->image_path;
        }

        foreach ($allImages as $img) {
            if ($img && Storage::disk('public')->exists($img)) {
                Storage::disk('public')->delete($img);
            }
        }

        $gallery->delete();

        return back()->with('success', 'Galeri kegiatan beserta file fotonya berhasil dihapus dari server.');
    }

    /**
     * Decode base64 image string, compress via GD, and save to disk.
     *
     * @return array{path: string, size: int}|null
     */
    protected function compressAndStoreBase64Image(string $base64Data): ?array
    {
        if (str_contains($base64Data, ',')) {
            $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        }

        $decoded = base64_decode($base64Data);
        if ($decoded === false || strlen($decoded) === 0) {
            return null;
        }

        return $this->compressAndSaveRawImageBytes($decoded);
    }

    /**
     * Resize (max 1280px) and compress image bytes using PHP GD to save server disk capacity.
     *
     * @return array{path: string, size: int}|null
     */
    protected function compressAndSaveRawImageBytes(string $rawBytes, int $maxDimension = 1280, int $quality = 75): ?array
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
                // Fill white background in case source PNG/WebP has transparency
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
                    $fileName = 'galleries/' . Str::random(40) . '.jpg';
                    Storage::disk('public')->put($fileName, $compressedBytes);

                    return [
                        'path' => $fileName,
                        'size' => strlen($compressedBytes),
                    ];
                }
            }
        }

        // Fallback if GD fails
        $fileName = 'galleries/' . Str::random(40) . '.jpg';
        Storage::disk('public')->put($fileName, $rawBytes);

        return [
            'path' => $fileName,
            'size' => strlen($rawBytes),
        ];
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 KB';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 1) . ' ' . $units[$i];
    }
}

