/**
 * Página de invitación — /join/[token]
 *
 * Ruta PÚBLICA que consume una invitación de un solo uso.
 *
 * Flujo:
 *   1. Valida el formato del token (64 hex chars)
 *   2. Si el usuario NO está autenticado → muestra CTA para registrarse
 *      con el token preservado en la URL para usar después del registro
 *   3. Si el usuario ESTÁ autenticado → consume la invitación via RPC
 *   4. Redirige al chat o muestra error si la invitación es inválida
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/* ── Regex de validación del token ────────────────────────────────────────── */
const TOKEN_REGEX = /^[a-f0-9]{64}$/

export default async function PaginaInvitacion({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // 1. Validar formato del token
  if (!TOKEN_REGEX.test(token)) {
    return <PantallaError mensaje="El enlace de invitación no es válido." />
  }

  // 2. Verificar autenticación
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si no está autenticado, mostrar pantalla de bienvenida
  if (!user) {
    return <PantallaBienvenida token={token} />
  }

  // 3. Consumir la invitación via RPC
  const { data, error } = await supabase.rpc('usar_invitacion', {
    p_token: token,
  })

  if (error || !data?.ok) {
    const mensaje = data?.error ?? 'La invitación ha expirado o ya fue utilizada.'
    return <PantallaError mensaje={mensaje} autenticado />
  }

  // 4. Éxito → redirigir al chat
  redirect('/chat')
}

/* ── Pantalla de bienvenida (no autenticado) ──────────────────────────────── */
function PantallaBienvenida({ token }: { token: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      {/* Glow de fondo */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Icono */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          Has recibido una invitación
        </h1>
        <p className="mt-3 text-foreground-secondary">
          Alguien te ha invitado a{' '}
          <span className="font-semibold text-foreground">
            Nexo<span className="text-accent">Libre</span>
          </span>
          . Crea una cuenta o inicia sesión para aceptarla.
        </p>

        {/* Indicador de seguridad */}
        <div className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs text-accent">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Enlace de un solo uso · Caduca en 24h
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/registrarse?invite=${token}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_var(--accent-glow)] active:scale-[0.98]"
          >
            Crear cuenta
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href={`/iniciar-sesion?invite=${token}`}
            className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground-secondary transition-all hover:border-accent/50 hover:text-foreground hover:bg-surface-elevated"
          >
            Ya tengo cuenta
          </Link>
        </div>

        {/* Token truncado */}
        <p className="mt-8 text-[10px] font-mono text-muted">
          Token: {token.slice(0, 12)}…{token.slice(-8)}
        </p>
      </div>
    </main>
  )
}

/* ── Pantalla de error ────────────────────────────────────────────────────── */
function PantallaError({
  mensaje,
  autenticado = false,
}: {
  mensaje: string
  autenticado?: boolean
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {/* Icono de error */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-foreground">
          Invitación no válida
        </h1>
        <p className="mt-3 text-sm text-foreground-secondary">
          {mensaje}
        </p>

        <div className="mt-8">
          <Link
            href={autenticado ? '/panel' : '/registrarse'}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover"
          >
            {autenticado ? 'Ir al panel' : 'Registrarse'}
          </Link>
        </div>
      </div>
    </main>
  )
}
