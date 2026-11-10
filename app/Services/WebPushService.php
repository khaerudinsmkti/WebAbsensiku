<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;

class WebPushService
{
    /**
     * Get the configured VAPID public key.
     */
    public static function getPublicKey(): string
    {
        return config('webpush.vapid.public_key', '');
    }

    /**
     * Get initialized WebPush instance.
     */
    public static function getWebPush(): WebPush
    {
        $vapid = [
            'VAPID' => [
                'subject' => config('webpush.vapid.subject', 'mailto:admin@absensiku.sch.id'),
                'publicKey' => config('webpush.vapid.public_key'),
                'privateKey' => config('webpush.vapid.private_key'),
            ],
        ];

        $options = config('webpush.options', [
            'timeout' => 15,
            'urgency' => 'high',
            'topic' => 'attendance-reminder',
        ]);

        return new WebPush($vapid, $options);
    }

    /**
     * Save or update a user's push subscription.
     */
    public static function subscribe(User $user, array $data, ?string $userAgent = null): PushSubscription
    {
        $endpoint = $data['endpoint'] ?? '';
        $keys = $data['keys'] ?? [];
        $p256dh = $keys['p256dh'] ?? '';
        $auth = $keys['auth'] ?? '';
        $encoding = $data['contentEncoding'] ?? 'aes128gcm';

        if (empty($endpoint) || empty($p256dh) || empty($auth)) {
            throw new \InvalidArgumentException('Data push subscription tidak lengkap.');
        }

        $endpointHash = hash('sha256', $endpoint);

        return PushSubscription::updateOrCreate(
            [
                'user_id' => $user->id,
                'endpoint_hash' => $endpointHash,
            ],
            [
                'endpoint' => $endpoint,
                'public_key' => $p256dh,
                'auth_token' => $auth,
                'content_encoding' => $encoding,
                'user_agent' => $userAgent ?: request()->userAgent(),
            ]
        );
    }

    /**
     * Remove a user's push subscription by endpoint.
     */
    public static function unsubscribe(User $user, string $endpoint): bool
    {
        $endpointHash = hash('sha256', $endpoint);

        return (bool) PushSubscription::where('user_id', $user->id)
            ->where('endpoint_hash', $endpointHash)
            ->delete();
    }

    /**
     * Send WebPush notification payload to a specific user's registered devices.
     */
    public static function sendToUser(User $user, array $payload): array
    {
        $subscriptions = $user->pushSubscriptions()->get();

        if ($subscriptions->isEmpty()) {
            return [
                'success' => false,
                'sent_count' => 0,
                'message' => 'Pengguna belum mendaftarkan izin notifikasi di perangkat ini.',
            ];
        }

        return static::sendToSubscriptions($subscriptions, $payload);
    }

    /**
     * Send WebPush notification payload to a collection of PushSubscription records.
     * Automatically purges invalid/expired tokens (404/410).
     */
    public static function sendToSubscriptions(iterable $subscriptions, array $payload): array
    {
        $webPush = static::getWebPush();
        $payloadJson = json_encode($payload);

        $subscriptionMap = [];
        $queuedCount = 0;

        foreach ($subscriptions as $sub) {
            if (! $sub instanceof PushSubscription) {
                continue;
            }

            try {
                $webPushSub = $sub->toWebPushSubscription();
                $webPush->queueNotification($webPushSub, $payloadJson);
                $subscriptionMap[$sub->endpoint] = $sub;
                $queuedCount++;
            } catch (\Throwable $e) {
                Log::warning('[WebPush] Error queueing notification: ' . $e->getMessage());
            }
        }

        if ($queuedCount === 0) {
            return [
                'success' => false,
                'sent_count' => 0,
                'message' => 'Tidak ada langganan push yang valid.',
            ];
        }

        $successCount = 0;
        $failedCount = 0;

        foreach ($webPush->flush() as $report) {
            $endpoint = $report->getEndpoint();
            $subModel = $subscriptionMap[$endpoint] ?? null;

            if ($report->isSuccess()) {
                $successCount++;
                if ($subModel) {
                    $subModel->update(['last_notified_at' => now()]);
                }
            } else {
                $failedCount++;
                $reason = $report->getReason();
                $response = $report->getResponse();
                $statusCode = $response ? $response->getStatusCode() : 0;

                Log::info("[WebPush] Notification failed to {$endpoint}: {$reason} (Status: {$statusCode})");

                // If device unregistered, 404 Not Found, 410 Gone, delete stale subscription
                if (in_array($statusCode, [404, 410], true) || str_contains($reason, 'expired') || str_contains($reason, 'unsubscribed')) {
                    if ($subModel) {
                        $subModel->delete();
                    }
                }
            }
        }

        return [
            'success' => $successCount > 0,
            'sent_count' => $successCount,
            'failed_count' => $failedCount,
        ];
    }
}
