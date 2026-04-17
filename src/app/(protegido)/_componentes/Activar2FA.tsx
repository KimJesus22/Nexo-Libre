'use client'

/**
 * Activar2FA — NexoLibre
 *
 * Componente de enrolamiento TOTP:
 * 1. Llama a enroll() → genera QR code SVG
 * 2. Muestra el QR + secret como texto
 * 3. Pide código de verificación
 * 4. Llama a challenge() + verify() para confirmar
 *
 * IMPORTANTE: Usa el browser client (API MFA es client-side).
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PropiedadesActivar2FA {
  /** Callback cuando el enrolamiento se completa con éxito */
  alActivar: () => void
  /** Callback cuando el usuario cancela */
  alCancelar: () => void
}

export default function Activar2FA({ alActivar, alCancelar }: PropiedadesActivar2FA) {
  const [factorId, setFactorId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verificando, setVerificando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const supabase = createClient()

  /* ── Enrolar factor TOTP al montar ──────────────────────────────────── */
  useEffect(() => {
    async function enrolar() {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })

      if (error) {
        setError(error.message)
        setCargando(false)
        return
      }

      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setCargando(false)
    }

    enrolar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Verificar código para confirmar enrolamiento ───────────────────── */
  const confirmarEnrolamiento = useCallback(async () => {
    setError(null)
    setVerificando(true)

    try {
      // 1. Crear challenge
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId })

      if (challengeError) {
        setError(challengeError.message)
        setVerificando(false)
        return
      }

      // 2. Verificar el código
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: codigo,
      })

      if (verifyError) {
        setError('Código incorrecto. Asegúrate de haber escaneado el QR correctamente.')
        setVerificando(false)
        return
      }

      // ✅ Factor activado exitosamente
      alActivar()
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
      setVerificando(false)
    }
  }, [codigo, factorId, supabase, alActivar])

  /* ── UI: Cargando ───────────────────────────────────────────────────── */
  if (cargando) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-muted">Generando código QR…</p>
      </div>
    )
  }

  /* ── UI: Formulario de enrolamiento ─────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h2 className="text-lg font-bold text-foreground">
          Activar autenticación en dos pasos
        </h2>
        <p className="mt-1 text-sm text-muted">
          Escanea el código QR con tu aplicación autenticadora
        </p>
      </header>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="rounded-2xl border border-border bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCode}
            alt="Código QR para autenticación TOTP"
            className="h-48 w-48"
          />
        </div>
      </div>

      {/* Secret como texto plano (fallback) */}
      <details className="rounded-lg border border-border bg-surface p-3">
        <summary className="cursor-pointer text-xs font-medium text-muted hover:text-foreground">
          ¿No puedes escanear? Ingresa el código manualmente
        </summary>
        <p className="mt-2 select-all break-all rounded-md bg-background px-3 py-2 font-mono text-xs text-foreground">
          {secret}
        </p>
      </details>

      {/* Input de verificación */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          confirmarEnrolamiento()
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label
            htmlFor="codigo-activacion"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Código de verificación
          </label>
          <input
            id="codigo-activacion"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            required
            placeholder="000000"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-center font-mono text-xl tracking-[0.5em] text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            disabled={verificando}
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={alCancelar}
            disabled={verificando}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={verificando || codigo.length !== 6}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verificando ? 'Activando…' : 'Activar 2FA'}
          </button>
        </div>
      </form>
    </div>
  )
}
