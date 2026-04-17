'use server'

/**
 * Server Actions de autenticación — NexoLibre
 *
 * Todas las operaciones de auth se ejecutan en el servidor,
 * usando el cliente de Supabase con cookies para mantener la sesión.
 *
 * Validación: Zod valida todos los inputs ANTES de tocar Supabase.
 *   - Correos: formato RFC 5322, trim + lowercase
 *   - Contraseñas: 8-128 caracteres
 *
 * Métodos disponibles:
 * - iniciarSesionConMagicLink — envia enlace mágico al correo
 * - iniciarSesionConCorreo    — login con email + contraseña
 * - registrarConCorreo        — registro con email + contraseña
 * - cerrarSesion              — cierra la sesión activa
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  esquemaMagicLink,
  esquemaInicioSesion,
  esquemaRegistro,
  validarFormData,
} from '@/lib/validacion'

/* ── Magic Link ──────────────────────────────────────────────────────────── */

export async function iniciarSesionConMagicLink(formData: FormData) {
  // Validar con Zod ANTES de interactuar con Supabase
  const resultado = validarFormData(esquemaMagicLink, formData)

  if (!resultado.success) {
    return { error: resultado.error }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: resultado.data.email,
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/verificar-correo')
}

/* ── Email + Contraseña: Iniciar sesión ──────────────────────────────────── */

export async function iniciarSesionConCorreo(formData: FormData) {
  const resultado = validarFormData(esquemaInicioSesion, formData)

  if (!resultado.success) {
    return { error: resultado.error }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: resultado.data.email,
    password: resultado.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/verificar-2fa')
}

/* ── Email + Contraseña: Registrarse ─────────────────────────────────────── */

export async function registrarConCorreo(formData: FormData) {
  const resultado = validarFormData(esquemaRegistro, formData)

  if (!resultado.success) {
    return { error: resultado.error }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: resultado.data.email,
    password: resultado.data.password,
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/verificar-correo')
}

/* ── Cerrar sesión ───────────────────────────────────────────────────────── */

export async function cerrarSesion() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/iniciar-sesion')
}

/* ── Utilidades ──────────────────────────────────────────────────────────── */

function getBaseUrl(): string {
  // En producción, usa la variable de entorno o el dominio configurado
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  // En desarrollo, usa localhost
  return 'http://localhost:3000'
}
