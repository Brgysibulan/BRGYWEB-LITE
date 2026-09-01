const CACHE_NAME = 'brgyweb-runtime-v2';
const CACHE_PREFIX = 'brgyweb-runtime-';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

function shouldHandle(request, url) {
  if (request.method !== 'GET' || url.origin !== self.location.origin) return false;
  if (request.mode === 'navigate') return true;
  if (['script','style','worker','document'].includes(request.destination)) return true;
  return /\.(?:html?|css|js)$/i.test(url.pathname) || /\/assets\/(?:css|js)\//.test(url.pathname);
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const freshRequest = new Request(request, { cache: 'no-store' });
    const response = await fetch(freshRequest);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const exact = await cache.match(request);
    if (exact) return exact;
    const relaxed = await cache.match(request, { ignoreSearch: true });
    if (relaxed) return relaxed;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!shouldHandle(event.request, url)) return;
  event.respondWith(networkFirst(event.request));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
