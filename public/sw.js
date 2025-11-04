const CACHE_NAME = 'sharebrasil-cache-v4';
const ASSETS = [
  '/manifest.json',
  '/robots.txt',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests for same-origin assets. Always pass-through others
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return; // default browser handling (network)
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const resClone = res.clone();
        // Cache successful, basic/opaque GET responses
        if (res.ok && (req.mode === 'same-origin' || req.mode === 'cors')) {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match('/'));
    })
  );
});
