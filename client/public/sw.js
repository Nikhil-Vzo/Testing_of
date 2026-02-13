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


// Listener for receiving a push notification
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


// Listener for clicking the buttons on the notification
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
