/**
 * Barrel export de los clientes de Supabase.
 *
 * NOTA: No re-exportar el módulo `server.ts` ni `proxy.ts` desde aquí,
 * ya que contienen la directiva `import 'server-only'` o lógica de servidor
 * y provocarían errores si se importan en un Client Component.
 *
 * Importar directamente:
 *   import { createClient } from '@/lib/supabase/server'  // servidor
 *   import { createClient } from '@/lib/supabase/client'  // navegador
 */

export { createClient } from './client'
export type { Database } from './types'
