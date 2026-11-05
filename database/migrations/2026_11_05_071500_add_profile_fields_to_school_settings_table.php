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
        Schema::table('school_settings', function (Blueprint $table) {
            $table->string('school_motto')->nullable()->after('name');
            $table->string('accreditation', 100)->nullable()->default('Akreditasi A (Unggul)')->after('school_motto');
            $table->text('profile_description')->nullable()->after('accreditation');
            $table->text('vision')->nullable()->after('profile_description');
            $table->text('mission')->nullable()->after('vision');
            $table->string('profile_image_path')->nullable()->after('mission');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            $table->dropColumn([
                'school_motto',
                'accreditation',
                'profile_description',
                'vision',
                'mission',
                'profile_image_path',
            ]);
        });
    }
};

