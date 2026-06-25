// Tabel PWA service worker — butun loyiha (admin CRM + ishchi davomat)
// app-shell offline + installability.
const CACHE = 'tabel-v2';
const OFFLINE_URL = '/offline';
const SHELL = [
  '/',
  '/login',
  '/admin',
  '/ish',
  '/ish/login',
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-icon.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Boshqa domenlar (CDN, Cloudinary, Telegram ...) — SW aralashmaydi
  if (url.origin !== self.location.origin) return;
  // API so'rovlari — har doim tarmoqdan (cache qilmaymiz)
  if (url.pathname.startsWith('/api/')) return;

  // Navigatsiya (sahifa) — network-first; oflaynda cache, bo'lmasa /offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Boshqa statik resurslar — cache-first, so'ng tarmoq
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(() => cached)
    )
  );
});
