/**
 * Utility functions for managing VAPID Web Push Notifications in PWA
 */

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Register device for VAPID Web Push Notifications.
 * Saves subscription token to the backend server so notifications can be sent
 * even when the user is NOT logged in or has closed the browser.
 */
export async function subscribeToPushNotifications(): Promise<{
    success: boolean;
    message: string;
    subscription?: PushSubscription;
}> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        return {
            success: false,
            message: 'Browser perangkat ini belum mendukung fitur Web Push Notification.',
        };
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return {
                success: false,
                message: 'Izin notifikasi ditolak oleh pengguna atau sistem perangkat.',
            };
        }

        // 1. Ambil Public VAPID Key dari backend
        const keyRes = await fetch('/webpush/key');
        if (!keyRes.ok) {
            throw new Error('Gagal mengambil kunci VAPID dari server.');
        }
        const { publicKey } = await keyRes.json();
        if (!publicKey) {
            throw new Error('Public VAPID key tidak ditemukan.');
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        // Jika belum ada langganan, buat langganan push baru dengan VAPID key
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });
        }

        // 2. Kirim subscription data ke backend Laravel
        const subData = subscription.toJSON();
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        const saveRes = await fetch('/webpush/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                endpoint: subData.endpoint,
                keys: subData.keys,
                contentEncoding: 'aes128gcm',
            }),
        });

        const saveJson = await saveRes.json();

        return {
            success: saveRes.ok,
            message: saveJson.message || 'Perangkat berhasil didaftarkan untuk menerima pengingat absensi.',
            subscription,
        };
    } catch (err: any) {
        console.error('[WebPush] Subscription error:', err);
        return {
            success: false,
            message: err?.message || 'Terjadi kesalahan saat mendaftarkan notifikasi push.',
        };
    }
}

/**
 * Unsubscribe current device from push notifications.
 */
export async function unsubscribeFromPushNotifications(): Promise<{ success: boolean; message: string }> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        return { success: false, message: 'Push notifications tidak didukung.' };
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            await fetch('/webpush/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ endpoint }),
            });
        }

        return { success: true, message: 'Langganan notifikasi berhasil dihentikan.' };
    } catch (err: any) {
        console.error('[WebPush] Unsubscribe error:', err);
        return { success: false, message: err?.message || 'Gagal membatalkan notifikasi push.' };
    }
}

/**
 * Send immediate test push notification from backend server to current user.
 */
export async function sendTestPushNotification(): Promise<{ success: boolean; sent_count?: number; message?: string }> {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const res = await fetch('/webpush/test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    return res.json();
}
