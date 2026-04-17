'use server'

/**
 * Server Actions de autenticación — NexoLibre
 *
 * Todas las operaciones de auth se ejecutan en el servidor,
 * usando el cliente de Supabase con cookies para mantener la sesión.
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

/* ── Magic Link ──────────────────────────────────────────────────────────── */

export async function iniciarSesionConMagicLink(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'El correo electrónico es obligatorio.' }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : ''}${getBaseUrl()}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/verificar-correo')
}

/* ── Email + Contraseña: Iniciar sesión ──────────────────────────────────── */

export async function iniciarSesionConCorreo(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'El correo y la contraseña son obligatorios.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/panel')
}

/* ── Email + Contraseña: Registrarse ─────────────────────────────────────── */

export async function registrarConCorreo(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'El correo y la contraseña son obligatorios.' }
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
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
