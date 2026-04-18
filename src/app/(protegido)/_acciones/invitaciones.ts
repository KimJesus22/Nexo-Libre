'use server'

/**
 * Server Actions de invitaciones seguras — NexoLibre
 *
 * Genera tokens criptográficos de un solo uso con expiración de 24h.
 * El token se genera con crypto.randomBytes (32 bytes = 64 hex chars).
 *
 * Flujo:
 *   1. Usuario autenticado invoca crearInvitacion()
 *   2. Se genera un token de 32 bytes (crypto.randomBytes)
 *   3. Se inserta en la tabla `invitaciones` con caduca_en = now() + 24h
 *   4. Se retorna la URL completa para copiar al portapapeles
 *
 * Seguridad:
 *   - Solo usuarios autenticados pueden generar invitaciones
 *   - Límite de 5 invitaciones activas por usuario (anti-spam)
 *   - El token se valida con regex ^[a-f0-9]{64}$ en DB
 *   - RLS: solo el creador puede ver sus invitaciones
 */

import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

/* ── Constantes ───────────────────────────────────────────────────────────── */
const MAX_INVITACIONES_ACTIVAS = 5

/* ── Generar invitación ───────────────────────────────────────────────────── */

export async function crearInvitacion(): Promise<
  { ok: true; url: string; token: string; caducaEn: string } |
  { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Debes iniciar sesión para generar invitaciones.' }
  }

  // Verificar límite de invitaciones activas (no usadas y no expiradas)
  const { count, error: errorConteo } = await supabase
    .from('invitaciones')
    .select('id', { count: 'exact', head: true })
    .eq('creador_id', user.id)
    .eq('usado', false)
    .gt('caduca_en', new Date().toISOString())

  if (errorConteo) {
    return { ok: false, error: 'Error al verificar invitaciones existentes.' }
  }

  if ((count ?? 0) >= MAX_INVITACIONES_ACTIVAS) {
    return {
      ok: false,
      error: `Límite alcanzado. Solo puedes tener ${MAX_INVITACIONES_ACTIVAS} invitaciones activas.`,
    }
  }

  // Generar token criptográfico (32 bytes = 64 hex chars)
  const token = randomBytes(32).toString('hex')

  // Insertar en la base de datos
  const { error: errorInsert } = await supabase
    .from('invitaciones')
    .insert({
      creador_id: user.id,
      token,
    })

  if (errorInsert) {
    return { ok: false, error: 'Error al crear la invitación.' }
  }

  // Construir URL de invitación
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/join/${token}`
  const caducaEn = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  return { ok: true, url, token, caducaEn }
}

/* ── Listar invitaciones del usuario ──────────────────────────────────────── */

export async function listarMisInvitaciones() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const, error: 'No autenticado.', invitaciones: [] }
  }

  const { data, error } = await supabase
    .from('invitaciones')
    .select('id, token, usado, caduca_en, creado_en, usado_en')
    .eq('creador_id', user.id)
    .order('creado_en', { ascending: false })
    .limit(20)

  if (error) {
    return { ok: false as const, error: error.message, invitaciones: [] }
  }

  const baseUrl = getBaseUrl()

  const invitaciones = (data ?? []).map((inv) => ({
    id: inv.id as string,
    token: inv.token as string,
    url: `${baseUrl}/join/${inv.token}`,
    usado: inv.usado as boolean,
    expirado: new Date(inv.caduca_en as string) < new Date(),
    caducaEn: inv.caduca_en as string,
    creadoEn: inv.creado_en as string,
    usadoEn: inv.usado_en as string | null,
  }))

  return { ok: true as const, invitaciones }
}

/* ── Utilidades ───────────────────────────────────────────────────────────── */

function getBaseUrl(): string {
  // 1. Prioridad: Variable explícita configurada por el usuario
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  
  // 2. Vercel: URL en producción o preview
  // Vercel inyecta VERCEL_URL y NEXT_PUBLIC_VERCEL_URL sin protocolo
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.NEXT_PUBLIC_VERCEL_URL
  if (vercelUrl) {
    return `https://${vercelUrl}`
  }

  // 3. Entorno de desarrollo local
  return 'http://localhost:3000'
}
