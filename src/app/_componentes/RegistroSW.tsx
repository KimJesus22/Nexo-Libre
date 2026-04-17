'use client'

/**
 * RegistroSW — Registro del Service Worker
 *
 * Registra el Service Worker solo en producción y en navegadores compatibles.
 * En desarrollo, no se registra para evitar problemas de caché con HMR.
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
