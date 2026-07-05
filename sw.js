const CACHE_NAME = 'fleet-mgmt-v1'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
]

// ── Install: cache الملفات الأساسية ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate: احذف الـ cache القديم ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: Network First للـ API، Cache First للباقي ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Firebase / Cloudinary / Supabase — دايماً من الشبكة
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('cloudinary') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('fonts.g')
  ) {
    event.respondWith(fetch(event.request))
    return
  }

  // باقي الطلبات: Network First مع Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
