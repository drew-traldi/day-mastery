// Offline support. Bump VERSION whenever you publish, so phones pick up the new files.
// The app shows an "Update" button when a new version is ready.
const VERSION = 'dm-e4bfc0c37c';
const FONTS = 'dm-fonts';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/store.js', 'js/ui.js',
  'js/tools/index.js', 'js/tools/plan.js', 'js/tools/focus.js', 'js/tools/habits.js', 'js/tools/hydrate.js',
  'js/tools/breathe.js', 'js/tools/sleep.js', 'js/tools/journal.js', 'js/tools/sounds.js',
  'js/views/today.js', 'js/views/growth.js', 'js/views/more.js', 'js/views/settings.js', 'js/views/onboarding.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS))));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== VERSION && k !== FONTS) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // App files come from this version's cache, so every file matches; the network fills any gaps.
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
  } else if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
