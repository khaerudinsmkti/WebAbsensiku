<?php

namespace App\Http\Controllers;

use App\Models\News;
use App\Models\NewsCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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
        if (! $request->user()?->hasPermission('news', 'view')) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat modul berita.');
        }

        News::ensureInstagramColumn();

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

        $perPage = (int) $request->input('per_page', 6);
        if (! in_array($perPage, [6, 12, 18, 24, 30, 60])) {
            $perPage = 6;
        }

        $newsList = $query->paginate($perPage)->withQueryString();

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
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created news article.
     */
    public function store(Request $request): RedirectResponse
    {
        if (! $request->user()?->hasPermission('news', 'create')) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuat berita baru.');
        }

        News::ensureInstagramColumn();

        $data = $request->all();

        // Validasi dan sanitasi file binary vs base64
        $rules = [
            'title' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:news_categories,id',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'nullable|string',
            'instagram_url' => 'nullable|string|max:500',
            'youtube_url' => 'nullable|string|max:500',
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

        // Auto-extract metadata from Instagram URL if instagram_url is provided and title/content/images are missing
        if (! empty($validated['instagram_url'])) {
            $needMeta = empty($validated['title']) || empty($validated['content']) || (empty($validated['images_base64']) && ! $request->hasFile('images') && ! $request->hasFile('image'));
            if ($needMeta) {
                $igResponse = $this->fetchInstagram(new Request(['url' => $validated['instagram_url']]));
                if ($igResponse->getStatusCode() === 200) {
                    $igData = $igResponse->getData(true);
                    $validated['instagram_url'] = $igData['clean_url'] ?? $validated['instagram_url'];
                    if (empty($validated['title'])) {
                        $validated['title'] = $igData['title'] ?? 'Update Informasi Instagram Sekolah';
                    }
                    if (empty($validated['content'])) {
                        $validated['content'] = $igData['caption'] ?: 'Simak informasi terbaru dari Instagram resmi sekolah melalui postingan terlampir.';
                    }
                    if (empty($validated['excerpt']) && ! empty($igData['excerpt'])) {
                        $validated['excerpt'] = $igData['excerpt'];
                    }
                    if (empty($validated['images_base64']) && ! empty($igData['image_base64'])) {
                        $validated['images_base64'] = [$igData['image_base64']];
                    }
                }
            }
        }

        if (empty($validated['title']) || empty($validated['content'])) {
            return back()->withErrors([
                'title' => empty($validated['title']) ? 'Judul berita wajib diisi.' : null,
                'content' => empty($validated['content']) ? 'Isi berita wajib diisi.' : null,
            ])->withInput();
        }

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

        // Auto-fetch YouTube thumbnail as cover if no cover image uploaded
        if (empty($imagesList) && ! empty($validated['youtube_url'])) {
            $ytThumbPath = $this->downloadAndStoreYouTubeThumbnail($validated['youtube_url']);
            if ($ytThumbPath) {
                $imagesList[] = $ytThumbPath;
                $imagePath = $ytThumbPath;
            }
        }

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
            'instagram_url' => ! empty($validated['instagram_url']) ? trim($validated['instagram_url']) : null,
            'youtube_url' => ! empty($validated['youtube_url']) ? trim($validated['youtube_url']) : null,
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
        if (! $request->user()?->hasPermission('news', 'edit')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menyunting berita.');
        }

        News::ensureInstagramColumn();

        $data = $request->all();

        $rules = [
            'title' => 'required|string|max:255',
            'category_id' => 'nullable|exists:news_categories,id',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'required|string',
            'instagram_url' => 'nullable|string|max:500',
            'youtube_url' => 'nullable|string|max:500',
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

        if (empty($finalImages) && ! empty($validated['youtube_url'])) {
            $ytThumbPath = $this->downloadAndStoreYouTubeThumbnail($validated['youtube_url']);
            if ($ytThumbPath) {
                $finalImages[] = $ytThumbPath;
                $imagePath = $ytThumbPath;
            }
        }

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
            'instagram_url' => ! empty($validated['instagram_url']) ? trim($validated['instagram_url']) : null,
            'youtube_url' => ! empty($validated['youtube_url']) ? trim($validated['youtube_url']) : null,
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
        if (! request()->user()?->hasPermission('news', 'delete')) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus berita.');
        }

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
        $user = $request->user();
        $isAllowed = $user && (
            $user->isAdmin() ||
            $user->isPublisher() ||
            $user->isPrincipal() ||
            $user->hasPermission('news', 'create') ||
            $user->hasPermission('news', 'edit')
        );

        if (! $isAllowed) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola kategori berita.');
        }

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
     * Update an existing news category.
     */
    public function updateCategory(Request $request, NewsCategory $category): RedirectResponse
    {
        $user = $request->user();
        $isAllowed = $user && (
            $user->isAdmin() ||
            $user->isPublisher() ||
            $user->isPrincipal() ||
            $user->hasPermission('news', 'create') ||
            $user->hasPermission('news', 'edit')
        );

        if (! $isAllowed) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola kategori berita.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:news_categories,name,' . $category->id,
            'color' => 'nullable|string|max:30',
            'description' => 'nullable|string|max:255',
        ]);

        $category->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'color' => $validated['color'] ?? 'blue',
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', "Kategori '{$category->name}' berhasil diperbarui.");
    }

    /**
     * Destroy a news category.
     */
    public function destroyCategory(NewsCategory $category): RedirectResponse
    {
        $user = request()->user();
        $isAllowed = $user && (
            $user->isAdmin() ||
            $user->isPublisher() ||
            $user->isPrincipal() ||
            $user->hasPermission('news', 'delete')
        );

        if (! $isAllowed) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus kategori berita.');
        }

        $name = $category->name;
        $category->delete();

        return back()->with('success', "Kategori '{$name}' berhasil dihapus.");
    }

    /**
     * Fetch metadata (caption, title, image, embed URL) from a public Instagram Post/Reel URL.
     */
    public function fetchInstagram(Request $request): JsonResponse
    {
        if (! $request->user()?->hasPermission('news', 'create') && ! $request->user()?->hasPermission('news', 'edit')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'url' => 'required|string|max:500',
        ]);

        $rawUrl = trim($request->input('url'));
        if (! preg_match('/instagram\.com\/(?:[^\/]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/i', $rawUrl, $matches)) {
            return response()->json([
                'message' => 'Format tautan Instagram tidak valid. Gunakan link postingan atau reel Instagram (contoh: https://www.instagram.com/p/xxxxx/).',
            ], 422);
        }

        $type = strtolower($matches[1]);
        $shortcode = $matches[2];
        $cleanUrl = "https://www.instagram.com/{$type}/{$shortcode}/";
        $embedUrl = "https://www.instagram.com/{$type}/{$shortcode}/embed";

        $caption = '';
        $title = '';
        $authorUsername = '';
        $imageBase64 = null;

        $httpOptions = ['verify' => false];
        $browserHeaders = [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        ];
        $crawlerHeaders = [
            'User-Agent' => 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        ];

        $downloadImageAsBase64 = function (string $imgUrl) use ($httpOptions, $browserHeaders): ?string {
            try {
                $cleanImgUrl = html_entity_decode($imgUrl, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $cleanImgUrl = stripslashes($cleanImgUrl);
                if (! str_starts_with($cleanImgUrl, 'http')) {
                    return null;
                }
                $resp = Http::withOptions($httpOptions)
                    ->withHeaders(array_merge($browserHeaders, ['Referer' => 'https://www.instagram.com/']))
                    ->timeout(12)
                    ->get($cleanImgUrl);

                if ($resp->successful() && strlen($resp->body()) > 500) {
                    $mime = $resp->header('Content-Type') ?: 'image/jpeg';
                    if (str_contains($mime, ';')) {
                        $mime = trim(explode(';', $mime)[0]);
                    }
                    if (! str_starts_with($mime, 'image/')) {
                        $mime = 'image/jpeg';
                    }

                    return 'data:' . $mime . ';base64,' . base64_encode($resp->body());
                }
            } catch (\Throwable $e) {
                // Ignore download error and try next strategy
            }

            return null;
        };

        // Strategy 1: Parse /embed/captioned/ page (most reliable for public posts without API token)
        try {
            $embedResp = Http::withOptions($httpOptions)
                ->withHeaders($browserHeaders)
                ->timeout(12)
                ->get("https://www.instagram.com/p/{$shortcode}/embed/captioned/");

            if ($embedResp->successful()) {
                $embedHtml = $embedResp->body();

                // Extract author username if present
                if (preg_match('/class=["\'][^"\']*UsernameText[^"\']*["\'][^>]*>([^<]+)</i', $embedHtml, $userMatch)) {
                    $authorUsername = trim(html_entity_decode($userMatch[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                }

                // 1a. Try extracting JSON inside window.__additionalDataLoaded or contextJSON
                if (preg_match('/"edge_media_to_caption"\s*:\s*\{\s*"edges"\s*:\s*\[\s*\{\s*"node"\s*:\s*\{\s*"text"\s*:\s*"((?:[^"\\\\]|\\\\.)*)"/is', $embedHtml, $jsonCapMatch)) {
                    $decodedCap = json_decode('"' . $jsonCapMatch[1] . '"');
                    if (is_string($decodedCap) && trim($decodedCap) !== '') {
                        $caption = trim($decodedCap);
                    }
                }

                if (empty($imageBase64) && preg_match('/"display_url"\s*:\s*"((?:[^"\\\\]|\\\\.)*)"/i', $embedHtml, $jsonImgMatch)) {
                    $decodedImgUrl = json_decode('"' . $jsonImgMatch[1] . '"');
                    if (is_string($decodedImgUrl)) {
                        $imageBase64 = $downloadImageAsBase64($decodedImgUrl);
                    }
                }

                // 1b. Parse HTML DOM inside /embed/captioned/ for Caption & EmbeddedMediaImage
                if (empty($caption) && preg_match('/class=["\'][^"\']*Caption[^"\']*["\'][^>]*>(.*?)<div\s+class=["\'][^"\']*CaptionComments/is', $embedHtml, $capHtmlMatch)) {
                    $rawCapHtml = $capHtmlMatch[1];
                    // Remove username link at the start of caption block
                    $rawCapHtml = preg_replace('/<a[^>]*class=["\'][^"\']*CaptionUsername[^"\']*["\'][^>]*>.*?<\/a>/is', '', $rawCapHtml);
                    $cleaned = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $rawCapHtml));
                    $caption = trim(html_entity_decode($cleaned, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                }

                if (empty($caption) && preg_match('/class=["\']Caption["\'][^>]*>(.*?)<\/div>/is', $embedHtml, $embedCapMatch)) {
                    $rawCapHtml = preg_replace('/<a[^>]*class=["\'][^"\']*CaptionUsername[^"\']*["\'][^>]*>.*?<\/a>/is', '', $embedCapMatch[1]);
                    $cleaned = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $rawCapHtml));
                    $caption = trim(html_entity_decode($cleaned, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                }

                if (empty($imageBase64)) {
                    if (preg_match('/<img[^>]+class=["\'][^"\']*EmbeddedMediaImage[^"\']*["\'][^>]+src=["\']([^"\']+)["\']/i', $embedHtml, $imgMatch)
                        || preg_match('/<img[^>]+src=["\']([^"\']+)["\'][^>]+class=["\'][^"\']*EmbeddedMediaImage[^"\']*["\']/i', $embedHtml, $imgMatch)) {
                        $imageBase64 = $downloadImageAsBase64($imgMatch[1]);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Continue to Strategy 2
        }

        // Strategy 2: Fetch main post URL using Crawler User-Agent (OpenGraph meta tags)
        if (empty($caption) || empty($imageBase64)) {
            try {
                $response = Http::withOptions($httpOptions)
                    ->withHeaders($crawlerHeaders)
                    ->timeout(12)
                    ->get($cleanUrl);

                if ($response->successful()) {
                    $html = $response->body();

                    // Extract og:description or meta name="description"
                    if (empty($caption)) {
                        $rawDesc = '';
                        if (preg_match('/<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $descMatch)
                            || preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:description["\']/i', $html, $descMatch)
                            || preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $descMatch)) {
                            $rawDesc = html_entity_decode($descMatch[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                        }

                        if (! empty($rawDesc)) {
                            // Strip prefix like: '123 likes, 4 comments - username on Month Day, Year: "Caption"'
                            if (preg_match('/:\s*["“](.+)["”]\.?$/su', $rawDesc, $capMatch)) {
                                $caption = trim($capMatch[1]);
                            } elseif (preg_match('/on\s+[A-Za-z]+\s+\d+,\s+\d{4}:\s*(.+)$/su', $rawDesc, $capMatch2)) {
                                $caption = trim($capMatch2[1], " \t\n\r\0\x0B\"“”");
                            } else {
                                $caption = trim($rawDesc);
                            }
                        }
                    }

                    // Extract og:title if caption still empty
                    if (empty($caption)) {
                        if (preg_match('/<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $titleMatch)
                            || preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:title["\']/i', $html, $titleMatch)) {
                            $rawOgTitle = html_entity_decode($titleMatch[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                            if (preg_match('/on\s+Instagram:\s*["“](.+)["”]$/su', $rawOgTitle, $ogCapMatch)) {
                                $caption = trim($ogCapMatch[1]);
                            }
                        }
                    }

                    // Extract og:image
                    if (empty($imageBase64)) {
                        if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $imgMatch)
                            || preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']/i', $html, $imgMatch)) {
                            $imageBase64 = $downloadImageAsBase64($imgMatch[1]);
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Continue to Strategy 3
            }
        }

        // Strategy 3: Direct media endpoint fallback for thumbnail image
        if (empty($imageBase64)) {
            $imageBase64 = $downloadImageAsBase64("https://www.instagram.com/p/{$shortcode}/media/?size=l");
        }

        // Build clean title & excerpt from caption
        if (! empty($caption)) {
            $lines = array_values(array_filter(array_map('trim', explode("\n", $caption)), fn ($l) => $l !== ''));
            $firstLine = $lines[0] ?? $caption;
            // Remove leading hashtags if the first line is just hashtags
            $cleanFirstLine = trim(preg_replace('/(?:#[\w-]+)+/u', '', $firstLine));
            if (mb_strlen($cleanFirstLine) < 5 && isset($lines[1])) {
                $cleanFirstLine = trim(preg_replace('/(?:#[\w-]+)+/u', '', $lines[1]));
            }
            $titleCandidate = $cleanFirstLine !== '' ? $cleanFirstLine : $firstLine;
            $title = Str::limit($titleCandidate, 95, '');
        }

        $excerpt = '';
        if (! empty($caption)) {
            $cleanCaptionForExcerpt = trim(preg_replace('/\s+/', ' ', preg_replace('/#[\w-]+/u', '', $caption)));
            $excerpt = Str::limit($cleanCaptionForExcerpt ?: $caption, 160);
        }

        // Ensure 'Instagram' or 'Media Sosial' category recommendation exists
        $igCategory = NewsCategory::where('name', 'like', '%Instagram%')
            ->orWhere('name', 'like', '%Sosial%')
            ->first();

        return response()->json([
            'clean_url' => $cleanUrl,
            'embed_url' => $embedUrl,
            'shortcode' => $shortcode,
            'author_username' => $authorUsername,
            'title' => $title ?: ($authorUsername ? "Update Informasi Instagram @{$authorUsername}" : 'Update Informasi Instagram Sekolah'),
            'caption' => $caption,
            'excerpt' => $excerpt ?: 'Informasi dan dokumentasi kegiatan terbaru dari akun Instagram resmi sekolah.',
            'image_base64' => $imageBase64,
            'suggested_category_id' => $igCategory?->id,
            'fetched_automatically' => ! empty($caption) || ! empty($imageBase64),
        ]);
    }

    /**
     * Fetch high quality YouTube video thumbnail and convert to base64.
     */
    public function fetchYouTubeThumbnail(Request $request): JsonResponse
    {
        if (! $request->user()?->hasPermission('news', 'create') && ! $request->user()?->hasPermission('news', 'edit')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'url' => 'required|string|max:500',
        ]);

        $url = trim($request->input('url'));
        $pattern = '%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?|shorts|live)/|.*[?&]v=)|youtu\.be/)([^"&?/\s]{11})%i';
        $youtubeId = null;

        if (preg_match($pattern, $url, $matches)) {
            $youtubeId = $matches[1];
        } elseif (preg_match('/^[a-zA-Z0-9_-]{11}$/', $url)) {
            $youtubeId = $url;
        }

        if (! $youtubeId) {
            return response()->json([
                'message' => 'Format tautan YouTube tidak valid.',
            ], 422);
        }

        $candidates = [
            "https://img.youtube.com/vi/{$youtubeId}/maxresdefault.jpg",
            "https://img.youtube.com/vi/{$youtubeId}/sddefault.jpg",
            "https://img.youtube.com/vi/{$youtubeId}/hqdefault.jpg",
        ];

        $imageBase64 = null;
        $chosenUrl = null;

        foreach ($candidates as $imgUrl) {
            try {
                $resp = Http::withOptions(['verify' => false])->timeout(8)->get($imgUrl);
                if ($resp->successful() && strlen($resp->body()) > 2000) {
                    $mime = $resp->header('Content-Type') ?: 'image/jpeg';
                    $imageBase64 = 'data:' . $mime . ';base64,' . base64_encode($resp->body());
                    $chosenUrl = $imgUrl;
                    break;
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        if (! $imageBase64) {
            try {
                $chosenUrl = "https://img.youtube.com/vi/{$youtubeId}/hqdefault.jpg";
                $resp = Http::withOptions(['verify' => false])->timeout(8)->get($chosenUrl);
                if ($resp->successful()) {
                    $mime = $resp->header('Content-Type') ?: 'image/jpeg';
                    $imageBase64 = 'data:' . $mime . ';base64,' . base64_encode($resp->body());
                }
            } catch (\Throwable $e) {}
        }

        return response()->json([
            'youtube_id' => $youtubeId,
            'image_base64' => $imageBase64,
            'thumbnail_url' => $chosenUrl,
            'clean_url' => "https://www.youtube.com/watch?v={$youtubeId}",
        ]);
    }

    /**
     * Download YouTube thumbnail and save into public storage as news cover image.
     */
    protected function downloadAndStoreYouTubeThumbnail(string $url): ?string
    {
        $pattern = '%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?|shorts|live)/|.*[?&]v=)|youtu\.be/)([^"&?/\s]{11})%i';
        $youtubeId = null;

        if (preg_match($pattern, $url, $matches)) {
            $youtubeId = $matches[1];
        } elseif (preg_match('/^[a-zA-Z0-9_-]{11}$/', $url)) {
            $youtubeId = $url;
        }

        if (! $youtubeId) {
            return null;
        }

        $candidates = [
            "https://img.youtube.com/vi/{$youtubeId}/maxresdefault.jpg",
            "https://img.youtube.com/vi/{$youtubeId}/sddefault.jpg",
            "https://img.youtube.com/vi/{$youtubeId}/hqdefault.jpg",
        ];

        foreach ($candidates as $imgUrl) {
            try {
                $resp = Http::withOptions(['verify' => false])->timeout(8)->get($imgUrl);
                if ($resp->successful() && strlen($resp->body()) > 2000) {
                    $filename = 'yt_thumb_' . $youtubeId . '_' . Str::random(6) . '.jpg';
                    $path = 'news_images/' . $filename;
                    Storage::disk('public')->put($path, $resp->body());
                    return $path;
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        try {
            $resp = Http::withOptions(['verify' => false])->timeout(8)->get("https://img.youtube.com/vi/{$youtubeId}/hqdefault.jpg");
            if ($resp->successful()) {
                $filename = 'yt_thumb_' . $youtubeId . '_' . Str::random(6) . '.jpg';
                $path = 'news_images/' . $filename;
                Storage::disk('public')->put($path, $resp->body());
                return $path;
            }
        } catch (\Throwable $e) {}

        return null;
    }
}

