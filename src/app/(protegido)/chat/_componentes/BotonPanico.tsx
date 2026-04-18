'use client'

/**
 * BotonPanico — NexoLibre
 *
 * Botón de emergencia para salir instantáneamente de la aplicación.
 * 
 * Acciones:
 * 1. Presionar el botón o tecla 'Escape' (Esc)
 * 2. Aplica filtro blur-3xl a toda la pantalla
 * 3. Borra localStorage y sessionStorage (tokens de sesión y claves de cifrado en memoria)
 * 4. Redirige inmediatamente a DuckDuckGo en < 100ms
 */

import { useState, useEffect, useCallback } from 'react'

export default function BotonPanico() {
  const [activado, setActivado] = useState(false)

  const ejecutarPanico = useCallback(() => {
    if (activado) return
    setActivado(true)

    // Borrar datos locales síncronamente (rápido)
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      // Ignorar errores si hay restricciones del navegador
    }

    // Usar window.location.replace para no dejar historial
    window.location.replace('https://duckduckgo.com/')
  }, [activado])

  useEffect(() => {
    const manejarTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        ejecutarPanico()
      }
    }

    window.addEventListener('keydown', manejarTeclado, { capture: true })
    return () => window.removeEventListener('keydown', manejarTeclado, { capture: true })
  }, [ejecutarPanico])

  return (
    <>
      {/* Botón flotante siempre visible (o discreto) */}
      <button
        onClick={ejecutarPanico}
        aria-label="Botón de Pánico (Esc)"
        title="Salir inmediatamente (Esc)"
        className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/80 text-white shadow-lg backdrop-blur transition-all hover:scale-110 hover:bg-destructive active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Overlay de ofuscación instantánea */}
      {activado && (
        <div 
          className="fixed inset-0 z-[9999] bg-black backdrop-blur-3xl"
          aria-hidden="true"
        />
      )}
    </>
  )
}
