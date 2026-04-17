'use client'

/**
 * Verificar2FA — NexoLibre
 *
 * Pantalla post-login que verifica si el usuario necesita completar 2FA.
 *
 * Flujo:
 * 1. Llama a getAuthenticatorAssuranceLevel()
 * 2. Si currentLevel=aal1 y nextLevel=aal2 → muestra input TOTP
 * 3. Si currentLevel=aal1 y nextLevel=aal1 → redirige a /panel (sin 2FA)
 * 4. Si currentLevel=aal2 → redirige a /panel (ya verificado)
 *
 * IMPORTANTE: La API de MFA es client-side — requiere el browser client.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Verificar2FA() {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [verificando, setVerificando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  /* ── Verificar nivel de autenticación al montar ─────────────────────── */
  useEffect(() => {
    async function verificarAAL() {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      if (error) {
        // Si no hay sesión, redirigir al login
        router.replace('/iniciar-sesion')
        return
      }

      if (!data) {
        router.replace('/iniciar-sesion')
        return
      }

      // Si ya tiene aal2 o no necesita 2FA → directo al panel
      if (data.nextLevel === 'aal1' || data.currentLevel === data.nextLevel) {
        router.replace('/panel')
        return
      }

      // Necesita verificación TOTP (currentLevel=aal1, nextLevel=aal2)
      setCargando(false)
    }

    verificarAAL()
  }, [supabase, router])

  /* ── Verificar código TOTP ──────────────────────────────────────────── */
  const verificarCodigo = useCallback(async () => {
    setError(null)
    setVerificando(true)

    try {
      // 1. Obtener el factor TOTP del usuario
      const { data: factoresData, error: factoresError } =
        await supabase.auth.mfa.listFactors()

      if (factoresError) {
        setError(factoresError.message)
        setVerificando(false)
        return
      }

      const factorTotp = factoresData.totp[0]
      if (!factorTotp) {
        setError('No se encontró un factor TOTP configurado.')
        setVerificando(false)
        return
      }

      // 2. Crear challenge
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: factorTotp.id })

      if (challengeError) {
        setError(challengeError.message)
        setVerificando(false)
        return
      }

      // 3. Verificar el código
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorTotp.id,
        challengeId: challengeData.id,
        code: codigo,
      })

      if (verifyError) {
        setError('Código incorrecto. Verifica e intenta de nuevo.')
        setVerificando(false)
        return
      }

      // ✅ Verificación exitosa → redirigir al panel
      router.replace('/panel')
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
      setVerificando(false)
    }
  }, [codigo, supabase, router])

  /* ── UI: Estado de carga ────────────────────────────────────────────── */
  if (cargando) {
    return (
      <section className="w-full max-w-sm text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Verificando sesión…</p>
      </section>
    )
  }

  /* ── UI: Formulario TOTP ────────────────────────────────────────────── */
  return (
    <section className="w-full max-w-sm" aria-labelledby="titulo-2fa">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>
        <h1
          id="titulo-2fa"
          className="text-2xl font-bold tracking-tight text-foreground"
        >
          Verificación en dos pasos
        </h1>
        <p className="mt-2 text-sm text-muted">
          Ingresa el código de 6 dígitos de tu aplicación autenticadora
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          verificarCodigo()
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label
            htmlFor="codigo-totp"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Código TOTP
          </label>
          <input
            id="codigo-totp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            required
            placeholder="000000"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-center font-mono text-2xl tracking-[0.5em] text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            disabled={verificando}
            autoFocus
          />
        </div>

        {error && (
          <output
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            {error}
          </output>
        )}

        <button
          type="submit"
          disabled={verificando || codigo.length !== 6}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verificando ? 'Verificando…' : 'Verificar'}
        </button>
      </form>

      <footer className="mt-6 text-center text-xs text-muted">
        <p>Abre Google Authenticator, Authy o tu app de autenticación.</p>
      </footer>
    </section>
  )
}
