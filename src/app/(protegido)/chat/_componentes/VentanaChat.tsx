'use client'

/**
 * VentanaChat — NexoLibre
 *
 * Ventana principal del chat activo.
 * Header con info del contacto, área de mensajes scrollable,
 * y barra de input fija al fondo.
 */

import { useState, useRef, useEffect } from 'react'

export interface Mensaje {
  id: string
  autorId: string
  autorNombre: string
  contenido: string
  creadoEn: string
  esMio: boolean
}

interface PropsVentanaChat {
  chatNombre: string | null
  chatAvatarInicial: string
  mensajes: Mensaje[]
  alEnviar: (contenido: string) => void
  alVolver: () => void
  cargando: boolean
}

export default function VentanaChat({
  chatNombre,
  chatAvatarInicial,
  mensajes,
  alEnviar,
  alVolver,
  cargando,
}: PropsVentanaChat) {
  const [texto, setTexto] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [mensajes])

  // Auto-resize del textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setTexto(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  function enviar() {
    const contenido = texto.trim()
    if (!contenido) return
    alEnviar(contenido)
    setTexto('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  // Agrupar mensajes consecutivos del mismo autor
  function esInicioDeSerie(i: number): boolean {
    if (i === 0) return true
    return mensajes[i].autorId !== mensajes[i - 1].autorId
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        {/* Botón volver (solo mobile) */}
        <button
          type="button"
          onClick={alVolver}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-elevated hover:text-foreground md:hidden"
          aria-label="Volver a chats"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
          {chatAvatarInicial}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {chatNombre ?? 'Chat directo'}
          </h3>
          <p className="text-[11px] text-success">En línea</p>
        </div>

        {/* Menú */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
          aria-label="Opciones del chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </button>
      </header>

      {/* ── Mensajes ───────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {cargando ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <p className="text-sm text-muted">Envía el primer mensaje</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {mensajes.map((msg, i) => {
              const inicioSerie = esInicioDeSerie(i)
              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.esMio ? 'justify-end' : 'justify-start'} ${
                    inicioSerie ? 'mt-3' : 'mt-0.5'
                  }`}
                >
                  <div className={`group relative max-w-[75%] ${msg.esMio ? 'items-end' : 'items-start'}`}>
                    {/* Nombre del autor (solo inicio de serie, solo otros) */}
                    {inicioSerie && !msg.esMio && (
                      <p className="mb-0.5 px-3 text-[11px] font-medium text-accent">
                        {msg.autorNombre}
                      </p>
                    )}

                    {/* Burbuja */}
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        msg.esMio
                          ? 'bg-accent text-accent-foreground rounded-br-md'
                          : 'bg-surface-elevated text-foreground rounded-bl-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.contenido}</p>
                      <time className={`mt-0.5 block text-right text-[10px] ${
                        msg.esMio ? 'text-accent-foreground/60' : 'text-muted'
                      }`}>
                        {msg.creadoEn}
                      </time>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Input ──────────────────────────────────────────────────── */}
      <footer className="shrink-0 border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          {/* Adjuntar (placeholder) */}
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
            aria-label="Adjuntar archivo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
          </button>

          {/* Textarea autoexpandible */}
          <textarea
            ref={inputRef}
            value={texto}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje…"
            rows={1}
            className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent"
          />

          {/* Enviar */}
          <button
            type="button"
            onClick={enviar}
            disabled={!texto.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-all hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Enviar mensaje"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  )
}
