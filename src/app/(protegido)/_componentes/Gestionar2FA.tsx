'use client'

/**
 * Gestionar2FA — NexoLibre
 *
 * Componente para el panel del usuario que muestra el estado
 * del 2FA y permite activar/desactivar.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Activar2FA from './Activar2FA'

type Estado2FA = 'cargando' | 'inactivo' | 'activo' | 'activando'

interface Factor {
  id: string
  friendly_name?: string
  factor_type: string
  status: string
}

export default function Gestionar2FA() {
  const [estado, setEstado] = useState<Estado2FA>('cargando')
  const [factores, setFactores] = useState<Factor[]>([])
  const [error, setError] = useState<string | null>(null)
  const [desactivando, setDesactivando] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  /* ── Cargar factores existentes ─────────────────────────────────────── */
  const cargarFactores = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()

    if (error) {
      setError(error.message)
      setEstado('inactivo')
      return
    }

    const totpVerificados = data.totp.filter((f) => f.status === 'verified')
    setFactores(totpVerificados)
    setEstado(totpVerificados.length > 0 ? 'activo' : 'inactivo')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    cargarFactores()
  }, [cargarFactores])

  /* ── Desactivar 2FA ─────────────────────────────────────────────────── */
  const desactivar = useCallback(async (factorId: string) => {
    setDesactivando(true)
    setError(null)

    const { error } = await supabase.auth.mfa.unenroll({ factorId })

    if (error) {
      setError(error.message)
      setDesactivando(false)
      return
    }

    // Refrescar la sesión para actualizar el claim AAL
    await supabase.auth.refreshSession()
    setDesactivando(false)
    cargarFactores()
    router.refresh()
  }, [supabase, cargarFactores, router])

  /* ── UI: Cargando ───────────────────────────────────────────────────── */
  if (estado === 'cargando') {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm text-muted">Cargando configuración de seguridad…</span>
        </div>
      </div>
    )
  }

  /* ── UI: Activando (muestra el componente de enrolamiento) ──────────── */
  if (estado === 'activando') {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <Activar2FA
          alActivar={() => {
            cargarFactores()
            router.refresh()
          }}
          alCancelar={() => setEstado('inactivo')}
        />
      </div>
    )
  }

  /* ── UI: Estado activo o inactivo ───────────────────────────────────── */
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              estado === 'activo' ? 'bg-success/10' : 'bg-surface-elevated'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 ${estado === 'activo' ? 'text-success' : 'text-muted'}`}
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
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Autenticación en dos pasos (2FA)
            </h3>
            <p className="mt-0.5 text-sm text-muted">
              {estado === 'activo'
                ? 'Tu cuenta está protegida con una aplicación autenticadora (TOTP).'
                : 'Agrega una capa extra de seguridad con Google Authenticator, Authy u otra app.'}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            estado === 'activo'
              ? 'bg-success/10 text-success'
              : 'bg-surface-elevated text-muted'
          }`}
        >
          {estado === 'activo' ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Error */}
      {error && (
        <output
          role="alert"
          className="mt-4 block rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {error}
        </output>
      )}

      {/* Factores activos */}
      {estado === 'activo' && factores.length > 0 && (
        <div className="mt-4 space-y-2">
          {factores.map((factor) => (
            <div
              key={factor.id}
              className="flex items-center justify-between rounded-lg border border-border-subtle bg-background px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-success" />
                <span className="text-sm text-foreground">
                  Autenticador TOTP
                </span>
                <span className="font-mono text-xs text-muted">
                  {factor.id.slice(0, 8)}…
                </span>
              </div>
              <button
                type="button"
                onClick={() => desactivar(factor.id)}
                disabled={desactivando}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                {desactivando ? 'Desactivando…' : 'Desactivar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón de acción */}
      {estado === 'inactivo' && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setEstado('activando')}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Activar 2FA
          </button>
        </div>
      )}
    </div>
  )
}
