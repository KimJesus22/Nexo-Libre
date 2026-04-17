/**
 * Callback de autenticación — /auth/callback
 *
 * Route Handler que intercambia el código de autenticación
 * por una sesión válida. Supabase redirige aquí después de
 * que el usuario hace clic en un Magic Link o confirma su email.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/panel'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si hay error o no hay código, redirigir al login con mensaje
  return NextResponse.redirect(
    `${origin}/iniciar-sesion?error=No se pudo verificar el enlace. Intenta de nuevo.`
  )
}
