/**
 * CivicGuide Service Worker
 * Provides offline-first caching, background sync, and PWA capabilities.
 * Integrates with Firebase for push notifications (future extension).
 */

const CACHE_NAME = 'civicguide-v2.1.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/banner-animated.svg',
  './assets/logo.svg'
];

/* ── Install: pre-cache static assets ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Partial failure is acceptable — cache what we can
      });
    }).then(() => self.skipWaiting())
  );
});

/* ── Activate: clean old caches ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
           .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: network-first for API calls, cache-first for static ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept third-party API calls (Anthropic, Google APIs, Firebase)
  const passThrough = [
    'api.anthropic.com',
    'googleapis.com',       // Maps, Civic, BigQuery, NLP, Gemini APIs
    'gstatic.com',
    'firebase',
    'firestore',
    'fonts.googleapis.com',
    'translate.google.com',
    'maps.googleapis.com',
    'language.googleapis.com',      // Cloud Natural Language API
    'bigquery.googleapis.com',      // BigQuery Streaming Inserts
    'generativelanguage.googleapis.com', // Gemini (Vertex AI)
    'cloudfunctions.net'            // Cloud Functions
  ];
  if (passThrough.some((domain) => url.hostname.includes(domain))) return;

  // Network-first for HTML navigation (always fresh)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, images)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Return offline fallback for navigation
      if (request.destination === 'document') return caches.match('./index.html');
    })
  );
});

/* ── Background Sync: queue civic API lookups while offline ── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'civicguide-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_COMPLETE' }));
      })
    );
  }
});

/* ── Push: election reminders (future feature) ── */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'CivicGuide', {
      body: data.body || 'Check your election information.',
      icon: './assets/icon-192.png',
      badge: './assets/icon-192.png',
      tag: 'civicguide-reminder',
      renotify: false,
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes('civicguide'));
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    })
  );
});
