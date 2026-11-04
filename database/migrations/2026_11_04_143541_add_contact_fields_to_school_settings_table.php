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
            $table->string('whatsapp', 50)->nullable()->after('phone');
            $table->string('instagram', 150)->nullable()->after('whatsapp');
            $table->string('facebook', 150)->nullable()->after('instagram');
            $table->string('youtube', 150)->nullable()->after('facebook');
            $table->string('tiktok', 150)->nullable()->after('youtube');
            $table->string('operating_hours', 150)->nullable()->after('tiktok');
            $table->text('maps_embed_url')->nullable()->after('operating_hours');
            $table->text('contact_description')->nullable()->after('maps_embed_url');
            $table->boolean('contact_active')->default(true)->after('contact_description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp',
                'instagram',
                'facebook',
                'youtube',
                'tiktok',
                'operating_hours',
                'maps_embed_url',
                'contact_description',
                'contact_active',
            ]);
        });
    }
};
