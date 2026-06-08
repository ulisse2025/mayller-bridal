// ============================================================
// MAYLLER PHONE — service worker (scoped to /admin/phone)
// pronovias/public/sw-phone.js
//
// Registered with scope '/admin/phone' from RegisterSW.tsx, so it
// only ever controls the dashboard — never the public marketing
// site. Strategy:
//   - /api/admin/phone/*  -> network-first, fall back to cache
//                            (offline shows the last fetched data)
//   - shell + icons       -> cache-first, refresh in background
// ============================================================

const CACHE = 'mayller-phone-v1';
const SHELL = [
  '/admin/phone',
  '/icons/mayller-phone-192.png',
  '/icons/mayller-phone-512.png',
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
  if (url.origin !== self.location.origin) return;

  const inScope =
    url.pathname.startsWith('/admin/phone') || url.pathname.startsWith('/icons/');
  if (!inScope) return;

  // Data: network-first so the dashboard is fresh online, cached offline.
  if (url.pathname.startsWith('/api/admin/phone')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || Response.error()))
    );
    return;
  }

  // Shell / assets: cache-first, update in the background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    })
  );
});
