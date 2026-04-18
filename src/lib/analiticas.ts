/**
 * Analíticas — NexoLibre
 *
 * Módulo de analíticas ligero y respetuoso con la privacidad.
 * Utiliza Umami (umami.is) como proveedor:
 *
 * ✅ Sin cookies
 * ✅ Sin fingerprinting
 * ✅ Sin rastreo de IPs completas
 * ✅ Cumple con GDPR/CCPA sin banner de cookies
 * ✅ Código abierto y auto-hosteable
 *
 * Uso:
 *   import { trackEvento } from '@/lib/analiticas'
 *   trackEvento('clic_comenzar')
 *
 * Las analíticas están deshabilitadas si:
 *  - No se configura NEXT_PUBLIC_UMAMI_WEBSITE_ID
 *  - El usuario tiene Do Not Track activado
 *  - Es un entorno de desarrollo (localhost)
 */

/* ── Configuración ─────────────────────────────────────────────────────── */

/** URL del script de Umami Cloud (o self-hosted) */
export const UMAMI_SCRIPT_URL =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? 'https://cloud.umami.is/script.js'

/** Website ID asignado por Umami */
export const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? ''

/* ── Verificación de condiciones ───────────────────────────────────────── */

function analiticasActivas(): boolean {
  if (typeof window === 'undefined') return false

  // No trackear si no hay Website ID configurado
  if (!UMAMI_WEBSITE_ID) return false

  // Respetar Do Not Track del navegador
  if (navigator.doNotTrack === '1') return false

  // No trackear en desarrollo
  if (window.location.hostname === 'localhost') return false

  return true
}

/* ── API pública ──────────────────────────────────────────────────────── */

// Declarar la API global de Umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, string | number>) => void
    }
  }
}

/**
 * Registra un evento personalizado en Umami.
 * No hace nada si las analíticas están deshabilitadas.
 *
 * @param nombre - Nombre del evento (ej. 'clic_comenzar', 'registro_completado')
 * @param datos  - Datos adicionales opcionales
 */
export function trackEvento(
  nombre: string,
  datos?: Record<string, string | number>
): void {
  if (!analiticasActivas()) return

  try {
    window.umami?.track(nombre, datos)
  } catch {
    // Silenciar: las analíticas nunca deben romper la app
  }
}
