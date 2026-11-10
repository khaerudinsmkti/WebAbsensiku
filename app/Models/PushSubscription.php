<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Minishlink\WebPush\Subscription;

class PushSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'endpoint',
        'endpoint_hash',
        'public_key',
        'auth_token',
        'content_encoding',
        'user_agent',
        'last_notified_at',
    ];

    protected $casts = [
        'last_notified_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Convert this model instance into Minishlink Subscription object.
     */
    public function toWebPushSubscription(): Subscription
    {
        return Subscription::create([
            'endpoint' => $this->endpoint,
            'publicKey' => $this->public_key,
            'authToken' => $this->auth_token,
            'contentEncoding' => $this->content_encoding ?: 'aes128gcm',
        ]);
    }
}
