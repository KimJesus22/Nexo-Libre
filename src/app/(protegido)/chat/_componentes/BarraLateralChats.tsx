'use client'

/**
 * BarraLateralChats — NexoLibre
 *
 * Lista de conversaciones recientes.
 * En mobile se muestra como pantalla completa; en desktop como sidebar fija.
 */

import { useState } from 'react'

export interface ChatResumen {
  id: string
  nombre: string | null
  esGrupo: boolean
  ultimoMensaje: string | null
  ultimaFecha: string | null
  sinLeer: number
  avatarInicial: string
}

interface PropsBarraLateral {
  chats: ChatResumen[]
  chatActivoId: string | null
  alSeleccionar: (chatId: string) => void
  alCrearChat: () => void
  busqueda: string
  alBuscar: (q: string) => void
}

export default function BarraLateralChats({
  chats,
  chatActivoId,
  alSeleccionar,
  alCrearChat,
  busqueda,
  alBuscar,
}: PropsBarraLateral) {
  const chatsFiltrados = chats.filter((c) => {
    if (!busqueda.trim()) return true
    const nombre = c.nombre ?? ''
    return nombre.toLowerCase().includes(busqueda.toLowerCase())
  })

  return (
    <aside className="flex h-full flex-col border-r border-border bg-surface">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-bold text-foreground">Chats</h2>
        <button
          type="button"
          onClick={alCrearChat}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-elevated hover:text-accent"
          aria-label="Nuevo chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
      </header>

      {/* ── Búsqueda ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border-subtle px-3 py-2">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => alBuscar(e.target.value)}
            placeholder="Buscar conversación…"
            className="w-full rounded-lg border border-border-subtle bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent"
          />
        </div>
      </div>

      {/* ── Lista de chats ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {chatsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <p className="text-sm text-muted">
              {busqueda ? 'Sin resultados' : 'Aún no tienes chats'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {chatsFiltrados.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => alSeleccionar(chat.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    chatActivoId === chat.id
                      ? 'bg-accent/10 border-l-2 border-l-accent'
                      : 'hover:bg-surface-elevated border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    chatActivoId === chat.id
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-surface-elevated text-foreground-secondary'
                  }`}>
                    {chat.avatarInicial}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-foreground">
                        {chat.nombre ?? 'Chat directo'}
                      </span>
                      {chat.ultimaFecha && (
                        <span className="ml-2 shrink-0 text-[10px] text-muted">
                          {chat.ultimaFecha}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs text-muted">
                        {chat.ultimoMensaje ?? 'Sin mensajes aún'}
                      </p>
                      {chat.sinLeer > 0 && (
                        <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                          {chat.sinLeer > 99 ? '99+' : chat.sinLeer}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
