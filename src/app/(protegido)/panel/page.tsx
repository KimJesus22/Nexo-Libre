/**
 * Panel del usuario — /panel
 *
 * Página protegida que muestra la información del usuario
 * autenticado y permite cerrar sesión.
 */

import { createClient } from '@/lib/supabase/server'
import { cerrarSesion } from '@/app/(auth)/_acciones/actions'

export const metadata = {
  title: 'Panel',
  description: 'Panel de usuario de NexoLibre.',
}

export default async function PaginaPanel() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <section className="w-full max-w-md text-center" aria-labelledby="titulo-panel">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1
          id="titulo-panel"
          className="text-2xl font-bold tracking-tight text-foreground"
        >
          ¡Bienvenido!
        </h1>

        <p className="mt-3 text-sm text-muted">
          Has iniciado sesión como:
        </p>

        <p className="mt-1 font-mono text-sm text-foreground">
          {user?.email}
        </p>

        <div className="mt-8">
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-destructive hover:text-white hover:border-destructive focus-visible:ring-2 focus-visible:ring-destructive"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
