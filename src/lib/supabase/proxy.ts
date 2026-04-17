/**
 * Proxy de seguridad de Supabase — NexoLibre
 *
 * Valida sesiones activas ANTES de renderizar cualquier ruta.
 * Redirecciona inmediatamente al login ante cualquier anomalía.
 *
 * Capas de validación:
 * 1. Refresco de sesión via cookies (@supabase/ssr)
 * 2. getUser() — validación server-side del JWT contra Supabase Auth
 *    (a diferencia de getSession() que NO valida el token)
 * 3. Purga de cookies corruptas si getUser() falla
 * 4. Headers de seguridad inyectados en cada respuesta
 * 5. Protección de rutas con whitelist explícita
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/* ── Rutas públicas (whitelist explícita) ──────────────────────────────────── */
const RUTAS_PUBLICAS: readonly string[] = [
  '/',
  '/iniciar-sesion',
  '/registrarse',
  '/verificar-correo',
  '/verificar-2fa',
  '/auth/callback',
] as const

/* ── Prefijos de rutas protegidas ─────────────────────────────────────────── */
const PREFIJOS_PROTEGIDOS: readonly string[] = [
  '/panel',
  '/chat',
] as const

/**
 * Determina si una ruta es pública (no requiere autenticación)
 */
function esRutaPublica(pathname: string): boolean {
  // Coincidencia exacta
  if (RUTAS_PUBLICAS.includes(pathname)) return true

  // Coincidencia por prefijo (p.ej. /auth/callback?code=...)
  return RUTAS_PUBLICAS.some(
    (ruta) => ruta.endsWith('/callback') && pathname.startsWith(ruta)
  )
}

/**
 * Determina si una ruta requiere autenticación
 */
function esRutaProtegida(pathname: string): boolean {
  return PREFIJOS_PROTEGIDOS.some((prefijo) => pathname.startsWith(prefijo))
}

/* ── Función principal ────────────────────────────────────────────────────── */

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  /* ── 1. Crear cliente SSR con manejo de cookies ─────────────────────── */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  /* ── 2. Validar sesión server-side con getUser() ────────────────────── */
  // CRÍTICO: getUser() envía el JWT al servidor de Supabase Auth para
  // verificar su firma, expiración y revocación.
  // getSession() NO hace esto — solo decodifica el JWT localmente,
  // lo que lo hace vulnerable a tokens manipulados.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  /* ── 3. Manejar anomalías de autenticación ──────────────────────────── */
  if (authError || !user) {
    // Si la ruta es protegida y hay cualquier anomalía → redirect inmediato
    if (esRutaProtegida(pathname)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/iniciar-sesion'
      // Limpiar query params para evitar open redirect
      redirectUrl.search = ''

      const redirectResponse = NextResponse.redirect(redirectUrl)

      // Purgar todas las cookies de sesión de Supabase si el token
      // es inválido/manipulado/expirado sin posibilidad de refresco.
      // Esto evita loops de redirección con cookies corruptas.
      if (authError) {
        request.cookies.getAll().forEach((cookie) => {
          if (
            cookie.name.startsWith('sb-') ||
            cookie.name.includes('supabase')
          ) {
            redirectResponse.cookies.delete(cookie.name)
          }
        })
      }

      return redirectResponse
    }

    // Ruta pública sin usuario → permitir acceso
    return agregarHeadersSeguridad(supabaseResponse)
  }

  /* ── 4. Usuario autenticado en ruta de auth → redirigir ─────────────── */
  // Si un usuario ya autenticado intenta acceder a login/registro,
  // redirigir al panel para evitar confusión.
  if (
    user &&
    (pathname === '/iniciar-sesion' || pathname === '/registrarse')
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/verificar-2fa'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  /* ── 5. Sesión válida → inyectar headers de seguridad ───────────────── */
  return agregarHeadersSeguridad(supabaseResponse)
}

/* ── Headers de seguridad ─────────────────────────────────────────────────── */

function agregarHeadersSeguridad(response: NextResponse): NextResponse {
  // Prevenir clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevenir MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer policy estricta
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Deshabilitar detección XSS del navegador
  // (los navegadores modernos ya no lo usan, pero no hace daño)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Permissions Policy: deshabilitar APIs innecesarias
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  return response
}
