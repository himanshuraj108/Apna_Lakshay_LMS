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
                    return caches.match(event.request);
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
                return fetch(event.request);
            })
    );
});
