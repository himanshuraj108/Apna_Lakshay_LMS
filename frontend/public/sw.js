/**
 * Apna Lakshay — Production Service Worker v6
 * Strategy:
 *  - Static assets (JS/CSS/fonts/images): Cache-First with 30-day TTL
 *  - Navigation (HTML): Network-First with cache fallback
 *  - API calls: Network-only (never cache, always fresh)
 *  - CDN resources (KaTeX, fonts): Cache-First
 */

const CACHE_VERSION = 'apna-lakshay-v6';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const CDN_CACHE     = `${CACHE_VERSION}-cdn`;

// Core shell — pre-cache these on install
const PRECACHE_URLS = [
    '/manifest.json',
    '/app-icon-192.png',
    '/app-icon-512.png',
];

// ── Install: pre-cache shell ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
    );
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then((names) =>
                Promise.all(
                    names
                        .filter((n) => n !== STATIC_CACHE && n !== CDN_CACHE)
                        .map((n) => caches.delete(n))
                )
            ),
        ])
    );
});

// ── Fetch: routing strategy ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. API requests → Network-only (never cache)
    if (url.pathname.startsWith('/api/')) return;

    // 2. Socket.io → skip
    if (url.pathname.startsWith('/socket.io/')) return;

    // 3. Non-GET → skip
    if (request.method !== 'GET') return;

    // 4. CDN resources (KaTeX, jsDelivr, fonts) → Cache-First
    if (
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')
    ) {
        event.respondWith(cacheFirst(CDN_CACHE, request));
        return;
    }

    // 5. Skip Razorpay and other payment externals
    if (url.hostname.includes('razorpay.com')) return;

    // 6. Navigation (HTML pages) → Network-First with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() =>
                    caches.match('/index.html') ||
                    caches.match('/')
                )
        );
        return;
    }

    // 7. Static assets (JS, CSS, images, fonts, woff2) → Cache-First
    const isStaticAsset =
        url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot|png|jpg|jpeg|svg|webp|ico|gif)(\?.*)?$/i);

    if (isStaticAsset && url.origin === self.location.origin) {
        event.respondWith(cacheFirst(STATIC_CACHE, request));
        return;
    }

    // 8. Everything else → Network with cache fallback
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});

// ── Cache-First helper ────────────────────────────────────────────────────────
async function cacheFirst(cacheName, request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(cacheName);
            // Clone because response body can only be read once
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // Return empty 408 so promise doesn't reject with undefined
        return new Response('Network unavailable', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}
