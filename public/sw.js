/**
 * ShelfWiser Service Worker
 *
 * Provides offline support, caching, and background sync
 * for the ShelfWiser PWA application.
 */

const CACHE_NAME = 'shelfwiser-v1';
const OFFLINE_URL = '/offline';

/**
 * Static assets to cache on install
 */
const STATIC_ASSETS = [
    '/',
    '/offline',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

/**
 * API routes that should use network-first strategy
 */
const API_ROUTES = [
    '/api/',
    '/sanctum/',
];

/**
 * Routes that should be cached with stale-while-revalidate
 */
const CACHEABLE_ROUTES = [
    '/dashboard',
    '/products',
    '/orders',
    '/customers',
    '/pos',
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

/**
 * Fetch event - handle requests with appropriate strategy
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests for caching
    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }

    // Skip external requests
    if (url.origin !== location.origin) {
        return;
    }

    // API routes - network first with offline queue
    if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Cacheable routes - stale while revalidate
    if (CACHEABLE_ROUTES.some((route) => url.pathname.startsWith(route))) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Default - cache first for assets, network first for pages
    if (isAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(networkFirst(request));
    }
});

/**
 * Check if URL is a static asset
 */
function isAsset(pathname) {
    const assetExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ico'];
    return assetExtensions.some((ext) => pathname.endsWith(ext));
}

/**
 * Cache-first strategy
 * Returns cached version if available, otherwise fetches from network
 */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('[SW] Cache-first fetch failed:', error);
        return caches.match(OFFLINE_URL);
    }
}

/**
 * Network-first strategy
 * Tries network first, falls back to cache
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        return caches.match(OFFLINE_URL);
    }
}

/**
 * Stale-while-revalidate strategy
 * Returns cached version immediately, updates cache in background
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    return cached || fetchPromise;
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-actions') {
        event.waitUntil(syncOfflineActions());
    }
});

/**
 * Process queued offline actions
 */
async function syncOfflineActions() {
    console.log('[SW] Syncing offline actions');

    // Get pending actions from IndexedDB
    const db = await openDatabase();
    const tx = db.transaction('offlineActions', 'readonly');
    const store = tx.objectStore('offlineActions');
    const actions = await getAllFromStore(store);

    for (const action of actions) {
        try {
            const response = await fetch(action.url, {
                method: action.method,
                headers: action.headers,
                body: action.body,
            });

            if (response.ok) {
                // Remove from queue on success
                const deleteTx = db.transaction('offlineActions', 'readwrite');
                const deleteStore = deleteTx.objectStore('offlineActions');
                deleteStore.delete(action.id);
                console.log('[SW] Synced action:', action.id);
            }
        } catch (error) {
            console.error('[SW] Failed to sync action:', action.id, error);
        }
    }
}

/**
 * Open IndexedDB database
 */
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('shelfwiser-sw', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('offlineActions')) {
                db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

/**
 * Get all items from IndexedDB store
 */
function getAllFromStore(store) {
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Push notification handling
 */
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
        },
        actions: data.actions || [],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

console.log('[SW] Service Worker loaded');
