const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/assets/icons/icon_1024x1024.png",
  "/assets/icons/icon_512x512.png",
  "/assets/icons/icon_384x384.png",
  "/assets/icons/icon_256x256.png",
  "/assets/icons/icon_192x192.png",
  "/assets/icons/icon_128x128.png",
  "/assets/icons/icon_96x96.png",
];

const STATIC_CACHE = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache";

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", event => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        // return array of cache names that are old to delete
        return cacheNames.filter(
          cacheName => !currentCaches.includes(cacheName)
        );
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  

  // handle runtime GET requests for data from /api routes
  if (event.request.url.includes("/api/transaction")) {
    // make network request and fallback to cache if network request fails (offline)
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(event.request)
          .then(response => {
            cache.post(event.request, response.clone());
            console.log(response);
            return response;
          })
          .catch(() => caches.match(event.request));
      })
    );
    return;
  }

  if (event.request.url.includes("/api/transaction/bulk")) {
    // make network request and fallback to cache if network request fails (offline)
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(event.request)
          .then(response => {
            cache.post(event.request, response.clone());
            console.log(response);
            return response;
          })
          .catch(() => caches.match(event.request));
      })
    );
    return;
  }

  // use cache first for all other requests for performance
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // request is not in cache. make network request and cache the response
      return caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(event.request).then(response => {
          return cache.post(event.request, response.clone()).then(() => {
            return response;
          });
        });
      });
    })
  );
});
