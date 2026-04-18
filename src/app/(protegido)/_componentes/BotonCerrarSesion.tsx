'use client'

/**
 * BotonCerrarSesion — NexoLibre
 *
 * Botón de cierre de sesión que ejecuta la purga de datos
 * locales (Modo Efímero) ANTES de invocar la Server Action.
 *
 * Flujo:
 *   1. Click → ejecutarPurgaSiEfimero() (client-side)
 *   2. Submit del form → cerrarSesion() (Server Action)
 *   3. Redirect a /iniciar-sesion
 */

import { useRef } from 'react'
import { ejecutarPurgaSiEfimero } from '@/lib/privacidad'

interface PropsBotonCerrar {
  /** Server Action de cerrar sesión */
  accion: () => Promise<void>
  className?: string
}

export default function BotonCerrarSesion({ accion, className }: PropsBotonCerrar) {
  const formRef = useRef<HTMLFormElement>(null)

  async function handleClick() {
    // 1. Purgar datos locales si el Modo Efímero está activo
    ejecutarPurgaSiEfimero()

    // 2. Submittear el form que invoca la Server Action
    formRef.current?.requestSubmit()
  }

  return (
    <form ref={formRef} action={accion}>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Cerrar sesión de forma segura"
        className={className ?? 'mt-3 rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-destructive hover:text-white hover:border-destructive focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black sm:mt-0'}
      >
        Cerrar sesión
      </button>
    </form>
  )
}
