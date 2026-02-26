// Service Worker - Enables offline support and faster repeat loads
const CACHE_NAME = 'bytes-spicy-menu-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/menu.json',
  '/js/script.js',
  '/src/style.css',
  '/src/output.css',
  './src/input.css',
  './images/logo.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching core assets');
      return cache.addAll(ASSETS).catch(err => {
        console.log('⚠️ Cache addAll error (non-fatal):', err);
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('✨ Service Worker activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log('🗑️ Deleting old cache:', k);
            return caches.delete(k);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        console.log('💾 Cache hit:', event.request.url);
        return cachedResponse;
      }

      // Network-first for fresh data
      return fetch(event.request)
        .then(networkResponse => {
          // Check if we got a valid response
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Clone and cache it
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(fetchError => {
          console.log('❌ Fetch failed:', event.request.url, fetchError);
          
          // Try cache as fallback
          return caches.match(event.request).then(cachedFallback => {
            if (cachedFallback) {
              console.log('📚 Using cached fallback:', event.request.url);
              return cachedFallback;
            }
            
            // For images that fail, return nothing (browser shows broken image icon)
            // This is better than crashing the app
            console.log('⚠️ No cache, resource unavailable:', event.request.url);
            return undefined;
          });
        });
    })
  );
});

// Message handler for cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});