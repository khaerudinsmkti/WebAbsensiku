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
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('endpoint');
            $table->string('endpoint_hash', 64)->index(); // SHA256 of endpoint for fast unique lookups
            $table->text('public_key'); // p256dh key
            $table->text('auth_token'); // auth secret
            $table->string('content_encoding', 32)->default('aes128gcm');
            $table->text('user_agent')->nullable();
            $table->timestamp('last_notified_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'endpoint_hash']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
