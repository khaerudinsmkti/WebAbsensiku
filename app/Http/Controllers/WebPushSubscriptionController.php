<?php

namespace App\Http\Controllers;

use App\Models\SchoolSetting;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebPushSubscriptionController extends Controller
{
    /**
     * Get the VAPID public key for frontend registration.
     */
    public function key(): JsonResponse
    {
        return response()->json([
            'publicKey' => WebPushService::getPublicKey(),
        ]);
    }

    /**
     * Store or update device push subscription.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => 'required|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
            'contentEncoding' => 'nullable|string',
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $subscription = WebPushService::subscribe($user, $validated, $request->userAgent());

        return response()->json([
            'success' => true,
            'message' => 'Perangkat Anda berhasil didaftarkan untuk menerima notifikasi pengingat!',
            'subscription_id' => $subscription->id,
        ]);
    }

    /**
     * Remove device push subscription.
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
        ]);

        $user = $request->user();
        if ($user) {
            WebPushService::unsubscribe($user, $validated['endpoint']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Langganan notifikasi pada perangkat ini telah dihentikan.',
        ]);
    }

    /**
     * Send an immediate test notification to the authenticated user's device.
     */
    public function testNotification(Request $request): JsonResponse
    {
        $user = $request->user();
        $setting = SchoolSetting::getSetting();

        $payload = [
            'title' => 'Uji Coba Notifikasi PWA 🔔',
            'body' => 'Notifikasi Web Push VAPID berhasil terhubung ke ponsel Anda! Anda akan menerima pengingat otomatis jika belum melakukan absensi.',
            'icon' => $setting->logo_url ?: '/icons/icon-192x192.png',
            'badge' => '/icons/icon-192x192.png',
            'url' => route('dashboard'),
            'tag' => 'test-notification-' . time(),
        ];

        $result = WebPushService::sendToUser($user, $payload);

        return response()->json($result);
    }
}
