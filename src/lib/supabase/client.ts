/**
 * Cliente de Supabase para el navegador (Client Components).
 *
 * Usa `createBrowserClient` de @supabase/ssr para manejar
 * sesiones con cookies automáticamente.
 *
 * Uso:
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
