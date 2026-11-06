<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('galleries');
    }
};

