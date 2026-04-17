'use client'

/**
 * InterfazChat — NexoLibre
 *
 * Orquestador principal: sidebar + ventana de chat.
 *
 * Responsividad:
 * - Desktop (md+): sidebar fija a la izquierda, chat a la derecha
 * - Mobile (<md): muestra uno u otro con transición
 */

import { useState, useCallback } from 'react'
import BarraLateralChats, { type ChatResumen } from './BarraLateralChats'
import VentanaChat, { type Mensaje } from './VentanaChat'

/* ── Datos demo para la interfaz ──────────────────────────────────────────── */
const CHATS_DEMO: ChatResumen[] = [
  {
    id: '1',
    nombre: 'Alejandro García',
    esGrupo: false,
    ultimoMensaje: '¿Pudiste revisar el documento?',
    ultimaFecha: '11:32',
    sinLeer: 2,
    avatarInicial: 'AG',
  },
  {
    id: '2',
    nombre: 'Equipo Desarrollo',
    esGrupo: true,
    ultimoMensaje: 'Deploy exitoso en producción 🚀',
    ultimaFecha: '10:15',
    sinLeer: 0,
    avatarInicial: 'ED',
  },
  {
    id: '3',
    nombre: 'María López',
    esGrupo: false,
    ultimoMensaje: 'Gracias por la información',
    ultimaFecha: 'Ayer',
    sinLeer: 0,
    avatarInicial: 'ML',
  },
  {
    id: '4',
    nombre: 'Seguridad NexoLibre',
    esGrupo: true,
    ultimoMensaje: 'Auditoría de RLS completada',
    ultimaFecha: 'Lun',
    sinLeer: 5,
    avatarInicial: 'SN',
  },
  {
    id: '5',
    nombre: 'Carlos Mendoza',
    esGrupo: false,
    ultimoMensaje: '¿Tienes disponibilidad mañana?',
    ultimaFecha: 'Dom',
    sinLeer: 1,
    avatarInicial: 'CM',
  },
]

const MENSAJES_DEMO: Record<string, Mensaje[]> = {
  '1': [
    { id: 'm1', autorId: 'otro', autorNombre: 'Alejandro García', contenido: 'Hola, ¿cómo va el proyecto?', creadoEn: '11:20', esMio: false },
    { id: 'm2', autorId: 'yo', autorNombre: 'Tú', contenido: 'Todo en orden, acabo de terminar la integración del chat con Realtime', creadoEn: '11:25', esMio: true },
    { id: 'm3', autorId: 'yo', autorNombre: 'Tú', contenido: 'Las políticas RLS están aplicadas y verificadas', creadoEn: '11:26', esMio: true },
    { id: 'm4', autorId: 'otro', autorNombre: 'Alejandro García', contenido: '¡Excelente! ¿Pudiste revisar el documento?', creadoEn: '11:32', esMio: false },
  ],
  '2': [
    { id: 'm5', autorId: 'otro1', autorNombre: 'Ana Torres', contenido: 'El pipeline de CI/CD está verde ✅', creadoEn: '09:45', esMio: false },
    { id: 'm6', autorId: 'otro2', autorNombre: 'Pedro Ruiz', contenido: 'Confirmado. Las pruebas E2E pasaron sin errores', creadoEn: '09:50', esMio: false },
    { id: 'm7', autorId: 'yo', autorNombre: 'Tú', contenido: 'Perfecto, voy a hacer el deploy ahora', creadoEn: '10:10', esMio: true },
    { id: 'm8', autorId: 'yo', autorNombre: 'Tú', contenido: 'Deploy exitoso en producción 🚀', creadoEn: '10:15', esMio: true },
  ],
  '4': [
    { id: 'm9', autorId: 'otro', autorNombre: 'Auditor', contenido: 'Iniciando auditoría de políticas RLS en todas las tablas', creadoEn: 'Lun 09:00', esMio: false },
    { id: 'm10', autorId: 'otro', autorNombre: 'Auditor', contenido: 'Se verificó que FORCE RLS está habilitado en: perfiles, chats, participantes_chat, mensajes', creadoEn: 'Lun 11:30', esMio: false },
    { id: 'm11', autorId: 'yo', autorNombre: 'Tú', contenido: '¿Encontraron alguna vulnerabilidad?', creadoEn: 'Lun 12:00', esMio: true },
    { id: 'm12', autorId: 'otro', autorNombre: 'Auditor', contenido: 'Ninguna. auth.uid() envuelto en subquery, funciones SECURITY DEFINER en esquema privado, permisos de mínimo privilegio verificados', creadoEn: 'Lun 14:00', esMio: false },
    { id: 'm13', autorId: 'otro', autorNombre: 'Auditor', contenido: 'Auditoría de RLS completada', creadoEn: 'Lun 14:05', esMio: false },
  ],
}

export default function InterfazChat() {
  const [chatActivoId, setChatActivoId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [mensajesLocal, setMensajesLocal] = useState(MENSAJES_DEMO)

  const chatActivo = CHATS_DEMO.find((c) => c.id === chatActivoId) ?? null
  const mensajesActivos = chatActivoId ? (mensajesLocal[chatActivoId] ?? []) : []

  const seleccionarChat = useCallback((id: string) => setChatActivoId(id), [])

  const volverALista = useCallback(() => setChatActivoId(null), [])

  const enviarMensaje = useCallback(
    (contenido: string) => {
      if (!chatActivoId) return
      const nuevo: Mensaje = {
        id: `m-${Date.now()}`,
        autorId: 'yo',
        autorNombre: 'Tú',
        contenido,
        creadoEn: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        esMio: true,
      }
      setMensajesLocal((prev) => ({
        ...prev,
        [chatActivoId]: [...(prev[chatActivoId] ?? []), nuevo],
      }))
    },
    [chatActivoId]
  )

  return (
    <div className="flex h-[calc(100dvh-1px)] w-full overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      {/* Desktop: siempre visible (w-80) */}
      {/* Mobile: visible cuando NO hay chat activo */}
      <div
        className={`w-full shrink-0 md:w-80 md:block ${
          chatActivoId ? 'hidden' : 'block'
        }`}
      >
        <BarraLateralChats
          chats={CHATS_DEMO}
          chatActivoId={chatActivoId}
          alSeleccionar={seleccionarChat}
          alCrearChat={() => {}}
          busqueda={busqueda}
          alBuscar={setBusqueda}
        />
      </div>

      {/* ── Ventana de chat ────────────────────────────────────────── */}
      {/* Desktop: siempre visible (flex-1) */}
      {/* Mobile: visible cuando HAY chat activo */}
      <div
        className={`min-w-0 flex-1 md:block ${
          chatActivoId ? 'block' : 'hidden'
        }`}
      >
        {chatActivo ? (
          <VentanaChat
            chatNombre={chatActivo.nombre}
            chatAvatarInicial={chatActivo.avatarInicial}
            mensajes={mensajesActivos}
            alEnviar={enviarMensaje}
            alVolver={volverALista}
            cargando={false}
          />
        ) : (
          /* Estado vacío (desktop) */
          <div className="hidden h-full md:flex flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">NexoLibre Chat</h3>
              <p className="mt-1 text-sm text-muted">
                Selecciona una conversación para comenzar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
