/**
 * Service Worker — NexoLibre PWA
 *
 * Estrategia de caché:
 *   - INSTALL: pre-cachea el shell de la app (HTML, CSS, fuentes)
 *   - FETCH: Cache-First para assets estáticos, Network-First para API/páginas
 *   - ACTIVATE: limpia cachés antiguas al actualizar la versión
 *
 * Versión del caché: incrementar CACHE_VERSION al hacer deploy
 * para forzar actualización de recursos.
 */

const CACHE_VERSION = 'nexolibre-v1'
const CACHE_STATIC = `${CACHE_VERSION}-static`
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`

/* ── Recursos del shell (pre-cacheados en install) ────────────────────────── */
const SHELL_RESOURCES = [
  '/',
  '/iniciar-sesion',
  '/registrarse',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

/* ── Patrones para cache-first (assets estáticos) ─────────────────────────── */
const STATIC_PATTERNS = [
  /\/_next\/static\//,       // JS/CSS chunks de Next.js
  /\/icon-\d+\.png$/,        // Íconos PWA
  /\.woff2?$/,               // Fuentes
  /\.svg$/,                  // SVGs
]

/* ── Patrones que NUNCA se cachean ─────────────────────────────────────────── */
const NO_CACHE_PATTERNS = [
  /\/api\//,                  // API routes
  /supabase\.co/,             // Supabase API
  /\/auth\//,                 // Auth callbacks
  /chrome-extension/,         // Extensiones del navegador
]

/* ── INSTALL: pre-cachear shell ───────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(SHELL_RESOURCES).catch((err) => {
        // No fallar si algún recurso del shell no está disponible en dev
        console.warn('SW: Error pre-cacheando shell:', err)
      })
    })
  )
  // Activar inmediatamente sin esperar a que se cierren tabs
  self.skipWaiting()
})

/* ── ACTIVATE: limpiar cachés antiguas ────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('nexolibre-') && key !== CACHE_STATIC && key !== CACHE_DYNAMIC)
          .map((key) => caches.delete(key))
      )
    })
  )
  // Tomar control de todas las tabs inmediatamente
  self.clients.claim()
})

/* ── FETCH: estrategia de caché inteligente ───────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo cachear GET requests
  if (request.method !== 'GET') return

  // No cachear requests excluidas
  if (NO_CACHE_PATTERNS.some((pattern) => pattern.test(url.href))) return

  // No cachear requests con credenciales a otros orígenes
  if (url.origin !== self.location.origin && request.credentials === 'include') return

  // Assets estáticos: Cache-First (rápido, inmutable)
  if (STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Páginas HTML: Network-First (contenido actualizado)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Todo lo demás: Network-First con fallback a cache
  event.respondWith(networkFirst(request))
})

/* ── Estrategia Cache-First ───────────────────────────────────────────────── */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

/* ── Estrategia Network-First ─────────────────────────────────────────────── */
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_DYNAMIC)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response('Offline', { status: 503 })
  }
}
