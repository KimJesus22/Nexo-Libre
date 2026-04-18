'use client'

/**
 * useColaOffline — NexoLibre
 *
 * Hook para gestionar una cola de mensajes pendientes cuando el usuario
 * pierde conexión a internet.
 *
 * Estrategia:
 * 1. Detectar estado de red con navigator.onLine + eventos online/offline
 * 2. Cuando offline, encolar mensajes en localStorage (JSON serializable)
 * 3. Cuando la conexión regresa, flush automático: enviar todo a Supabase
 * 4. Exponer estado `enLinea` y `pendientes` para la UI
 *
 * Se usa localStorage (no IndexedDB) porque:
 * - Los mensajes son strings pequeños (texto plano cifrado)
 * - No necesitamos queries complejas
 * - localStorage es síncrono → más rápido para leer/escribir
 * - Compatible con el Modo Efímero (localStorage.clear())
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ── Tipos ────────────────────────────────────────────────────────────────── */

export interface MensajePendiente {
  /** ID temporal para tracking */
  id: string
  chat_id: string
  autor_id: string
  /** Contenido ya cifrado (E2EE) */
  contenido: string
  expira_en: string | null
  /** Timestamp ISO de cuando se encoló */
  encolado_en: string
}

/* ── Constantes ───────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'nexolibre_cola_offline'

/* ── Utilidades de persistencia ───────────────────────────────────────────── */

function leerCola(): MensajePendiente[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function guardarCola(cola: MensajePendiente[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cola))
  } catch {
    // Storage lleno o no disponible
  }
}

function limpiarCola(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignorar
  }
}

/* ── Hook principal ───────────────────────────────────────────────────────── */

export function useColaOffline() {
  const supabase = useRef(createClient()).current
  const [enLinea, setEnLinea] = useState(true)
  const [pendientes, setPendientes] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const flushingRef = useRef(false)

  // Inicializar estado de red
  useEffect(() => {
    if (typeof window === 'undefined') return
    setEnLinea(navigator.onLine)
    setPendientes(leerCola().length)
  }, [])

  // Escuchar cambios de conectividad
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setEnLinea(true)
      // Flush automático al reconectarse
      flushCola()
    }

    const handleOffline = () => {
      setEnLinea(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Encolar un mensaje para envío posterior.
   * Se llama cuando el INSERT falla por falta de red.
   */
  const encolar = useCallback((mensaje: MensajePendiente) => {
    const cola = leerCola()
    cola.push(mensaje)
    guardarCola(cola)
    setPendientes(cola.length)
  }, [])

  /**
   * Flush: enviar todos los mensajes pendientes a Supabase.
   * Se ejecuta automáticamente al reconectarse o puede ser invocado manualmente.
   */
  const flushCola = useCallback(async () => {
    if (flushingRef.current) return
    flushingRef.current = true
    setEnviando(true)

    const cola = leerCola()
    if (cola.length === 0) {
      setEnviando(false)
      flushingRef.current = false
      return
    }

    const fallidos: MensajePendiente[] = []

    for (const msg of cola) {
      const { error } = await supabase
        .from('mensajes')
        .insert({
          chat_id: msg.chat_id,
          autor_id: msg.autor_id,
          contenido: msg.contenido,
          expira_en: msg.expira_en,
        })

      if (error) {
        // Si falla (ej. aún sin red), mantener en cola
        fallidos.push(msg)
      }
    }

    // Guardar solo los que fallaron
    guardarCola(fallidos)
    setPendientes(fallidos.length)
    setEnviando(false)
    flushingRef.current = false
  }, [supabase])

  /**
   * Limpiar toda la cola (ej. al cerrar sesión o purga manual)
   */
  const vaciarCola = useCallback(() => {
    limpiarCola()
    setPendientes(0)
  }, [])

  return {
    /** Si el navegador tiene conexión a internet */
    enLinea,
    /** Número de mensajes pendientes de envío */
    pendientes,
    /** Si se está ejecutando un flush en este momento */
    enviando,
    /** Encolar un mensaje para envío posterior */
    encolar,
    /** Forzar flush manual de la cola */
    flushCola,
    /** Vaciar la cola completamente */
    vaciarCola,
  }
}
