/**
 * Panel del usuario — /panel
 *
 * Dashboard con métricas de identidad, seguridad y actividad.
 * Incluye gestión de 2FA y cierre de sesión.
 */

import { createClient } from '@/lib/supabase/server'
import { cerrarSesion } from '@/app/(auth)/_acciones/actions'
import Gestionar2FA from '@/app/(protegido)/_componentes/Gestionar2FA'
import MetricasDashboard from '@/app/(protegido)/_componentes/MetricasDashboard'
import BotonCerrarSesion from '@/app/(protegido)/_componentes/BotonCerrarSesion'

export const metadata = {
  title: 'Panel',
  description: 'Panel de control de NexoLibre — identidad y seguridad.',
}

export default async function PaginaPanel() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-5xl flex flex-col gap-10">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Panel de control
            </h1>
            <p className="text-sm text-gray-400">
              {user?.email}
            </p>
          </div>
          <BotonCerrarSesion accion={cerrarSesion} />
        </header>

        {/* ── Dashboard: métricas ─────────────────────────────────────── */}
        <section aria-labelledby="titulo-dashboard">
          <h2
            id="titulo-dashboard"
            className="mb-6 text-sm font-semibold uppercase tracking-widest text-accent"
          >
            Identidad y seguridad
          </h2>
          <MetricasDashboard />
        </section>

        {/* ── 2FA ─────────────────────────────────────────────────────── */}
        <section aria-labelledby="titulo-2fa">
          <h2
            id="titulo-2fa"
            className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent"
          >
            Autenticación en dos pasos
          </h2>
          <Gestionar2FA />
        </section>
      </div>
    </main>
  )
}
