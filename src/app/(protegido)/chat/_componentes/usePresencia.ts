'use client'

/**
 * usePresencia — NexoLibre
 *
 * Hook de Supabase Realtime Presence para:
 *
 * 1. Estado "en línea" — punto verde en la sidebar
 *    - Canal global `presencia-global` con userId como key
 *    - Sync/join/leave actualizan un Set<string> de usuarios online
 *
 * 2. Estado "escribiendo..." — indicador en el header del chat
 *    - track() envía { escribiendo: true } al canal del chat activo
 *    - Debounce de 2s para dejar de mostrar "escribiendo"
 *
 * API de Presence:
 *   channel.track(payload) → publica estado
 *   channel.presenceState() → estado completo de todos los clientes
 *   channel.on('presence', { event: 'sync' }, cb)
 *   channel.untrack() → deja de trackear
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/* ── Tipos ────────────────────────────────────────────────────────────────── */

interface PresenciaGlobalPayload {
  userId: string
  online_at: string
  [key: string]: string
}

interface PresenciaChatPayload {
  userId: string
  escribiendo: boolean
  [key: string]: string | boolean
}

/* ── Hook de presencia global (online/offline) ────────────────────────────── */

export function usePresenciaGlobal(userId: string | null) {
  const supabase = useMemo(() => createClient(), [])
  const canalRef = useRef<RealtimeChannel | null>(null)
  const [usuariosEnLinea, setUsuariosEnLinea] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) return

    const canal = supabase.channel('presencia-global', {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    canal
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState<PresenciaGlobalPayload>()
        const idsOnline = new Set<string>()

        // Cada key en presenceState es el userId (lo definimos como key)
        for (const key of Object.keys(estado)) {
          idsOnline.add(key)
        }

        setUsuariosEnLinea(idsOnline)
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return

        // Publicar nuestro estado de presencia
        await canal.track({
          userId,
          online_at: new Date().toISOString(),
        })
      })

    canalRef.current = canal

    return () => {
      canal.untrack()
      supabase.removeChannel(canal)
      canalRef.current = null
    }
  }, [userId, supabase])

  /** Verifica si un usuario está en línea */
  const estaEnLinea = useCallback(
    (id: string) => usuariosEnLinea.has(id),
    [usuariosEnLinea]
  )

  return { usuariosEnLinea, estaEnLinea }
}

/* ── Hook de indicador "escribiendo..." por chat ──────────────────────────── */

export function useEscribiendo(
  userId: string | null,
  chatId: string | null
) {
  const supabase = useMemo(() => createClient(), [])
  const canalRef = useRef<RealtimeChannel | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [otrosEscribiendo, setOtrosEscribiendo] = useState<string[]>([])

  useEffect(() => {
    if (!userId || !chatId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with presence channel state
      setOtrosEscribiendo([])
      return
    }

    const canal = supabase.channel(`escribiendo-${chatId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    canal
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState<PresenciaChatPayload>()
        const escribiendo: string[] = []

        for (const [key, presencias] of Object.entries(estado)) {
          // No incluir al usuario actual
          if (key === userId) continue

          // Verificar si alguna presencia de este usuario tiene escribiendo: true
          const estaEscribiendo = presencias.some(
            (p: PresenciaChatPayload) => p.escribiendo === true
          )
          if (estaEscribiendo) {
            escribiendo.push(key)
          }
        }

        setOtrosEscribiendo(escribiendo)
      })
      .subscribe()

    canalRef.current = canal

    return () => {
      supabase.removeChannel(canal)
      canalRef.current = null
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [userId, chatId, supabase])

  /**
   * Notifica que el usuario está escribiendo.
   * Llama a track({ escribiendo: true }) y programa un auto-reset
   * a escribiendo: false después de 2 segundos sin llamar de nuevo.
   */
  const notificarEscribiendo = useCallback(() => {
    const canal = canalRef.current
    if (!canal || !userId) return

    // Track escribiendo: true
    canal.track({
      userId,
      escribiendo: true,
    })

    // Auto-reset: si no se vuelve a llamar en 2s, enviar false
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      canal.track({
        userId,
        escribiendo: false,
      })
    }, 2000)
  }, [userId])

  /** Notifica que el usuario dejó de escribir inmediatamente */
  const detenerEscribiendo = useCallback(() => {
    const canal = canalRef.current
    if (!canal || !userId) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    canal.track({
      userId,
      escribiendo: false,
    })
  }, [userId])

  return { otrosEscribiendo, notificarEscribiendo, detenerEscribiendo }
}
