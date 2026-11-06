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
            if (! Schema::hasColumn('school_settings', 'hero_badge')) {
                $table->string('hero_badge')->nullable()->after('profile_image_path');
            }
            if (! Schema::hasColumn('school_settings', 'hero_title')) {
                $table->string('hero_title')->nullable()->after('hero_badge');
            }
            if (! Schema::hasColumn('school_settings', 'hero_highlight')) {
                $table->string('hero_highlight')->nullable()->after('hero_title');
            }
            if (! Schema::hasColumn('school_settings', 'hero_description')) {
                $table->text('hero_description')->nullable()->after('hero_highlight');
            }
            if (! Schema::hasColumn('school_settings', 'hero_image_path')) {
                $table->string('hero_image_path')->nullable()->after('hero_description');
            }
            if (! Schema::hasColumn('school_settings', 'hero_pillars')) {
                $table->json('hero_pillars')->nullable()->after('hero_image_path');
            }
            if (! Schema::hasColumn('school_settings', 'core_values')) {
                $table->json('core_values')->nullable()->after('hero_pillars');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            $columns = array_filter([
                'hero_badge',
                'hero_title',
                'hero_highlight',
                'hero_description',
                'hero_image_path',
                'hero_pillars',
                'core_values',
            ], fn ($col) => Schema::hasColumn('school_settings', $col));

            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};

