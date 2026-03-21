const APP_SHELL_CACHE = 'man-mistery-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(['/', '/audio/fallback-investogador.mp3'])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || (!networkResponse.ok && networkResponse.type !== 'opaque')) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => caches.match('/') || caches.match('/audio/fallback-investogador.mp3'));
    }),
  );
});
