// Keeps a copy of the calculator on the device so it opens without internet.
// When online it loads the newest version; when offline it uses the saved copy.
const CACHE = 'discount-calc-v1';
const FILES = ['./', './index.html', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const fromCache = () => caches.match(e.request, { ignoreSearch: true })
    .then(r => r || caches.match('./index.html'));
  // try the internet first (max 3 seconds), fall back to the saved copy
  const fromNet = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject('slow'), 3000);
    fetch(e.request).then(res => {
      clearTimeout(t);
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      resolve(res);
    }, err => { clearTimeout(t); reject(err); });
  });
  e.respondWith(fromNet.catch(fromCache));
});
