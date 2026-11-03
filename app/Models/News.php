<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'attachment_path',
        'attachment_name',
        'attachment_size',
        'is_published',
        'published_at',
        'views_count',
    ];

    protected $appends = [
        'image_url',
        'attachment_url',
        'formatted_date',
        'formatted_attachment_size',
    ];

    protected function casts(): array
    {
        return [
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
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        return $this->attachment_path ? asset('storage/' . $this->attachment_path) : null;
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
}

