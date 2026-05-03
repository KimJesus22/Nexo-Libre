'use client'

/**
 * RegistroSW — Registro del Service Worker
 *
 * Registra el Service Worker solo en producción y en navegadores compatibles.
 * En desarrollo, no se registra para evitar problemas de caché con HMR.
 *
 * Funcionalidades:
 *   - Registro automático del SW en producción
 *   - Comprobación de actualizaciones cada hora
 *   - Notificación al usuario cuando hay una nueva versión disponible
 */

import { useEffect } from 'react'

export default function RegistroSW() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('SW registrado:', registration.scope)

          // Detectar cuando hay un nuevo SW esperando
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return

            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // Hay una nueva versión disponible — recargar automáticamente
                // para aplicar el nuevo service worker
                console.log('SW: Nueva versión disponible, recargando...')
                window.location.reload()
              }
            })
          })

          // Comprobar actualizaciones cada hora
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000)
        })
        .catch((error) => {
          console.error('Error registrando SW:', error)
        })
    }
  }, [])

  return null
}
