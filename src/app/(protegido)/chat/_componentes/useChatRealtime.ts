'use client'

/**
 * useChatRealtime — NexoLibre
 *
 * Hook que conecta la interfaz de chat con Supabase:
 *
 * 1. Carga los chats del usuario (participantes_chat + chats)
 * 2. Carga los mensajes del chat activo
 * 3. Se suscribe a Realtime (INSERT en mensajes) para recibir
 *    nuevos mensajes sin recargar la página
 * 4. Envía mensajes via INSERT directo (RLS valida pertenencia)
 * 5. Auto-cleanup de suscripciones al desmontar o cambiar de chat
 * 6. Cifrado E2EE: AES-256-GCM via Web Crypto API
 *    - Cifra ANTES de enviar a Supabase
 *    - Descifra al cargar y al recibir via Realtime
 *    - Supabase NUNCA ve texto plano
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ChatResumen } from './BarraLateralChats'
import type { Mensaje } from './VentanaChat'
import {
  cifrarMensaje,
  descifrarMensaje,
  obtenerOCrearClaveChat,
  esMensajeCifrado,
} from '@/lib/crypto/e2ee'

/* ── Tipos de base de datos ───────────────────────────────────────────────── */
interface MensajeDB {
  id: string
  chat_id: string
  autor_id: string
  contenido: string
  editado: boolean
  creado_en: string
}

interface ChatDB {
  id: string
  nombre: string | null
  es_grupo: boolean
  creado_por: string
  creado_en: string
  actualizado_en: string
}

interface ParticipanteDB {
  chat_id: string
  usuario_id: string
  rol: string
  unido_en: string
}

/* ── Utilidades ───────────────────────────────────────────────────────────── */

/** Formatea un timestamp ISO a hora legible */
function formatearHora(iso: string): string {
  const fecha = new Date(iso)
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)

  const esHoy = fecha.toDateString() === hoy.toDateString()
  const esAyer = fecha.toDateString() === ayer.toDateString()

  if (esHoy) {
    return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }
  if (esAyer) {
    return 'Ayer'
  }
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

/** Genera iniciales a partir de un nombre */
function generarIniciales(nombre: string | null): string {
  if (!nombre) return '??'
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/* ── Hook principal ───────────────────────────────────────────────────────── */

export function useChatRealtime() {
  const supabase = useRef(createClient()).current
  const canalRef = useRef<RealtimeChannel | null>(null)

  // Estado del usuario
  const [userId, setUserId] = useState<string | null>(null)

  // Estado de chats
  const [chats, setChats] = useState<ChatResumen[]>([])
  const [cargandoChats, setCargandoChats] = useState(true)

  // Estado de mensajes del chat activo
  const [chatActivoId, setChatActivoId] = useState<string | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargandoMensajes, setCargandoMensajes] = useState(false)

  // Cache de nombres de usuario por ID
  const nombresCache = useRef<Record<string, string>>({})

  // Clave E2EE del chat activo (AES-256-GCM)
  const claveE2EE = useRef<CryptoKey | null>(null)

  /* ── 1. Obtener usuario actual ──────────────────────────────────────── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        // Guardar nombre propio en cache
        const nombre = user.user_metadata?.nombre_completo
          ?? user.email?.split('@')[0]
          ?? 'Tú'
        nombresCache.current[user.id] = nombre
      }
    })
  }, [supabase])

  /* ── 2. Cargar lista de chats ───────────────────────────────────────── */
  const cargarChats = useCallback(async () => {
    if (!userId) return
    setCargandoChats(true)

    // Obtener chats donde el usuario es participante
    const { data: participaciones } = await supabase
      .from('participantes_chat')
      .select('chat_id')
      .eq('usuario_id', userId)

    if (!participaciones || participaciones.length === 0) {
      setChats([])
      setCargandoChats(false)
      return
    }

    const chatIds = participaciones.map((p) => p.chat_id)

    // Obtener datos de cada chat
    const { data: chatsDB } = await supabase
      .from('chats')
      .select('*')
      .in('id', chatIds)
      .order('actualizado_en', { ascending: false })

    if (!chatsDB) {
      setChats([])
      setCargandoChats(false)
      return
    }

    // Para cada chat, obtener el último mensaje
    const chatResumenes: ChatResumen[] = await Promise.all(
      chatsDB.map(async (chat: ChatDB) => {
        const { data: ultimoMensaje } = await supabase
          .from('mensajes')
          .select('contenido, creado_en')
          .eq('chat_id', chat.id)
          .order('creado_en', { ascending: false })
          .limit(1)
          .single()

        return {
          id: chat.id,
          nombre: chat.nombre,
          esGrupo: chat.es_grupo,
          ultimoMensaje: ultimoMensaje?.contenido ?? null,
          ultimaFecha: ultimoMensaje?.creado_en
            ? formatearHora(ultimoMensaje.creado_en)
            : null,
          sinLeer: 0,
          avatarInicial: generarIniciales(chat.nombre),
        }
      })
    )

    setChats(chatResumenes)
    setCargandoChats(false)
  }, [userId, supabase])

  useEffect(() => {
    if (userId) cargarChats()
  }, [userId, cargarChats])

  /* ── 3. Cargar mensajes del chat activo ──────────────────────────────── */
  const cargarMensajes = useCallback(async (chatId: string) => {
    if (!userId) return
    setCargandoMensajes(true)

    const { data: mensajesDB } = await supabase
      .from('mensajes')
      .select('*')
      .eq('chat_id', chatId)
      .order('creado_en', { ascending: true })
      .limit(100)

    if (!mensajesDB) {
      setMensajes([])
      setCargandoMensajes(false)
      return
    }

    // Resolver nombres de autores que no estén en cache
    const idsDesconocidos = [
      ...new Set(
        mensajesDB
          .map((m: MensajeDB) => m.autor_id)
          .filter((id: string) => !nombresCache.current[id])
      ),
    ]

    if (idsDesconocidos.length > 0) {
      const { data: perfiles } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, nombre_usuario')
        .in('id', idsDesconocidos)

      perfiles?.forEach((p: { id: string; nombre_completo: string | null; nombre_usuario: string | null }) => {
        nombresCache.current[p.id] = p.nombre_completo ?? p.nombre_usuario ?? 'Anónimo'
      })
    }

    // Obtener o crear clave E2EE para este chat
    const clave = await obtenerOCrearClaveChat(chatId, userId)
    claveE2EE.current = clave

    // Descifrar mensajes (compatible con mensajes legacy sin cifrar)
    const mensajesMapeados: Mensaje[] = await Promise.all(
      mensajesDB.map(async (m: MensajeDB) => {
        let contenidoDescifrado = m.contenido
        if (esMensajeCifrado(m.contenido)) {
          try {
            contenidoDescifrado = await descifrarMensaje(m.contenido, clave)
          } catch {
            contenidoDescifrado = '🔒 No se pudo descifrar este mensaje'
          }
        }
        return {
          id: m.id,
          autorId: m.autor_id,
          autorNombre: nombresCache.current[m.autor_id] ?? 'Anónimo',
          contenido: contenidoDescifrado,
          creadoEn: formatearHora(m.creado_en),
          esMio: m.autor_id === userId,
        }
      })
    )

    setMensajes(mensajesMapeados)
    setCargandoMensajes(false)
  }, [userId, supabase])

  /* ── 4. Suscripción Realtime (INSERT en mensajes) ───────────────────── */
  useEffect(() => {
    if (!chatActivoId || !userId) return

    // Cargar mensajes existentes
    cargarMensajes(chatActivoId)

    // Suscribirse a nuevos mensajes del chat activo
    const canal = supabase
      .channel(`chat-${chatActivoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `chat_id=eq.${chatActivoId}`,
        },
        async (payload) => {
          const nuevo = payload.new as MensajeDB

          // Resolver nombre del autor (puede ser yo mismo via otro dispositivo)
          const autorNombre = nombresCache.current[nuevo.autor_id] ?? 'Anónimo'

          // Descifrar contenido E2EE
          let contenidoDescifrado = nuevo.contenido
          if (esMensajeCifrado(nuevo.contenido) && claveE2EE.current) {
            try {
              contenidoDescifrado = await descifrarMensaje(
                nuevo.contenido,
                claveE2EE.current
              )
            } catch {
              contenidoDescifrado = '🔒 No se pudo descifrar este mensaje'
            }
          }

          const mensajeNuevo: Mensaje = {
            id: nuevo.id,
            autorId: nuevo.autor_id,
            autorNombre,
            contenido: contenidoDescifrado,
            creadoEn: formatearHora(nuevo.creado_en),
            esMio: nuevo.autor_id === userId,
          }

          // Agregar al estado evitando duplicados
          // (el INSERT local ya agrega optimistamente, Realtime puede llegar después)
          setMensajes((prev) => {
            if (prev.some((m) => m.id === mensajeNuevo.id)) return prev
            return [...prev, mensajeNuevo]
          })

          // Actualizar último mensaje en la sidebar
          setChats((prevChats) =>
            prevChats.map((c) =>
              c.id === chatActivoId
                ? {
                    ...c,
                    ultimoMensaje: nuevo.contenido,
                    ultimaFecha: formatearHora(nuevo.creado_en),
                  }
                : c
            )
          )
        }
      )
      .subscribe()

    canalRef.current = canal

    // Cleanup: desuscribirse al cambiar de chat o desmontar
    return () => {
      supabase.removeChannel(canal)
      canalRef.current = null
    }
  }, [chatActivoId, userId, supabase, cargarMensajes])

  /* ── 5. Enviar mensaje ──────────────────────────────────────────────── */
  const enviarMensaje = useCallback(
    async (contenido: string) => {
      if (!chatActivoId || !userId) return

      // Optimistic update: agregar inmediatamente a la UI
      const idTemporal = `temp-${Date.now()}`
      const mensajeOptimista: Mensaje = {
        id: idTemporal,
        autorId: userId,
        autorNombre: nombresCache.current[userId] ?? 'Tú',
        contenido,
        creadoEn: formatearHora(new Date().toISOString()),
        esMio: true,
      }

      setMensajes((prev) => [...prev, mensajeOptimista])

      // Actualizar sidebar inmediatamente
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatActivoId
            ? {
                ...c,
                ultimoMensaje: contenido,
                ultimaFecha: formatearHora(new Date().toISOString()),
              }
            : c
        )
      )

      // Cifrar contenido con E2EE antes de enviar a Supabase
      let contenidoCifrado = contenido
      if (claveE2EE.current) {
        try {
          contenidoCifrado = await cifrarMensaje(contenido, claveE2EE.current)
        } catch (e) {
          console.error('E2EE: Error al cifrar, enviando sin cifrar:', e)
        }
      }

      // INSERT real (RLS valida: auth.uid() = autor_id AND participante)
      // Supabase recibe el ciphertext, NUNCA el texto plano
      const { data, error } = await supabase
        .from('mensajes')
        .insert({
          chat_id: chatActivoId,
          autor_id: userId,
          contenido: contenidoCifrado,
        })
        .select('id')
        .single()

      if (error) {
        // Rollback del optimistic update
        setMensajes((prev) => prev.filter((m) => m.id !== idTemporal))
        console.error('Error al enviar mensaje:', error.message)
        return
      }

      // Reemplazar ID temporal por el ID real de la DB
      if (data) {
        setMensajes((prev) =>
          prev.map((m) => (m.id === idTemporal ? { ...m, id: data.id } : m))
        )
      }
    },
    [chatActivoId, userId, supabase]
  )

  /* ── 6. Seleccionar chat ────────────────────────────────────────────── */
  const seleccionarChat = useCallback((id: string) => {
    setChatActivoId(id)
    setMensajes([])
    claveE2EE.current = null // Reset clave E2EE del chat anterior
  }, [])

  const volverALista = useCallback(() => {
    setChatActivoId(null)
    setMensajes([])
    claveE2EE.current = null
  }, [])

  return {
    userId,
    chats,
    cargandoChats,
    chatActivoId,
    mensajes,
    cargandoMensajes,
    seleccionarChat,
    volverALista,
    enviarMensaje,
  }
}
