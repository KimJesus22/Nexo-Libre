/**
 * Lógica del proxy de Supabase para Next.js 16.
 *
 * Refresca la sesión del usuario (token JWT) en cada petición
 * mediante cookies. Se invoca desde `src/proxy.ts`.
 *
 * Uso:
 *   import { updateSession } from '@/lib/supabase/proxy'
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: No usar getSession() aquí — no valida el JWT.
  // getUser() envía una petición al servidor de auth de Supabase
  // para verificar que el token sea válido.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirigir usuarios no autenticados que intentan acceder a rutas protegidas
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/iniciar-sesion') &&
    !request.nextUrl.pathname.startsWith('/registrarse') &&
    !request.nextUrl.pathname.startsWith('/verificar-correo') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname.startsWith('/panel')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/iniciar-sesion'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
