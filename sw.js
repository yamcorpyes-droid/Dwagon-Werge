/* ==========================================================================
   OFFLINE SUPPORT (service worker)
   Saves every game file on the device the first time the game is opened, so
   it keeps working with no internet. When online, it quietly fetches newer
   files in the background; they're used the next time the game starts.

   When you add or rename a file, add it to FILES and bump CACHE.
   ========================================================================== */
const CACHE = 'dwagon-merge-v6';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'js/config.js',
  'js/data/items.js', 'js/data/dwagons.js', 'js/data/worlds.js', 'js/data/levels.js', 'js/data/quests.js',
  'js/engine/catalog.js', 'js/engine/state.js', 'js/engine/rules.js', 'js/engine/healing.js',
  'js/engine/timers.js', 'js/engine/dwagons.js', 'js/engine/enemies.js', 'js/engine/input.js',
  'js/render/draw.js', 'js/ui/panels.js', 'js/ui/map.js', 'js/ui/editor.js', 'js/engine/sound.js', 'js/engine/save.js',
  'js/main.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// throw away caches from older versions
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// answer from the saved copy straight away, and refresh that copy in the background
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const saved = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request)
      .then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; })
      .catch(() => saved);
    if (saved) { e.waitUntil(fresh.catch(() => {})); return saved; }
    return fresh;
  }));
});
