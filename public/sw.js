/**
 * Service Worker — NexoLibre PWA
 *
 * Estrategia de caché:
 *   - INSTALL: pre-cachea el shell de la app (HTML, CSS, fuentes, offline page)
 *   - FETCH: Cache-First para assets estáticos, Network-First para API/páginas
 *   - ACTIVATE: limpia cachés antiguas al actualizar la versión
 *   - OFFLINE: redirige a /offline cuando no hay conexión ni caché
 *
 * Versión del caché: incrementar CACHE_VERSION al hacer deploy
 * para forzar actualización de recursos.
 */

const CACHE_VERSION = 'nexolibre-v2'
const CACHE_STATIC = `${CACHE_VERSION}-static`
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`
const OFFLINE_URL = '/offline'

/* ── Recursos del shell (pre-cacheados en install) ────────────────────────── */
const SHELL_RESOURCES = [
  '/',
  '/iniciar-sesion',
  '/registrarse',
  OFFLINE_URL,
  '/manifest.webmanifest',
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
  /\/_next\/data\//,          // Next.js data fetches (keep fresh)
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

  // Páginas HTML (navigation requests): Network-First con fallback a /offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // Assets estáticos: Cache-First (rápido, inmutable)
  if (STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request))
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

/* ── Estrategia Network-First con fallback a página offline ───────────────── */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request)
    if (response.ok || response.type === 'opaqueredirect') {
      // Cachear la página para futuras visitas offline
      const cache = await caches.open(CACHE_DYNAMIC)
      cache.put(request, response.clone())
      return response
    }
    // Si la respuesta no es OK (e.g. 404), devolverla tal cual
    return response
  } catch {
    // Sin conexión — intentar desde caché
    const cached = await caches.match(request)
    if (cached) return cached

    // Sin caché — mostrar página offline pre-cacheada
    const offlinePage = await caches.match(OFFLINE_URL)
    if (offlinePage) return offlinePage

    // Último recurso: respuesta genérica
    return new Response(
      '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Sin conexión</title></head><body style="background:#09090b;color:#fafafa;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui"><div style="text-align:center"><h1>Sin conexión</h1><p>Verifica tu conexión e intenta de nuevo.</p><button onclick="location.reload()" style="margin-top:1rem;padding:.75rem 1.5rem;background:#10b981;color:#022c22;border:none;border-radius:.75rem;cursor:pointer;font-weight:500">Reintentar</button></div></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }
}
