<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('principal_journals')) {
            Schema::create('principal_journals', function (Blueprint $table) {
                $table->id();
                $table->date('activity_date');
                $table->string('activity_name');
                $table->text('activity_content');
                $table->string('image_path')->nullable();
                $table->json('images')->nullable();
                $table->unsignedBigInteger('file_size')->default(0);
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('principal_journals');
    }
};

