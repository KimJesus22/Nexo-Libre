/**
 * Tipos de la base de datos de Supabase.
 *
 * Este archivo se genera automáticamente con el CLI de Supabase:
 *   pnpm supabase gen types typescript --project-id <tu-project-id> > src/lib/supabase/types.ts
 *
 * Mientras tanto, se exporta un esqueleto base para que los clientes
 * puedan tiparse correctamente sin errores de compilación.
 */

export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
