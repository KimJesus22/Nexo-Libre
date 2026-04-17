/**
 * Callback de autenticación — /auth/callback
 *
 * Route Handler que intercambia el código de autenticación
 * por una sesión válida. Supabase redirige aquí después de
 * que el usuario hace clic en un Magic Link o confirma su email.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║ SEGURIDAD: Anti-Open-Redirect                                  ║
 * ║ • El parámetro `next` se valida contra una whitelist estática.  ║
 * ║ • Solo se permiten rutas internas relativas (empiezan con /).   ║
 * ║ • Se rechaza cualquier URL absoluta o protocolo externo.        ║
 * ║ • Fallback seguro: /panel                                      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/* ── Rutas internas permitidas como destino post-auth ──────────────────────── */
const DESTINOS_PERMITIDOS: readonly string[] = [
  '/panel',
  '/chat',
  '/ajustes',
] as const

const DESTINO_POR_DEFECTO = '/panel'

/**
 * Valida que el parámetro `next` sea una ruta interna segura.
 *
 * Rechaza:
 *   - URLs absolutas (https://evil.com)
 *   - Protocol-relative URLs (//evil.com)
 *   - Rutas con backslash (\evil.com — bypass en Windows)
 *   - Rutas que no empiecen con /
 *   - Rutas que no coincidan con la whitelist
 */
function validarDestino(next: string | null): string {
  if (!next) return DESTINO_POR_DEFECTO

  // Normalizar: trim y decodificar
  const destino = decodeURIComponent(next).trim()

  // Rechazar vacíos
  if (!destino) return DESTINO_POR_DEFECTO

  // Rechazar URLs absolutas y protocol-relative
  // (cualquier cosa que no empiece con exactamente una /)
  if (!destino.startsWith('/') || destino.startsWith('//') || destino.startsWith('/\\')) {
    return DESTINO_POR_DEFECTO
  }

  // Rechazar si contiene protocolo embebido
  if (/[a-z]+:/i.test(destino)) {
    return DESTINO_POR_DEFECTO
  }

  // Extraer solo el pathname (sin query params ni hash)
  const pathname = destino.split('?')[0].split('#')[0]

  // Verificar contra whitelist de prefijos permitidos
  const esPermitido = DESTINOS_PERMITIDOS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  )

  if (!esPermitido) return DESTINO_POR_DEFECTO

  // Retornar solo el pathname limpio (sin query/hash del atacante)
  return pathname
}

/* ── Route Handler ────────────────────────────────────────────────────────── */

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Validar destino ANTES de cualquier operación
  const destino = validarDestino(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirigir al destino validado (ruta interna segura)
      return NextResponse.redirect(`${origin}${destino}`)
    }
  }

  // Si hay error o no hay código, redirigir al login
  // No incluir detalles del error en la URL (información para atacantes)
  return NextResponse.redirect(`${origin}/iniciar-sesion?error=enlace-invalido`)
}
