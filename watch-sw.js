// OPS Watch — Service Worker
const CACHE = 'ops-watch-v1';
const ASSETS = ['/watch.html', '/watch-manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request)).catch(() => caches.match('/watch.html'))
  );
});

// ── PUSH NOTIFICATION HANDLER ──
self.addEventListener('push', e => {
  let data = { title: 'OPS Planner', body: 'Nueva notificación' };
  try { data = JSON.parse(e.data?.text() || '{}'); } catch {}

  e.waitUntil(self.registration.showNotification(data.title || 'OPS Planner', {
    body:    data.body || '',
    icon:    '/watch-icon-192.png',
    badge:   '/watch-icon-96.png',
    vibrate: [100, 50, 100],
    data:    { url: data.url || '/watch.html' },
    actions: [
      { action: 'open',    title: '📋 Ver tarea' },
      { action: 'dismiss', title: '✕ Descartar'  },
    ],
    tag:     'ops-planner',
    renotify: true,
  }));
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const url = e.notification.data?.url || '/watch.html';
      const existing = list.find(c => c.url.includes('watch'));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
