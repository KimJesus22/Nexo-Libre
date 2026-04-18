import { headers } from 'next/headers'
import { createClient } from './supabase/server'

/**
 * Utility to rate limit requests based on IP address using Supabase RPC.
 *
 * @param actionKey - A unique string for the action being limited (e.g. 'magic_link', 'crear_invitacion')
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMinutes - The time window in minutes
 * @returns { ok: true } if allowed, { ok: false, error: string } if rate limited
 */
export async function checkRateLimit(
  actionKey: string,
  maxRequests: number = 3,
  windowMinutes: number = 15
): Promise<{ ok: boolean; error?: string }> {
  try {
    const requestHeaders = await headers()
    // Obtener IP real del usuario (soporta proxys como Vercel o Cloudflare)
    const ip =
      requestHeaders.get('x-forwarded-for')?.split(',')[0] ||
      requestHeaders.get('x-real-ip') ||
      'unknown-ip'

    if (ip === 'unknown-ip') {
      // Si no se puede determinar la IP, por seguridad se permite (o podrías denegarlo)
      return { ok: true }
    }

    const supabase = await createClient()

    const { data: allowed, error } = await supabase.rpc('check_rate_limit', {
      p_action_key: actionKey,
      p_ip: ip,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    })

    if (error) {
      console.error('Error al verificar rate limit:', error)
      // En caso de error de DB, permitimos para no bloquear a usuarios legítimos por fallo técnico
      return { ok: true }
    }

    if (!allowed) {
      return {
        ok: false,
        error: `Demasiadas solicitudes. Por favor, intenta de nuevo en ${windowMinutes} minutos.`,
      }
    }

    return { ok: true }
  } catch (err) {
    console.error('Excepción al verificar rate limit:', err)
    return { ok: true }
  }
}
