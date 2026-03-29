/**
 * Service Worker - Cache optimizado para Violet ERP
 * 
 * Estrategias:
 * - Network First para API calls
 * - Cache First para assets estáticos
 * - Stale While Revalidate para páginas
 */

const CACHE_VERSION = 'v3.0.0';
const CACHE_NAME = `violet-erp-${CACHE_VERSION}`;

// Assets que siempre deben estar en caché
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Patrones de URLs para diferentes estrategias
const CACHE_STRATEGIES = {
  // Cache First - Assets estáticos (JS, CSS, imágenes)
  cacheFirst: [
    /\.js$/,
    /\.css$/,
    /\.woff2?$/,
    /\.ttf$/,
    /\.eot$/,
    /\.svg$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.webp$/,
  ],
  
  // Network First - API calls
  networkFirst: [
    /\/api\//,
    /supabase/,
  ],
  
  // Stale While Revalidate - Páginas HTML
  staleWhileRevalidate: [
    /\.html$/,
  ],
};

/**
 * Install event - Precache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] ✅ Cache opened');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[SW] ✅ Static assets cached');
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - Clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] 🔄 Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] ✅ Service worker activated');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - Handle requests with appropriate strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine strategy based on URL
  let strategy = 'networkFirst'; // Default
  
  for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pattern.test(url.pathname))) {
      strategy = strategyName;
      break;
    }
  }
  
  // Apply strategy
  switch (strategy) {
    case 'cacheFirst':
      event.respondWith(cacheFirst(request));
      break;
    case 'networkFirst':
      event.respondWith(networkFirst(request));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

/**
 * Cache First Strategy
 * Try cache first, fallback to network
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] ❌ Fetch failed:', error);
    throw error;
  }
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] ⚠️ Network failed, trying cache:', error);
    
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((error) => {
    console.warn('[SW] ⚠️ Background fetch failed:', error);
  });
  
  // Return cached version immediately if available
  return cached || fetchPromise;
}

/**
 * Message event - Handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[SW] 🗑️ Cache cleared');
        return self.clients.claim();
      })
    );
  }
});

console.log('[SW] 🚀 Service Worker loaded');
