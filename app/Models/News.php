<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class News extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'category_id',
        'user_id',
        'excerpt',
        'content',
        'image_path',
        'images',
        'attachment_path',
        'attachment_name',
        'attachment_size',
        'attachments',
        'instagram_url',
        'youtube_url',
        'is_published',
        'published_at',
        'views_count',
    ];

    protected $appends = [
        'image_url',
        'images_urls',
        'attachment_url',
        'attachments_data',
        'formatted_date',
        'formatted_attachment_size',
        'instagram_embed_url',
        'youtube_embed_url',
        'youtube_thumbnail_url',
    ];

    public static function ensureInstagramColumn(): void
    {
        try {
            if (Schema::hasTable('news') && ! Schema::hasColumn('news', 'instagram_url')) {
                Schema::table('news', function (Blueprint $table) {
                    $table->string('instagram_url', 500)->nullable()->after('attachments');
                });
            }
            if (Schema::hasTable('news') && ! Schema::hasColumn('news', 'youtube_url')) {
                Schema::table('news', function (Blueprint $table) {
                    $table->string('youtube_url', 500)->nullable()->after('instagram_url');
                });
            }
        } catch (\Throwable $e) {
            // Ignore schema check errors in restricted environments
        }
    }

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'attachments' => 'array',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'views_count' => 'integer',
            'attachment_size' => 'integer',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($news) {
            if (empty($news->slug)) {
                $news->slug = Str::slug($news->title) . '-' . Str::random(6);
            }
            if (empty($news->excerpt) && ! empty($news->content)) {
                $news->excerpt = Str::limit(strip_tags($news->content), 160);
            }
            if (empty($news->published_at) && $news->is_published) {
                $news->published_at = now();
            }
        });

        static::updating(function ($news) {
            if (empty($news->excerpt) && ! empty($news->content)) {
                $news->excerpt = Str::limit(strip_tags($news->content), 160);
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(NewsCategory::class, 'category_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function getImageUrlAttribute(): ?string
    {
        if ($this->image_path) {
            return asset('storage/' . $this->image_path);
        }

        if (! empty($this->images) && is_array($this->images)) {
            return asset('storage/' . $this->images[0]);
        }

        return null;
    }

    public function getImagesUrlsAttribute(): array
    {
        $urls = [];
        if (! empty($this->images) && is_array($this->images)) {
            foreach ($this->images as $img) {
                if ($img) {
                    $urls[] = asset('storage/' . $img);
                }
            }
        } elseif ($this->image_path) {
            $urls[] = asset('storage/' . $this->image_path);
        }

        return $urls;
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        if ($this->attachment_path) {
            return asset('storage/' . $this->attachment_path);
        }

        if (! empty($this->attachments) && is_array($this->attachments)) {
            $first = $this->attachments[0];
            return ! empty($first['path']) ? asset('storage/' . $first['path']) : null;
        }

        return null;
    }

    public function getAttachmentsDataAttribute(): array
    {
        $result = [];
        if (! empty($this->attachments) && is_array($this->attachments)) {
            foreach ($this->attachments as $att) {
                if (! empty($att['path'])) {
                    $size = $att['size'] ?? 0;
                    $result[] = [
                        'path' => $att['path'],
                        'name' => $att['name'] ?? basename($att['path']),
                        'size' => $size,
                        'url' => asset('storage/' . $att['path']),
                        'formatted_size' => $this->formatFileSize($size),
                    ];
                }
            }
        } elseif ($this->attachment_path) {
            $result[] = [
                'path' => $this->attachment_path,
                'name' => $this->attachment_name ?? basename($this->attachment_path),
                'size' => $this->attachment_size ?? 0,
                'url' => asset('storage/' . $this->attachment_path),
                'formatted_size' => $this->formatted_attachment_size,
            ];
        }

        return $result;
    }

    protected function formatFileSize(?int $bytes): ?string
    {
        if (! $bytes) {
            return null;
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 1) . ' ' . $units[$i];
    }

    public function getFormattedDateAttribute(): string
    {
        $date = $this->published_at ?? $this->created_at ?? now();

        return Carbon::parse($date)->locale('id')->isoFormat('D MMMM Y');
    }

    public function getFormattedAttachmentSizeAttribute(): ?string
    {
        if (! $this->attachment_size) {
            return null;
        }

        $bytes = $this->attachment_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 1) . ' ' . $units[$i];
    }

    public function getInstagramEmbedUrlAttribute(): ?string
    {
        if (empty($this->instagram_url)) {
            return null;
        }

        if (preg_match('/instagram\.com\/(?:[^\/]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/i', $this->instagram_url, $matches)) {
            $type = strtolower($matches[1]);
            $shortcode = $matches[2];

            return "https://www.instagram.com/{$type}/{$shortcode}/embed";
        }

        return null;
    }

    public function getYoutubeEmbedUrlAttribute(): ?string
    {
        if (empty($this->youtube_url)) {
            return null;
        }

        $pattern = '%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?|shorts|live)/|.*[?&]v=)|youtu\.be/)([^"&?/\s]{11})%i';
        if (preg_match($pattern, $this->youtube_url, $matches)) {
            $id = $matches[1];
            return "https://www.youtube-nocookie.com/embed/{$id}";
        }

        if (preg_match('/^[a-zA-Z0-9_-]{11}$/', trim($this->youtube_url))) {
            $id = trim($this->youtube_url);
            return "https://www.youtube-nocookie.com/embed/{$id}";
        }

        return null;
    }

    public function getYoutubeThumbnailUrlAttribute(): ?string
    {
        if (empty($this->youtube_url)) {
            return null;
        }

        $pattern = '%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?|shorts|live)/|.*[?&]v=)|youtu\.be/)([^"&?/\s]{11})%i';
        if (preg_match($pattern, $this->youtube_url, $matches)) {
            return "https://img.youtube.com/vi/{$matches[1]}/hqdefault.jpg";
        }

        if (preg_match('/^[a-zA-Z0-9_-]{11}$/', trim($this->youtube_url))) {
            return "https://img.youtube.com/vi/" . trim($this->youtube_url) . "/hqdefault.jpg";
        }

        return null;
    }

    public function getSlugAttribute($value): string
    {
        if (! empty($value)) {
            return $value;
        }

        return \Illuminate\Support\Str::slug($this->title) . '-' . $this->id;
    }
}

