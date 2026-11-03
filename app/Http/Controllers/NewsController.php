<?php

namespace App\Http\Controllers;

use App\Models\News;
use App\Models\NewsCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

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
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'nullable|exists:news_categories,id',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'required|string',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120', // max 5MB
            'attachment' => 'nullable|file|mimes:pdf|max:20480', // max 20MB PDF
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('news_images', 'public');
        }

        $attachmentPath = null;
        $attachmentName = null;
        $attachmentSize = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentPath = $file->store('news_attachments', 'public');
            $attachmentName = $file->getClientOriginalName();
            $attachmentSize = $file->getSize();
        }

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
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'attachment_size' => $attachmentSize,
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
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'nullable|exists:news_categories,id',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'required|string',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'remove_image' => 'nullable|boolean',
            'attachment' => 'nullable|file|mimes:pdf|max:20480',
            'remove_attachment' => 'nullable|boolean',
        ]);

        // Handle image removal or replacement
        if ($request->boolean('remove_image')) {
            if ($news->image_path && Storage::disk('public')->exists($news->image_path)) {
                Storage::disk('public')->delete($news->image_path);
            }
            $news->image_path = null;
        }

        if ($request->hasFile('image')) {
            if ($news->image_path && Storage::disk('public')->exists($news->image_path)) {
                Storage::disk('public')->delete($news->image_path);
            }
            $news->image_path = $request->file('image')->store('news_images', 'public');
        }

        // Handle PDF attachment removal or replacement
        if ($request->boolean('remove_attachment')) {
            if ($news->attachment_path && Storage::disk('public')->exists($news->attachment_path)) {
                Storage::disk('public')->delete($news->attachment_path);
            }
            $news->attachment_path = null;
            $news->attachment_name = null;
            $news->attachment_size = null;
        }

        if ($request->hasFile('attachment')) {
            if ($news->attachment_path && Storage::disk('public')->exists($news->attachment_path)) {
                Storage::disk('public')->delete($news->attachment_path);
            }
            $file = $request->file('attachment');
            $news->attachment_path = $file->store('news_attachments', 'public');
            $news->attachment_name = $file->getClientOriginalName();
            $news->attachment_size = $file->getSize();
        }

        $isPublished = $request->boolean('is_published');
        $publishedAt = $validated['published_at'] ?? ($isPublished && ! $news->published_at ? now() : $news->published_at);

        $news->update([
            'title' => $validated['title'],
            'category_id' => $validated['category_id'] ?? null,
            'excerpt' => $validated['excerpt'] ?: Str::limit(strip_tags($validated['content']), 160),
            'content' => $validated['content'],
            'is_published' => $isPublished,
            'published_at' => $isPublished ? $publishedAt : null,
        ]);

        return back()->with('success', 'Berita berhasil diperbarui.');
    }

    /**
     * Remove the specified news article.
     */
    public function destroy(News $news): RedirectResponse
    {
        if ($news->image_path && Storage::disk('public')->exists($news->image_path)) {
            Storage::disk('public')->delete($news->image_path);
        }

        if ($news->attachment_path && Storage::disk('public')->exists($news->attachment_path)) {
            Storage::disk('public')->delete($news->attachment_path);
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

