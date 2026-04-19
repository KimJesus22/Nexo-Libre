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
import { checkRateLimit } from '@/lib/rateLimit'

/* ── Constantes ───────────────────────────────────────────────────────────── */
const MAX_INVITACIONES_ACTIVAS = 5

/* ── Generar invitación ───────────────────────────────────────────────────── */

export async function crearInvitacion(): Promise<
  { ok: true; url: string; token: string; caducaEn: string; id: string } |
  { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Debes iniciar sesión para generar invitaciones.' }
  }

  // Rate Limiting: Máximo 3 intentos por IP cada 15 minutos (anti-spam de peticiones)
  const rateLimit = await checkRateLimit('crear_invitacion', 3, 15)
  if (!rateLimit.ok) {
    return { ok: false, error: rateLimit.error as string }
  }

  // Obtener username o email para el slug
  let slugBase = user.email ? user.email.split('@')[0] : 'usuario'
  const { data: perfil } = await supabase.from('perfiles').select('nombre_usuario').eq('id', user.id).single()
  if (perfil?.nombre_usuario) {
    slugBase = perfil.nombre_usuario
  }
  slugBase = slugBase.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()

  // Buscar si el usuario YA tiene una invitacion activa (no usada, no expirada)
  const { data: existente } = await supabase
    .from('invitaciones')
    .select('id, token, slug, caduca_en')
    .eq('creador_id', user.id)
    .eq('usado', false)
    .gt('caduca_en', new Date().toISOString())
    .order('creado_en', { ascending: false })
    .limit(1)
    .single()

  if (existente) {
    const enlaceSlug = existente.slug || existente.token
    const url = `${getBaseUrl()}/join/${enlaceSlug}`
    return { ok: true, url, token: enlaceSlug, caducaEn: existente.caduca_en, id: existente.id }
  }

  // Verificar límite de invitaciones activas
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

  // Comprobar colisión del slug
  let slugFinal = slugBase
  const { data: colision } = await supabase.from('invitaciones').select('id').eq('slug', slugFinal).maybeSingle()
  if (colision) {
    slugFinal = `${slugBase}-${randomBytes(2).toString('hex')}`
  }

  // Generar token criptográfico subyacente (por si acaso o para retrocompatibilidad)
  const token = randomBytes(32).toString('hex')

  // Insertar en la base de datos
  const { data: insertData, error: errorInsert } = await supabase
    .from('invitaciones')
    .insert({
      creador_id: user.id,
      token,
      slug: slugFinal
    })
    .select('id')
    .single()

  if (errorInsert) {
    return { ok: false, error: 'Error al crear la invitación.' }
  }

  // Construir URL de invitación
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/join/${slugFinal}`
  const caducaEn = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  return { ok: true, url, token: slugFinal, caducaEn, id: insertData.id as string }
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
    .select('id, token, slug, usado, caduca_en, creado_en, usado_en')
    .eq('creador_id', user.id)
    .order('creado_en', { ascending: false })
    .limit(20)

  if (error) {
    return { ok: false as const, error: error.message, invitaciones: [] }
  }

  const baseUrl = getBaseUrl()

  const invitaciones = (data ?? []).map((inv) => {
    const enlaceSlug = inv.slug || inv.token
    return {
      id: inv.id as string,
      token: enlaceSlug, // Enviar el slug como identificador principal
      url: `${baseUrl}/join/${enlaceSlug}`,
      usado: inv.usado as boolean,
      expirado: new Date(inv.caduca_en as string) < new Date(),
      caducaEn: inv.caduca_en as string,
      creadoEn: inv.creado_en as string,
      usadoEn: inv.usado_en as string | null,
    }
  })

  return { ok: true as const, invitaciones }
}

/* ── Revocar/Eliminar invitación ────────────────────────────────────────────── */

export async function revocarInvitacion(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const, error: 'No autenticado.' }
  }

  const { error } = await supabase
    .from('invitaciones')
    .delete()
    .eq('id', id)
    .eq('creador_id', user.id)

  if (error) {
    return { ok: false as const, error: error.message }
  }

  return { ok: true as const }
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
