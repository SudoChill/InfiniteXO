self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Do not cache API; pass-through
  if (new URL(request.url).pathname.startsWith('/api/')) return
  // Default: network first, fallback to cache if offline
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})


