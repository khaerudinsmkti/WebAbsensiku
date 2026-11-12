<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Gallery extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'category',
        'description',
        'activity_date',
        'image_path',
        'images',
        'file_size',
        'is_published',
        'user_id',
    ];

    protected $appends = [
        'image_url',
        'images_urls',
        'formatted_date',
        'formatted_size',
        'slug',
    ];

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'activity_date' => 'date',
            'file_size' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    /**
     * Ensure the galleries table exists in the database automatically.
     */
    public static function ensureTableExists(): void
    {
        try {
            if (! Schema::hasTable('galleries')) {
                Schema::create('galleries', function (Blueprint $table) {
                    $table->id();
                    $table->string('title');
                    $table->string('category')->default('Kegiatan Sekolah');
                    $table->text('description')->nullable();
                    $table->date('activity_date')->nullable();
                    $table->string('image_path')->nullable();
                    $table->json('images')->nullable();
                    $table->unsignedBigInteger('file_size')->default(0);
                    $table->boolean('is_published')->default(true);
                    $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                    $table->timestamps();
                });
            }
        } catch (\Throwable $e) {
            // Ignore if DB connection is unavailable during CLI build
        }
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
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

    public function getFormattedDateAttribute(): string
    {
        $date = $this->activity_date ?? $this->created_at ?? now();

        return Carbon::parse($date)->locale('id')->isoFormat('D MMMM Y');
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = (int) ($this->file_size ?? 0);
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

    public function getSlugAttribute(): string
    {
        $slug = \Illuminate\Support\Str::slug($this->title);
        return $slug ? $slug . '-' . $this->id : (string) $this->id;
    }
}

