<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('extracurricular_reports', function (Blueprint $table) {
            $table->string('verification_token', 64)->nullable()->unique()->after('status');
        });

        // Populate existing reports with unique random verification tokens
        $reports = DB::table('extracurricular_reports')->get(['id']);
        foreach ($reports as $r) {
            DB::table('extracurricular_reports')
                ->where('id', $r->id)
                ->update([
                    'verification_token' => Str::random(32),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('extracurricular_reports', function (Blueprint $table) {
            $table->dropColumn('verification_token');
        });
    }
};
