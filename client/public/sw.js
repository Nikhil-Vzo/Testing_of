// OthrHalff Service Worker for PWA
const CACHE_NAME = 'othrhalff-v3.1'; // Bump version when updating
const RUNTIME_CACHE = 'othrhalff-runtime-v1';

// Core files to cache on install (keep minimal for fast install)
const CORE_CACHE = [
    '/',
    '/index.html',
    '/favicon.png',
    '/manifest.json',
    '/logo192.png',
    '/logo512.png'
];

// Install event - cache core resources
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching core files');
                return cache.addAll(CORE_CACHE);
            })
            .then(() => {
                console.log('[SW] Core files cached successfully');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((err) => {
                console.error('[SW] Cache failed:', err);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old caches
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Claiming clients');
            return self.clients.claim(); // Take control immediately
        })
    );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-http(s) requests (chrome-extension://, etc.)
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip ALL external/API requests - let browser handle them natively
    // This prevents CORS issues with Supabase, Agora, PeerJS, Google APIs, etc.
    if (url.origin !== self.location.origin) {
        return; // Browser handles it
    }

    // Skip POST/PUT/DELETE requests (don't cache mutations)
    if (request.method !== 'GET') {
        return;
    }

    // Skip requests with authentication credentials to avoid CORS conflicts
    if (request.credentials === 'include' || request.mode === 'cors') {
        return;
    }

    // --- STRATEGY 1: Network-first for HTML (pages) ---
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful responses
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(request).then((cached) => {
                        if (cached) {
                            return cached;
                        }
                        // Return offline page if available
                        return caches.match('/').then((rootCached) => {
                            return rootCached || new Response(
                                `<!DOCTYPE html>
                                <html lang="en">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>Offline - OthrHalff</title>
                                    <style>
                                        body {
                                            margin: 0;
                                            padding: 0;
                                            background: #000;
                                            color: #fff;
                                            font-family: system-ui, -apple-system, sans-serif;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            min-height: 100vh;
                                            text-align: center;
                                        }
                                        .container {
                                            max-width: 400px;
                                            padding: 2rem;
                                        }
                                        h1 {
                                            font-size: 2rem;
                                            margin-bottom: 1rem;
                                            color: #ff007f;
                                        }
                                        p {
                                            color: #999;
                                            line-height: 1.6;
                                        }
                                        button {
                                            margin-top: 2rem;
                                            padding: 0.75rem 2rem;
                                            background: #ff007f;
                                            color: white;
                                            border: none;
                                            border-radius: 999px;
                                            font-weight: bold;
                                            cursor: pointer;
                                        }
                                        button:hover {
                                            background: #cc0066;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>You're Offline</h1>
                                        <p>Connect to the internet to continue using OthrHalff.</p>
                                        <button onclick="location.reload()">Retry</button>
                                    </div>
                                </body>
                                </html>`,
                                {
                                    status: 503,
                                    statusText: 'Service Unavailable',
                                    headers: { 'Content-Type': 'text/html' }
                                }
                            );
                        });
                    });
                })
        );
        return;
    }

    // --- STRATEGY 2: Cache-first for static assets (JS, CSS, images, fonts) ---
    // These don't change often, so serve from cache for speed
    if (
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image' ||
        request.destination === 'font' ||
        url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/)
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) {
                    // Serve from cache immediately (fast!)
                    // Optionally fetch in background to update cache
                    fetch(request).then((response) => {
                        if (response && response.status === 200) {
                            caches.open(RUNTIME_CACHE).then((cache) => {
                                cache.put(request, response);
                            });
                        }
                    }).catch(() => { /* Ignore background update errors */ });

                    return cached;
                }

                // Not in cache, fetch from network
                return fetch(request).then((response) => {
                    // Cache successful responses for next time
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                }).catch(() => {
                    // Network failed and not in cache
                    return new Response('Asset unavailable offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
        );
        return;
    }

    // --- STRATEGY 3: Network-only for everything else (default) ---
    // This includes API calls, dynamic content, etc.
    event.respondWith(
        fetch(request).catch(() => {
            return new Response('Network request failed', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        })
    );
});

// Listen for messages from the app (for cache updates, etc.)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Received SKIP_WAITING message');
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] Clearing all caches');
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// Background sync (if supported) - for offline message queuing
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);
    if (event.tag === 'sync-messages') {
        event.waitUntil(
            // Here you could sync offline messages when connection returns
            Promise.resolve()
        );
    }
});

// Listener for receiving a push notification (ADDED: Notification Handling)
self.addEventListener('push', (event) => {
    let data = { title: 'New Notification', body: 'You have a new update.' };

    if (event.data) {
        data = event.data.json();
    }

    const options = {
        body: data.body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        data: data.metadata, // Pass IDs (like requestId) here
        actions: [
            { action: 'accept', title: 'Accept' },
            { action: 'reject', title: 'Reject' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});


// Listener for clicking the buttons on the notification (ADDED: Action Handling)
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Immediately hide the notification

    if (event.action === 'accept') {
        const payload = event.notification.data; // Expected: { targetId: "...", myId: "..." }

        if (!payload || !payload.targetId || !payload.myId) {
            console.error('Missing payload data for accept action');
            return;
        }

        const apiUrl = 'https://othrhalff.onrender.com'; // Production URL

        event.waitUntil(
            fetch(`${apiUrl}/api/accept-match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ myId: payload.myId, targetId: payload.targetId })
            })
                .then(response => {
                    if (!response.ok) throw new Error('API Fail');
                    // Optional: Show a confirmation toast/notification
                    return self.registration.showNotification('It\'s a Match! 🎉', {
                        body: 'You can now chat with them.',
                        icon: '/favicon.png'
                    });
                })
                .catch(err => {
                    console.error('Mobile background fetch failed:', err);
                    return self.registration.showNotification('Error', {
                        body: 'Could not accept. Please open the app.',
                    });
                })
        );
    } else {
        // If they click the notification itself (not the button), open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('[SW] Service Worker loaded:', CACHE_NAME);
