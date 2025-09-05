const CACHE_NAME = 'nexpo-event-registration-v1.0.0';
const STATIC_CACHE = 'nexpo-static-v1.0.0';
const DYNAMIC_CACHE = 'nexpo-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/nexpo-logo.png',
  '/nexpo-favicon.ico',
  '/pdf.worker.min.js',
  '/embed.js'
];

// API endpoints to cache
const API_CACHE = [
  '/api/events',
  '/api/translations',
  '/api/pdf-proxy'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // HTML pages - network first, fallback to cache
    event.respondWith(handleDocumentRequest(request));
  } else if (request.destination === 'image' || request.destination === 'style' || request.destination === 'script') {
    // Static assets - cache first, fallback to network
    event.respondWith(handleStaticAssetRequest(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API requests - network first, fallback to cache
    event.respondWith(handleAPIRequest(request));
  } else {
    // Default - network first
    event.respondWith(fetch(request));
  }
});

// Handle HTML document requests
async function handleDocumentRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Clone response for caching
    const responseClone = networkResponse.clone();
    
    // Cache the response
    caches.open(DYNAMIC_CACHE).then(cache => {
      cache.put(request, responseClone);
    });
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline page
    return caches.match('/');
  }
}

// Handle static asset requests
async function handleStaticAssetRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache the response
    const responseClone = networkResponse.clone();
    caches.open(DYNAMIC_CACHE).then(cache => {
      cache.put(request, responseClone);
    });
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    // Return a default response or null
    return new Response('', { status: 404 });
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Clone response for caching
    const responseClone = networkResponse.clone();
    
    // Cache successful responses
    if (networkResponse.ok) {
      caches.open(DYNAMIC_CACHE).then(cache => {
        cache.put(request, responseClone);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for API:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(JSON.stringify({ 
      error: 'Network unavailable',
      message: 'Please check your internet connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Get offline form data from IndexedDB
    const offlineData = await getOfflineFormData();
    
    if (offlineData && offlineData.length > 0) {
      console.log('[SW] Syncing offline data:', offlineData.length, 'items');
      
      // Process each offline submission
      for (const data of offlineData) {
        try {
          await syncOfflineSubmission(data);
          await removeOfflineData(data.id);
        } catch (error) {
          console.error('[SW] Failed to sync offline data:', error);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Helper functions for offline data management
async function getOfflineFormData() {
  // This would integrate with IndexedDB
  // For now, return empty array
  return [];
}

async function syncOfflineSubmission(data) {
  // This would send the offline data to the server
  // For now, just log it
  console.log('[SW] Syncing offline submission:', data);
}

async function removeOfflineData(id) {
  // This would remove synced data from IndexedDB
  console.log('[SW] Removing synced offline data:', id);
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from Nexpo',
      icon: '/nexpo-logo-192.png',
      badge: '/nexpo-logo-192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/nexpo-logo-192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/nexpo-logo-192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Nexpo Event Registration', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

console.log('[SW] Service Worker loaded successfully');

