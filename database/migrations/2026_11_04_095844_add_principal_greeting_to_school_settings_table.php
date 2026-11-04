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
            $table->string('principal_photo_path')->nullable()->after('principal_nip');
            $table->string('principal_greeting_title')->nullable()->default('Sambutan Hangat Kepala Sekolah')->after('principal_photo_path');
            $table->longText('principal_greeting')->nullable()->after('principal_greeting_title');
            $table->boolean('principal_greeting_active')->default(true)->after('principal_greeting');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            $table->dropColumn([
                'principal_photo_path',
                'principal_greeting_title',
                'principal_greeting',
                'principal_greeting_active',
            ]);
        });
    }
};
