'use client'

/**
 * PanelInvitaciones — NexoLibre
 *
 * Componente para generar y gestionar invitaciones de un solo uso.
 *
 * Features:
 *   - Generar enlace criptográfico con un clic
 *   - Copiar al portapapeles con feedback visual
 *   - Ver historial de invitaciones (activas, usadas, expiradas)
 *   - Indicadores de estado con colores semánticos
 *   - Límite visual de 5 invitaciones activas
 */

import { useState, useEffect, useCallback } from 'react'
import { crearInvitacion, listarMisInvitaciones } from '../_acciones/invitaciones'

/* ── Tipos ────────────────────────────────────────────────────────────────── */
interface Invitacion {
  id: string
  token: string
  url: string
  usado: boolean
  expirado: boolean
  caducaEn: string
  creadoEn: string
  usadoEn: string | null
}

/* ── Componente ───────────────────────────────────────────────────────────── */
export default function PanelInvitaciones() {
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Cargar invitaciones al montar
  const cargar = useCallback(async () => {
    const res = await listarMisInvitaciones()
    if (res.ok) {
      setInvitaciones(res.invitaciones)
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Generar nueva invitación
  async function handleGenerar() {
    setGenerando(true)
    setError(null)

    const res = await crearInvitacion()

    if (!res.ok) {
      setError(res.error)
      setGenerando(false)
      return
    }

    // Copiar al portapapeles automáticamente
    await copiarAlPortapapeles(res.url, res.token)
    await cargar()
    setGenerando(false)
  }

  // Copiar URL al portapapeles
  async function copiarAlPortapapeles(url: string, token: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(token)
      setTimeout(() => setCopiado(null), 2500)
    } catch {
      // Fallback para contextos sin clipboard API
      setError('No se pudo copiar. Copia manualmente el enlace.')
    }
  }

  // Contadores
  const activas = invitaciones.filter((i) => !i.usado && !i.expirado).length
  const usadas = invitaciones.filter((i) => i.usado).length

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Invitaciones seguras
          </h2>
          <p className="mt-1 text-sm text-muted">
            Genera enlaces de un solo uso que caducan en 24 horas.
          </p>
        </div>

        {/* Contador */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1 text-accent">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            {activas} activa{activas !== 1 ? 's' : ''}
          </span>
          <span className="text-muted">
            {usadas} usada{usadas !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Botón generar */}
      <button
        type="button"
        onClick={handleGenerar}
        disabled={generando || activas >= 5}
        className="group mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_var(--accent-glow)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        {generando ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
            Generando…
          </>
        ) : activas >= 5 ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Límite alcanzado (5)
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Generar enlace de invitación
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Lista de invitaciones */}
      {cargando ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-elevated" />
          ))}
        </div>
      ) : invitaciones.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface-elevated px-6 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-1.06a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 116.364 6.364l-1.757 1.757" />
            </svg>
          </div>
          <p className="text-sm text-muted">
            No tienes invitaciones. Genera una para compartir.
          </p>
        </div>
      ) : (
        <ul className="space-y-2" role="list">
          {invitaciones.map((inv) => {
            const esActiva = !inv.usado && !inv.expirado
            const estaCopiad = copiado === inv.token

            return (
              <li
                key={inv.id}
                className={`group rounded-xl border px-4 py-3 transition-all ${
                  esActiva
                    ? 'border-border bg-surface-elevated hover:border-accent/30'
                    : 'border-border-subtle bg-surface opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Estado + token truncado */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                          inv.usado
                            ? 'bg-muted'
                            : inv.expirado
                              ? 'bg-warning'
                              : 'bg-accent animate-pulse'
                        }`}
                      />
                      <code className="truncate text-xs text-foreground-secondary font-mono">
                        {inv.token.slice(0, 16)}…{inv.token.slice(-8)}
                      </code>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-muted">
                      <span>
                        {inv.usado
                          ? `Usada ${formatearTiempo(inv.usadoEn!)}`
                          : inv.expirado
                            ? 'Expirada'
                            : `Caduca ${formatearTiempo(inv.caducaEn)}`}
                      </span>
                      <span>·</span>
                      <span>Creada {formatearTiempo(inv.creadoEn)}</span>
                    </div>
                  </div>

                  {/* Botón copiar (solo si activa) */}
                  {esActiva && (
                    <button
                      type="button"
                      onClick={() => copiarAlPortapapeles(inv.url, inv.token)}
                      className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        estaCopiad
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border bg-surface text-foreground-secondary hover:border-accent/30 hover:text-accent'
                      }`}
                    >
                      {estaCopiad ? (
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Copiado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                          </svg>
                          Copiar
                        </span>
                      )}
                    </button>
                  )}

                  {/* Badge de estado */}
                  {!esActiva && (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                        inv.usado
                          ? 'bg-surface-elevated text-muted'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {inv.usado ? 'Usada' : 'Expirada'}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ── Utilidad para formatear tiempos relativos ────────────────────────────── */
function formatearTiempo(iso: string): string {
  const fecha = new Date(iso)
  const ahora = new Date()
  const diff = fecha.getTime() - ahora.getTime()
  const absDiff = Math.abs(diff)

  if (absDiff < 60_000) return 'ahora'
  if (absDiff < 3600_000) {
    const mins = Math.round(absDiff / 60_000)
    return diff > 0 ? `en ${mins}m` : `hace ${mins}m`
  }
  if (absDiff < 86400_000) {
    const hrs = Math.round(absDiff / 3600_000)
    return diff > 0 ? `en ${hrs}h` : `hace ${hrs}h`
  }
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}
