'use client'

/**
 * MetricasDashboard — NexoLibre
 *
 * Panel de control con métricas de identidad y seguridad:
 * - Score de seguridad (progreso radial)
 * - Estado de 2FA, email verificado, sesión activa
 * - Gráfico de actividad de la semana
 * - Curva de sesiones suavizada con splines Catmull-Rom
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ProgresoRadial,
  GraficoBarras,
  GraficoCurva,
  Contador,
} from './GraficosDashboard'

interface EstadoSeguridad {
  emailVerificado: boolean
  tiene2FA: boolean
  sesionActiva: boolean
  ultimoLogin: string | null
  proveedor: string | null
  diasActivo: number
}

/* ── Datos simulados de actividad semanal ──────────────────────────────────── */
const ACTIVIDAD_SEMANAL = [
  { dia: 'Lun', valor: 3 },
  { dia: 'Mar', valor: 7 },
  { dia: 'Mié', valor: 5 },
  { dia: 'Jue', valor: 12 },
  { dia: 'Vie', valor: 8 },
  { dia: 'Sáb', valor: 2 },
  { dia: 'Dom', valor: 4 },
]

/* ── Datos simulados de sesiones (curva suavizada) ─────────────────────────── */
const SESIONES_MES = [1, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10, 14]

export default function MetricasDashboard() {
  const [estado, setEstado] = useState<EstadoSeguridad | null>(null)
  const [cargando, setCargando] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function cargarDatos() {
      // Obtener datos del usuario
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCargando(false)
        return
      }

      // Verificar factores MFA
      const { data: factores } = await supabase.auth.mfa.listFactors()
      const tieneTOTP = (factores?.totp ?? []).some((f) => f.status === 'verified')

      // Calcular días desde registro
      const creado = new Date(user.created_at)
      const ahora = new Date()
      const diasActivo = Math.max(1, Math.floor((ahora.getTime() - creado.getTime()) / 86400000))

      setEstado({
        emailVerificado: !!user.email_confirmed_at,
        tiene2FA: tieneTOTP,
        sesionActiva: true,
        ultimoLogin: user.last_sign_in_at
          ? new Date(user.last_sign_in_at).toLocaleString('es-MX', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : null,
        proveedor: user.app_metadata?.provider ?? 'email',
        diasActivo,
      })
      setCargando(false)
    }

    cargarDatos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Score de seguridad ──────────────────────────────────────────────── */
  function calcularScore(): number {
    if (!estado) return 0
    let score = 20 // Base: tener una cuenta
    if (estado.emailVerificado) score += 30
    if (estado.tiene2FA) score += 40
    if (estado.sesionActiva) score += 10
    return score
  }

  /* ── UI: Cargando ───────────────────────────────────────────────────── */
  if (cargando) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl border border-border bg-surface"
          />
        ))}
      </div>
    )
  }

  if (!estado) return null

  const score = calcularScore()
  const colorScore =
    score >= 90
      ? 'var(--success)'
      : score >= 60
        ? 'var(--accent)'
        : 'var(--warning)'

  return (
    <div className="flex flex-col gap-6">
      {/* ── Fila 1: Score + Estado de identidad ──────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Score de seguridad */}
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-6">
          <ProgresoRadial
            porcentaje={score}
            etiqueta="Score de seguridad"
            color={colorScore}
            tamaño={140}
          />
        </div>

        {/* Checklist de identidad */}
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Estado de tu identidad
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <ItemChecklist
              activo={estado.emailVerificado}
              titulo="Correo verificado"
              detalle="Tu dirección de email fue confirmada"
            />
            <ItemChecklist
              activo={estado.tiene2FA}
              titulo="2FA activado"
              detalle="Autenticador TOTP configurado"
            />
            <ItemChecklist
              activo={estado.sesionActiva}
              titulo="Sesión activa"
              detalle="JWT válido y refrescado"
            />
            <ItemChecklist
              activo={!estado.proveedor?.includes('phone')}
              titulo="Sin teléfono vinculado"
              detalle="Protegido contra SIM Swapping"
            />
          </div>
        </div>
      </div>

      {/* ── Fila 2: Métricas numéricas ───────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-3">
        <TarjetaMetrica
          etiqueta="Días activo"
          icono={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
        >
          <Contador valor={estado.diasActivo} />
        </TarjetaMetrica>

        <TarjetaMetrica
          etiqueta="Factores de autenticación"
          icono={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          }
        >
          <Contador valor={estado.tiene2FA ? 2 : 1} />
        </TarjetaMetrica>

        <TarjetaMetrica
          etiqueta="Último acceso"
          icono={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <span className="text-sm font-medium text-foreground">
            {estado.ultimoLogin ?? 'Ahora'}
          </span>
        </TarjetaMetrica>
      </div>

      {/* ── Fila 3: Gráficos ─────────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Actividad semanal (barras) */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Actividad semanal
          </h3>
          <p className="mb-4 text-xs text-muted">Acciones registradas por día</p>
          <GraficoBarras datos={ACTIVIDAD_SEMANAL} alturaMax={100} />
        </div>

        {/* Sesiones mensuales (curva suavizada) */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Sesiones del mes
          </h3>
          <p className="mb-4 text-xs text-muted">
            Curva Catmull-Rom → Bézier (C¹ continua)
          </p>
          <GraficoCurva puntos={SESIONES_MES} alto={100} />
        </div>
      </div>
    </div>
  )
}

/* ── Sub-componentes ──────────────────────────────────────────────────────── */

function ItemChecklist({
  activo,
  titulo,
  detalle,
}: {
  activo: boolean
  titulo: string
  detalle: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-background px-4 py-3">
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          activo ? 'bg-success/15' : 'bg-surface-elevated'
        }`}
      >
        {activo ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{titulo}</p>
        <p className="text-xs text-muted">{detalle}</p>
      </div>
    </div>
  )
}

function TarjetaMetrica({
  etiqueta,
  icono,
  children,
}: {
  etiqueta: string
  icono: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-3 flex items-center gap-2 text-muted">
        {icono}
        <span className="text-xs font-medium">{etiqueta}</span>
      </div>
      {children}
    </div>
  )
}
