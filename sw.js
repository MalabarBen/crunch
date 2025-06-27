// UPDATED cache version to v6 to force a refresh
const CACHE_NAME = 'rep-challenge-cache-v6'; 
const urlsToCache = [
  '/crunch/',
  '/crunch/index.html',
  '/crunch/style.css',
  '/crunch/script.js',
  '/crunch/manifest.json',
  '/crunch/icons/icon-192x192.png',
  '/crunch/icons/icon-512x512.png',
  '/crunch/icons/push-ups.png',
  '/crunch/icons/squats.png',
  '/crunch/icons/sit-ups.png',
  '/crunch/icons/punches.png',
  '/crunch/icons/tricep-dips.png',
  '/crunch/icons/step-ups.png',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
