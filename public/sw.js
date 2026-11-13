// AbsensiKu Progressive Web App Service Worker
const CACHE_NAME = 'absensiku-pwa-v8';

// Essential static assets to pre-cache
const PRECACHE_ASSETS = [
    '/',
    '/?source=pwa',
    '/favicon.ico',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-maskable-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-maskable-512x512.png',
];

// Install event - precache core static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Precache asset error:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network-first for navigation/data, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle GET requests for same origin or fonts/images
    if (request.method !== 'GET') {
        return;
    }

    // Ignore browser extension requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Always fetch latest manifest and PWA icons without stale cache (Network-First)
    if (url.pathname === '/manifest.json' || url.pathname.startsWith('/icons/')) {
        event.respondWith(
            fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => caches.match(request).then((cached) => cached || new Response('', { status: 408 })))
        );
        return;
    }

    // 1. Static build assets (Vite build chunks, images, fonts) -> Cache-first with network fallback
    if (
        url.pathname.startsWith('/build/') ||
        url.pathname.startsWith('/storage/') ||
        url.pathname.match(/\.(css|js|woff2|woff|ttf|png|jpg|jpeg|svg|webp|ico)$/)
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Fallback if offline
                    return cachedResponse || new Response('', { status: 408 });
                });
            })
        );
        return;
    }

    // 2. Navigation & API/Inertia requests -> Network-first with cache fallback
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return caches.match('/').then((fallbackResponse) => {
                        return (
                            fallbackResponse ||
                            new Response('Offline / Network Error', {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: { 'Content-Type': 'text/plain' },
                            })
                        );
                    });
                });
            })
    );
});

// =========================================================================
// 3. VAPID Web Push Notifications (Background & Standalone Delivery)
// =========================================================================

self.addEventListener('push', (event) => {
    let data = {
        title: 'Pengingat Presensi Siswa ⏰',
        body: 'Presensi harian siswa belum diisi. Harap segera melakukan absensi.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        url: '/attendances',
        tag: 'attendance-reminder',
    };

    if (event.data) {
        try {
            const parsed = event.data.json();
            data = { ...data, ...parsed };
        } catch {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-192x192.png',
        tag: data.tag || 'attendance-reminder',
        data: {
            url: data.url || '/attendances',
        },
        vibrate: [200, 100, 200, 100, 200],
        renotify: true,
        requireInteraction: true,
        actions: [
            {
                action: 'open_attendance',
                title: 'Buka Absensi',
            },
        ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/attendances';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Jika ada tab/jendela yang sudah terbuka, fokuskan dan navigasikan
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            // Jika tidak ada yang terbuka, buka jendela/PWA baru
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});


