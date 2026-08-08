const CACHE = 'helena-v20';

self.addEventListener('install', e => {
  // Installer med det samme - ingen wachting
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Slet alle gamle caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML filer og API-kald: ALTID fra netværk
  if (url.pathname.endsWith('.html') || url.pathname.includes('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Fonts og statiske filer: cache-first
  if (url.hostname.includes('fonts.googleapis') || url.hostname.includes('fonts.gstatic')) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
      )
    );
    return;
  }

  // Alt andet: netværk first
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
