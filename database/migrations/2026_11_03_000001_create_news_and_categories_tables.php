<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update role column in users table to allow 'publisher'
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 50)->default('teacher')->change();
        });

        // 2. Create news_categories table
        Schema::create('news_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->string('color', 30)->default('blue');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 3. Create news table
        Schema::create('news', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 280)->unique();
            $table->foreignId('category_id')->nullable()->constrained('news_categories')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('image_path')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('attachment_name')->nullable();
            $table->unsignedBigInteger('attachment_size')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('views_count')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('news');
        Schema::dropIfExists('news_categories');
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'principal', 'teacher', 'student'])->default('teacher')->change();
        });
    }
};

