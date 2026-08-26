const CACHE_NAME = 'alma-salon-v5';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=5',
  './manifest.webmanifest',
  './icons/icon.svg',
  './js/game.js?v=5',
  './js/characters.js?v=5',
  './js/audio.js?v=5',
  './js/storage.js?v=5',
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

// Network-first: always prefer the latest deployed files when online,
// and only fall back to the cache when the network is unavailable
// (so the game still works offline once it's been opened before).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
