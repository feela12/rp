const MODEL_CACHE = 'iczz-model-cache-v1';
const CURRENT_CACHES = new Set([MODEL_CACHE]);
const KNOWN_MODEL_URLS = [
  'https://feela12.github.io/modely/finalmodel.glb',
  'https://feela12.github.io/modely/base_basic_shaded.glb',
  'https://feela12.github.io/modely/base_basic_shaded_rick-compressed.glb',
  'https://feela12.github.io/modely/XOm.glb',
  'https://feela12.github.io/modely/base_mm6.glb',
  'https://feela12.github.io/modely/Meshy_AI_YZY_WET_women_tank_to_0420200251_texture.glb',
  'https://feela12.github.io/modely/bear.glb',
  'https://feela12.github.io/modely/gradcd.glb',
  'https://feela12.github.io/modely/bully.glb'
];

function isModelRequest(request) {
  const url = new URL(request.url);
  return /\.(glb|gltf|bin)$/i.test(url.pathname);
}

async function cacheModelRequest(request) {
  const cache = await caches.open(MODEL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone());
  }

  return response;
}

async function warmModelCache(urls) {
  const cache = await caches.open(MODEL_CACHE);
  const uniqueUrls = Array.from(new Set([...KNOWN_MODEL_URLS, ...urls]));

  await Promise.allSettled(uniqueUrls.map(async (url) => {
    const cached = await cache.match(url);
    if (cached) return;

    const response = await fetch(url, { mode: 'cors' });
    if (response && (response.ok || response.type === 'opaque')) {
      await cache.put(url, response.clone());
    }
  }));
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => (
      CURRENT_CACHES.has(name) ? null : caches.delete(name)
    )));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (!isModelRequest(event.request)) return;
  event.respondWith(cacheModelRequest(event.request));
});

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'ICZZ_WARM_MODELS') return;
  event.waitUntil(warmModelCache(event.data.urls || []));
});
