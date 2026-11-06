<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('news') && ! Schema::hasColumn('news', 'instagram_url')) {
            Schema::table('news', function (Blueprint $table) {
                $table->string('instagram_url', 500)->nullable()->after('attachments');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('news') && Schema::hasColumn('news', 'instagram_url')) {
            Schema::table('news', function (Blueprint $table) {
                $table->dropColumn('instagram_url');
            });
        }
    }
};

