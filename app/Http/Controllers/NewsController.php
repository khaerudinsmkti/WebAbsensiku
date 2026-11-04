<?php

namespace App\Http\Controllers;

use App\Models\News;
use App\Models\NewsCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class NewsController extends Controller
{
    /**
     * Display a listing of news articles for management (Publisher & Admin).
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $categoryId = $request->input('category_id');
        $status = $request->input('status'); // all, published, draft

        $query = News::with(['category', 'author'])
            ->orderByDesc('created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        if ($categoryId && $categoryId !== 'all') {
            $query->where('category_id', $categoryId);
        }

        if ($status === 'published') {
            $query->where('is_published', true);
        } elseif ($status === 'draft') {
            $query->where('is_published', false);
        }

        $newsList = $query->paginate(15)->withQueryString();

        $categories = NewsCategory::withCount('news')->get();

        $stats = [
            'total' => News::count(),
            'published' => News::where('is_published', true)->count(),
            'draft' => News::where('is_published', false)->count(),
            'total_views' => (int) News::sum('views_count'),
        ];

        return Inertia::render('news/index', [
            'news' => $newsList,
            'categories' => $categories,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
                'category_id' => $categoryId ?? 'all',
                'status' => $status ?? 'all',
            ],
        ]);
    }

    /**
     * Store a newly created news article.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->all();

        // Validasi dan sanitasi file binary vs base64
        $rules = [
            'title' => 'required|string|max:255',
            'category_id' => 'nullable|exists:news_categories,id',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'required|string',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
            'images_base64' => 'nullable|array',
            'images_base64.*' => 'string',
            'attachments_base64' => 'nullable|array',
            'attachments_base64.*' => 'string',
            'attachments_names' => 'nullable|array',
            'attachments_names.*' => 'string',
        ];

        // Validasi file biner jika dikirim lewat multipart
        if ($request->hasFile('images')) {
            $rules['images.*'] = 'file|mimes:jpeg,png,jpg,webp,gif|max:10240';
        }
        if ($request->hasFile('attachments')) {
            $rules['attachments.*'] = 'file|mimes:pdf|max:20480';
        }

        // Fallback untuk single file legacy jika ada form yang masih mengirim single
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            $rules['image'] = 'file|mimes:jpeg,png,jpg,webp,gif|max:10240';
        }
        if ($request->hasFile('attachment') && $request->file('attachment')->isValid()) {
            $rules['attachment'] = 'file|mimes:pdf|max:20480';
        }

        $validator = Validator::make($data, $rules, [
            'images.*.mimes' => 'Format file gambar harus berupa: JPG, JPEG, PNG, WebP, atau GIF.',
            'images.*.max' => 'Ukuran setiap gambar maksimal 10 MB.',
            'attachments.*.mimes' => 'Format berkas lampiran harus berupa dokumen PDF.',
            'attachments.*.max' => 'Ukuran setiap lampiran PDF maksimal 20 MB.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();

        // 1. Simpan multiple images
        $imagesList = [];

        // Single image legacy binary / base64
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            $imagesList[] = $request->file('image')->store('news_images', 'public');
        } elseif ($request->filled('image_base64')) {
            $p = $this->storeBase64Image($request->input('image_base64'));
            if ($p) {
                $imagesList[] = $p;
            }
        }

        // Multiple binary images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $imgFile) {
                if ($imgFile->isValid()) {
                    $imagesList[] = $imgFile->store('news_images', 'public');
                }
            }
        }

        // Multiple base64 compressed images (dari client-side compression)
        if (! empty($validated['images_base64']) && is_array($validated['images_base64'])) {
            foreach ($validated['images_base64'] as $b64) {
                $p = $this->storeBase64Image($b64);
                if ($p) {
                    $imagesList[] = $p;
                }
            }
        }

        $imagePath = $imagesList[0] ?? null;

        // 2. Simpan multiple attachments
        $attachmentsList = [];

        // Single attachment legacy binary / base64
        if ($request->hasFile('attachment') && $request->file('attachment')->isValid()) {
            $file = $request->file('attachment');
            $attachmentsList[] = [
                'path' => $file->store('news_attachments', 'public'),
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ];
        } elseif ($request->filled('attachment_base64')) {
            $pdfInfo = $this->storeBase64Pdf(
                $request->input('attachment_base64'),
                $request->input('attachment_name')
            );
            if ($pdfInfo) {
                $attachmentsList[] = $pdfInfo;
            }
        }

        // Multiple binary attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $attFile) {
                if ($attFile->isValid()) {
                    $attachmentsList[] = [
                        'path' => $attFile->store('news_attachments', 'public'),
                        'name' => $attFile->getClientOriginalName(),
                        'size' => $attFile->getSize(),
                    ];
                }
            }
        }

        // Multiple base64 attachments
        if (! empty($validated['attachments_base64']) && is_array($validated['attachments_base64'])) {
            $names = $validated['attachments_names'] ?? [];
            foreach ($validated['attachments_base64'] as $idx => $b64) {
                $origName = $names[$idx] ?? ('dokumen-' . ($idx + 1) . '.pdf');
                $pdfInfo = $this->storeBase64Pdf($b64, $origName);
                if ($pdfInfo) {
                    $attachmentsList[] = $pdfInfo;
                }
            }
        }

        $primaryAttachment = $attachmentsList[0] ?? null;

        $isPublished = $request->boolean('is_published', true);
        $publishedAt = $validated['published_at'] ?? ($isPublished ? now() : null);

        News::create([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']) . '-' . Str::random(5),
            'category_id' => $validated['category_id'] ?? null,
            'user_id' => $request->user()->id,
            'excerpt' => $validated['excerpt'] ?: Str::limit(strip_tags($validated['content']), 160),
            'content' => $validated['content'],
            'image_path' => $imagePath,
            'images' => ! empty($imagesList) ? $imagesList : null,
            'attachment_path' => $primaryAttachment['path'] ?? null,
            'attachment_name' => $primaryAttachment['name'] ?? null,
            'attachment_size' => $primaryAttachment['size'] ?? null,
            'attachments' => ! empty($attachmentsList) ? $attachmentsList : null,
            'is_published' => $isPublished,
            'published_at' => $publishedAt,
        ]);

        return back()->with('success', 'Berita berhasil ditambahkan dan disimpan.');
    }

    /**
     * Update the specified news article.
     */
    public function update(Request $request, News $news): RedirectResponse
    {
        $data = $request->all();

        $rules = [
            'title' => 'required|string|max:255',
            'category_id' => 'nullable|exists:news_categories,id',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'required|string',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
            'existing_images' => 'nullable|array',
            'existing_images.*' => 'string',
            'existing_attachments' => 'nullable|array',
            'images_base64' => 'nullable|array',
            'images_base64.*' => 'string',
            'attachments_base64' => 'nullable|array',
            'attachments_base64.*' => 'string',
            'attachments_names' => 'nullable|array',
            'attachments_names.*' => 'string',
        ];

        if ($request->hasFile('images')) {
            $rules['images.*'] = 'file|mimes:jpeg,png,jpg,webp,gif|max:10240';
        }
        if ($request->hasFile('attachments')) {
            $rules['attachments.*'] = 'file|mimes:pdf|max:20480';
        }

        $validator = Validator::make($data, $rules, [
            'images.*.mimes' => 'Format file gambar harus berupa: JPG, JPEG, PNG, WebP, atau GIF.',
            'images.*.max' => 'Ukuran setiap gambar maksimal 10 MB.',
            'attachments.*.mimes' => 'Format berkas lampiran harus berupa dokumen PDF.',
            'attachments.*.max' => 'Ukuran setiap lampiran PDF maksimal 20 MB.',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();

        // 1. Process Images
        // Current stored images
        $currentImages = is_array($news->images) ? $news->images : ($news->image_path ? [$news->image_path] : []);
        $keptImages = [];

        if ($request->has('existing_images')) {
            $keptImagesInput = (array) $request->input('existing_images', []);
            foreach ($keptImagesInput as $img) {
                if (is_string($img) && in_array($img, $currentImages)) {
                    $keptImages[] = $img;
                }
            }
            // Delete removed images from disk
            foreach ($currentImages as $oldImg) {
                if (! in_array($oldImg, $keptImages)) {
                    if (Storage::disk('public')->exists($oldImg)) {
                        Storage::disk('public')->delete($oldImg);
                    }
                }
            }
        } elseif ($request->boolean('remove_image')) {
            foreach ($currentImages as $oldImg) {
                if (Storage::disk('public')->exists($oldImg)) {
                    Storage::disk('public')->delete($oldImg);
                }
            }
            $keptImages = [];
        } else {
            $keptImages = $currentImages;
        }

        $newImages = [];
        // Single image legacy
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            $newImages[] = $request->file('image')->store('news_images', 'public');
        } elseif ($request->filled('image_base64')) {
            $p = $this->storeBase64Image($request->input('image_base64'));
            if ($p) {
                $newImages[] = $p;
            }
        }

        // Multiple binary images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $imgFile) {
                if ($imgFile->isValid()) {
                    $newImages[] = $imgFile->store('news_images', 'public');
                }
            }
        }

        // Multiple base64 compressed images
        if (! empty($validated['images_base64']) && is_array($validated['images_base64'])) {
            foreach ($validated['images_base64'] as $b64) {
                $p = $this->storeBase64Image($b64);
                if ($p) {
                    $newImages[] = $p;
                }
            }
        }

        $finalImages = array_values(array_unique(array_merge($keptImages, $newImages)));
        $imagePath = $finalImages[0] ?? null;

        // 2. Process Attachments
        $currentAttachments = [];
        if (! empty($news->attachments) && is_array($news->attachments)) {
            $currentAttachments = $news->attachments;
        } elseif ($news->attachment_path) {
            $currentAttachments = [
                [
                    'path' => $news->attachment_path,
                    'name' => $news->attachment_name ?? basename($news->attachment_path),
                    'size' => $news->attachment_size ?? 0,
                ],
            ];
        }

        $keptAttachments = [];
        if ($request->has('existing_attachments')) {
            $keptAttachmentsInput = (array) $request->input('existing_attachments', []);
            $keptPaths = [];
            foreach ($keptAttachmentsInput as $item) {
                $path = is_array($item) ? ($item['path'] ?? null) : $item;
                if ($path) {
                    $keptPaths[] = $path;
                }
            }

            foreach ($currentAttachments as $att) {
                $p = $att['path'] ?? null;
                if ($p && in_array($p, $keptPaths)) {
                    $keptAttachments[] = $att;
                } else {
                    if ($p && Storage::disk('public')->exists($p)) {
                        Storage::disk('public')->delete($p);
                    }
                }
            }
        } elseif ($request->boolean('remove_attachment')) {
            foreach ($currentAttachments as $att) {
                $p = $att['path'] ?? null;
                if ($p && Storage::disk('public')->exists($p)) {
                    Storage::disk('public')->delete($p);
                }
            }
            $keptAttachments = [];
        } else {
            $keptAttachments = $currentAttachments;
        }

        $newAttachments = [];
        // Single attachment legacy
        if ($request->hasFile('attachment') && $request->file('attachment')->isValid()) {
            $file = $request->file('attachment');
            $newAttachments[] = [
                'path' => $file->store('news_attachments', 'public'),
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ];
        } elseif ($request->filled('attachment_base64')) {
            $pdfInfo = $this->storeBase64Pdf(
                $request->input('attachment_base64'),
                $request->input('attachment_name')
            );
            if ($pdfInfo) {
                $newAttachments[] = $pdfInfo;
            }
        }

        // Multiple binary attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $attFile) {
                if ($attFile->isValid()) {
                    $newAttachments[] = [
                        'path' => $attFile->store('news_attachments', 'public'),
                        'name' => $attFile->getClientOriginalName(),
                        'size' => $attFile->getSize(),
                    ];
                }
            }
        }

        // Multiple base64 attachments
        if (! empty($validated['attachments_base64']) && is_array($validated['attachments_base64'])) {
            $names = $validated['attachments_names'] ?? [];
            foreach ($validated['attachments_base64'] as $idx => $b64) {
                $origName = $names[$idx] ?? ('dokumen-' . ($idx + 1) . '.pdf');
                $pdfInfo = $this->storeBase64Pdf($b64, $origName);
                if ($pdfInfo) {
                    $newAttachments[] = $pdfInfo;
                }
            }
        }

        $finalAttachments = array_merge($keptAttachments, $newAttachments);
        $primaryAttachment = $finalAttachments[0] ?? null;

        $isPublished = $request->boolean('is_published');
        $publishedAt = $validated['published_at'] ?? ($isPublished && ! $news->published_at ? now() : $news->published_at);

        $news->update([
            'title' => $validated['title'],
            'category_id' => $validated['category_id'] ?? null,
            'excerpt' => $validated['excerpt'] ?: Str::limit(strip_tags($validated['content']), 160),
            'content' => $validated['content'],
            'image_path' => $imagePath,
            'images' => ! empty($finalImages) ? $finalImages : null,
            'attachment_path' => $primaryAttachment['path'] ?? null,
            'attachment_name' => $primaryAttachment['name'] ?? null,
            'attachment_size' => $primaryAttachment['size'] ?? null,
            'attachments' => ! empty($finalAttachments) ? $finalAttachments : null,
            'is_published' => $isPublished,
            'published_at' => $isPublished ? $publishedAt : null,
        ]);

        return back()->with('success', 'Berita berhasil diperbarui.');
    }

    /**
     * Sanitize upload fields from request to avoid Laravel validation failing with 'uploaded'
     * when empty files or UPLOAD_ERR_NO_FILE are sent by multipart/form-data,
     * or when temporary upload directory in Windows fails while base64 fallback is present.
     */
    protected function sanitizeUploadedFiles(Request $request): void
    {
        // Handle image sanitization & base64 fallback
        if ($request->files->has('image')) {
            $file = $request->files->get('image');
            if ($file instanceof UploadedFile) {
                if ($file->getError() === UPLOAD_ERR_NO_FILE) {
                    $request->files->remove('image');
                    $request->request->remove('image');
                } elseif (! $file->isValid() && $request->filled('image_base64')) {
                    // Remove binary file so Laravel validator doesn't fail with 'image.uploaded'
                    $request->files->remove('image');
                    $request->request->remove('image');
                }
            }
        }

        if ($request->has('image')) {
            $val = $request->input('image');
            if ($val === '' || $val === 'null' || $val === 'undefined') {
                $request->request->remove('image');
                $request->files->remove('image');
            }
        }

        // Handle attachment sanitization & base64 fallback
        if ($request->files->has('attachment')) {
            $file = $request->files->get('attachment');
            if ($file instanceof UploadedFile) {
                if ($file->getError() === UPLOAD_ERR_NO_FILE) {
                    $request->files->remove('attachment');
                    $request->request->remove('attachment');
                } elseif (! $file->isValid() && $request->filled('attachment_base64')) {
                    $request->files->remove('attachment');
                    $request->request->remove('attachment');
                }
            }
        }

        if ($request->has('attachment')) {
            $val = $request->input('attachment');
            if ($val === '' || $val === 'null' || $val === 'undefined') {
                $request->request->remove('attachment');
                $request->files->remove('attachment');
            }
        }
    }

    /**
     * Store image from base64 data URL.
     */
    protected function storeBase64Image(string $base64Data): ?string
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
            $data = substr($base64Data, strpos($base64Data, ',') + 1);
            $ext = strtolower($type[1]);
            if ($ext === 'jpeg') {
                $ext = 'jpg';
            }
            if (! in_array($ext, ['jpg', 'png', 'gif', 'webp'])) {
                $ext = 'jpg';
            }

            $decoded = base64_decode($data);
            if ($decoded === false) {
                return null;
            }

            $fileName = 'news_images/' . Str::random(40) . '.' . $ext;
            Storage::disk('public')->put($fileName, $decoded);

            return $fileName;
        }

        return null;
    }

    /**
     * Store PDF from base64 data URL.
     */
    protected function storeBase64Pdf(string $base64Data, ?string $originalName = null): ?array
    {
        if (str_contains($base64Data, ';base64,')) {
            $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        }

        $decoded = base64_decode($base64Data);
        if ($decoded === false) {
            return null;
        }

        $fileName = 'news_attachments/' . Str::random(40) . '.pdf';
        Storage::disk('public')->put($fileName, $decoded);

        return [
            'path' => $fileName,
            'name' => $originalName ?: 'dokumen-' . time() . '.pdf',
            'size' => strlen($decoded),
        ];
    }

    /**
     * Remove the specified news article.
     */
    public function destroy(News $news): RedirectResponse
    {
        // Hapus single image jika ada
        if ($news->image_path && Storage::disk('public')->exists($news->image_path)) {
            Storage::disk('public')->delete($news->image_path);
        }

        // Hapus multiple images jika ada
        if (! empty($news->images) && is_array($news->images)) {
            foreach ($news->images as $img) {
                if ($img && Storage::disk('public')->exists($img)) {
                    Storage::disk('public')->delete($img);
                }
            }
        }

        // Hapus single attachment jika ada
        if ($news->attachment_path && Storage::disk('public')->exists($news->attachment_path)) {
            Storage::disk('public')->delete($news->attachment_path);
        }

        // Hapus multiple attachments jika ada
        if (! empty($news->attachments) && is_array($news->attachments)) {
            foreach ($news->attachments as $att) {
                $p = $att['path'] ?? null;
                if ($p && Storage::disk('public')->exists($p)) {
                    Storage::disk('public')->delete($p);
                }
            }
        }

        $news->delete();

        return back()->with('success', 'Berita berhasil dihapus.');
    }

    /**
     * Store a news category.
     */
    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:news_categories,name',
            'color' => 'nullable|string|max:30',
            'description' => 'nullable|string|max:255',
        ]);

        NewsCategory::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'color' => $validated['color'] ?? 'blue',
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', "Kategori '{$validated['name']}' berhasil ditambahkan.");
    }

    /**
     * Destroy a news category.
     */
    public function destroyCategory(NewsCategory $category): RedirectResponse
    {
        $name = $category->name;
        $category->delete();

        return back()->with('success', "Kategori '{$name}' berhasil dihapus.");
    }
}

