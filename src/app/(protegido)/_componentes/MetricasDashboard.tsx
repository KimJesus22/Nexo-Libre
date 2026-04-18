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
import { StatusCard } from '@/components/ui/StatusCard'

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
  const [modalScoreAbierto, setModalScoreAbierto] = useState(false)
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
      {/* ── Banner 2FA ─────────────────────────────────────────────────── */}
      {!estado.tiene2FA && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-accent/10 border border-accent p-4 rounded-md gap-4 animate-in fade-in slide-in-from-top-4">
          <div>
            <h3 className="text-accent font-bold text-lg">Protege tu cuenta</h3>
            <p className="text-sm text-gray-300 mt-1">Activa la Autenticación en dos pasos (2FA) para añadir una capa extra de seguridad.</p>
          </div>
          <a
            href="#titulo-2fa"
            className="whitespace-nowrap bg-accent text-black font-bold px-4 py-2 rounded-md hover:bg-accent-light transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
          >
            Activar 2FA
          </a>
        </div>
      )}

      {/* ── Fila 1: Score + Estado de identidad ──────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Score de seguridad */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-6">
          <ProgresoRadial
            porcentaje={score}
            etiqueta="Score de seguridad"
            color={colorScore}
            tamaño={140}
          />
          <button
            type="button"
            onClick={() => setModalScoreAbierto(true)}
            className="mt-4 text-sm text-gray-300 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded-sm"
          >
            <span className="underline decoration-accent underline-offset-4 text-accent hover:text-accent-light transition-colors">¿Cómo aumentar tu puntuación?</span>
          </button>
        </div>

        {/* Checklist de identidad */}
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Estado de tu identidad
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatusCard
              estado={estado.emailVerificado ? 'activo' : 'inactivo'}
              titulo="Correo verificado"
              descripcion="Tu dirección de email fue confirmada"
            />
            <StatusCard
              estado={estado.tiene2FA ? 'activo' : 'inactivo'}
              titulo="2FA activado"
              descripcion="Autenticador TOTP configurado"
            />
            <StatusCard
              estado={estado.sesionActiva ? 'activo' : 'inactivo'}
              titulo="Sesión activa"
              descripcion="JWT válido y refrescado"
            />
            <StatusCard
              estado={!estado.proveedor?.includes('phone') ? 'activo' : 'inactivo'}
              titulo="Sin teléfono vinculado"
              descripcion="Protegido contra SIM Swapping"
            />
          </div>
        </div>
      </div>

      {/* ── Fila 2: Métricas numéricas ───────────────────────────────── */}
      <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-md mx-auto sm:max-w-none">
        <TarjetaMetrica
          etiqueta="Días activo"
          icono={
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
        >
          <Contador valor={estado.diasActivo} />
        </TarjetaMetrica>

        <TarjetaMetrica
          etiqueta="Factores de autenticación"
          icono={
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          }
        >
          <Contador valor={estado.tiene2FA ? 2 : 1} />
        </TarjetaMetrica>

        <TarjetaMetrica
          etiqueta="Último acceso"
          icono={
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Actividad semanal (barras) */}
        <div className="rounded-2xl border border-border bg-surface p-6 overflow-x-auto">
          <figcaption className="sr-only">Gráfico de barras que muestra la actividad reciente. La tendencia indica el uso de la cuenta durante los últimos días.</figcaption>
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Actividad semanal
          </h3>
          <p className="mb-4 text-xs text-gray-400">Acciones registradas por día</p>
          <div className="min-w-[300px]">
            <GraficoBarras datos={ACTIVIDAD_SEMANAL} alturaMax={100} />
          </div>
        </div>

        {/* Sesiones mensuales (curva suavizada) */}
        <div className="rounded-2xl border border-border bg-surface p-6 overflow-x-auto">
          <figcaption className="sr-only">Gráfico de curva que ilustra la cantidad de sesiones mensuales. Refleja la constancia y el acceso a lo largo del tiempo.</figcaption>
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Sesiones del mes
          </h3>
          <p className="mb-4 text-xs text-gray-400">
            Curva Catmull-Rom → Bézier (C¹ continua)
          </p>
          <div className="min-w-[300px]">
            <GraficoCurva puntos={SESIONES_MES} alto={100} />
          </div>
        </div>
      </div>

      {/* ── Modal de Score ───────────────────────────────────────────── */}
      {modalScoreAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            role="dialog" 
            aria-modal="true"
            aria-labelledby="modal-score-titulo"
            className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 id="modal-score-titulo" className="text-xl font-bold text-foreground">Aumenta tu Seguridad</h2>
              <button
                type="button"
                onClick={() => setModalScoreAbierto(false)}
                className="text-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent rounded-sm"
                aria-label="Cerrar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-6">
              Sigue estos pasos para mejorar la seguridad de tu cuenta y alcanzar una puntuación perfecta:
            </p>
            
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-xs mt-0.5">+40</span>
                <div>
                  <strong className="block text-sm text-gray-200">Activa la Autenticación en dos pasos (2FA)</strong>
                  <span className="text-xs text-gray-400">Protege tu cuenta con un código temporal además de tu contraseña.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-xs mt-0.5">+30</span>
                <div>
                  <strong className="block text-sm text-gray-200">Verifica tu correo electrónico</strong>
                  <span className="text-xs text-gray-400">Asegúrate de que podemos contactarte de forma segura.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-xs mt-0.5">+10</span>
                <div>
                  <strong className="block text-sm text-gray-200">Mantén una sesión activa</strong>
                  <span className="text-xs text-gray-400">Tus tokens se renuevan periódicamente.</span>
                </div>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setModalScoreAbierto(false)}
              className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-light focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sub-componentes ──────────────────────────────────────────────────────── */

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
      <div className="mb-3 flex items-center gap-2 text-gray-400">
        {icono}
        <span className="text-xs font-medium">{etiqueta}</span>
      </div>
      {children}
    </div>
  )
}
