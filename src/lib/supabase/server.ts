/**
 * Cliente de Supabase para el servidor (Server Components / Server Actions / Route Handlers).
 *
 * Usa `createServerClient` de @supabase/ssr con cookies de `next/headers`.
 * Cada invocación genera una instancia nueva para evitar
 * compartir estado entre peticiones concurrentes.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║ AUDITORÍA DE SEGURIDAD:                                        ║
 * ║ • Usa PUBLISHABLE_KEY (anon) — NO service_role.                ║
 * ║ • Todas las operaciones pasan por RLS.                         ║
 * ║ • La sesión del usuario se refresca via cookies (@supabase/ssr)║
 * ║ • getUser() valida el JWT server-side contra Supabase Auth.    ║
 * ║ • NO existe ningún bypass de RLS en el código del servidor.    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Uso:
 *   import { createClient } from '@/lib/supabase/server'
 *   const supabase = await createClient()
 *
 * IMPORTANTE: Nunca importar en archivos con 'use client'.
 */

import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // `setAll` puede fallar si se llama desde un Server Component.
            // Esto se puede ignorar si tenemos el proxy para refrescar sesiones.
          }
        },
      },
    }
  )
}
