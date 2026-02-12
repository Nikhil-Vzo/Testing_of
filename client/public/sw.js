// OthrHalff Service Worker for PWA
const CACHE_NAME = 'othrhalff-v2';
const urlsToCache = [
    '/',
    '/favicon.png',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // IMPORTANT: Skip ALL external/API requests entirely - let the browser handle them
    // This prevents CORS issues with Supabase, Agora, PeerJS, and other APIs
    if (url.origin !== self.location.origin) {
        return;
    }

    // Skip requests with credentials mode 'include' to avoid CORS conflicts
    if (event.request.credentials === 'include') {
        return;
    }

    // Network-first strategy for navigation requests (HTML pages)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Cache-first for same-origin static assets only
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                // Clone request before fetching (prevents "already used" error)
                const fetchRequest = event.request.clone();
                return fetch(fetchRequest);
            })
            .catch(() => {
                // If both cache and network fail, return a basic offline response
                return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            })
    );
});
