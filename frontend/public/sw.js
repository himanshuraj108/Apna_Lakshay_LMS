const CACHE_NAME = 'hamara-lakshya-v3';
const urlsToCache = [
    '/manifest.json',
    '/pwa-192x192.png',
    '/pwa-512x512.png'
];

self.addEventListener('install', (event) => {
    // Force this new service worker to become the active one, bypassing the "waiting" state
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', (event) => {
    // Immediately claim control of all clients
    event.waitUntil(clients.claim());

    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Bypass API requests
    if (event.request.url.includes('/api/')) {
        return;
    }

    // Bypass external URLs
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) {
        return;
    }

    // For navigation requests (loading valid pages), try Network first, then Cache
    // This ensures we always get the latest index.html from the server
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // if network fails, try cache for the exact request, otherwise fallback to root
                    return caches.match(event.request).then(response => {
                        return response || caches.match('/index.html') || caches.match('/');
                    });
                })
        );
        return;
    }

    // For assets (JS/CSS/Images), try Cache first, then Network
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch((err) => {
                    console.warn('Service Worker: Fetch failed for asset', event.request.url, err);
                    // Return a 404/503 response so the promise doesn't reject with undefined
                    return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
                });
            })
    );
});
