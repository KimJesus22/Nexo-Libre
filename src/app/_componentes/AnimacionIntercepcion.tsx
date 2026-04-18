'use client'

/**
 * AnimacionIntercepcion — NexoLibre
 *
 * Animación hero de la landing page que demuestra visualmente
 * el problema que NexoLibre resuelve:
 *
 * ACTO 1 (0-2s): Un SMS se envía normalmente
 * ACTO 2 (2-4s): Un atacante intercepta el mensaje → se revela el texto plano
 * ACTO 3 (4-6s): NexoLibre interviene → el mensaje se cifra con AES-256-GCM
 * ACTO 4 (6-8s): El atacante solo ve basura cifrada → el destinatario lo descifra
 *
 * Usa CSS animations puras (keyframes + Tailwind) para máximo rendimiento.
 * Sin dependencias externas.
 */

import { useState, useEffect } from 'react'

/* ── Constantes ───────────────────────────────────────────────────────────── */

const MENSAJE_PLANO = 'Mi contraseña es: Carlos1987'
const MENSAJE_CIFRADO = 'e2ee:aX2k9.BvR4mN8xQ7wL3j...'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for documentation of decryption flow
const MENSAJE_DESCIFRADO = 'Mi contraseña es: Carlos1987'

const FASES = [
  'enviando',     // SMS viajando
  'interceptado',  // Atacante lee el texto plano
  'cifrando',      // NexoLibre cifra el mensaje
  'seguro',        // Atacante ve basura, destinatario descifra
] as const

type Fase = (typeof FASES)[number]

/* ── Componente ───────────────────────────────────────────────────────────── */

export default function AnimacionIntercepcion() {
  const [fase, setFase] = useState<Fase>('enviando')
  const [visible, setVisible] = useState(false)

  // Secuencia de animación
  useEffect(() => {
    // Delay inicial para que el componente aparezca con fade-in
    const t0 = setTimeout(() => setVisible(true), 300)

    const timers = [
      setTimeout(() => setFase('interceptado'), 2500),
      setTimeout(() => setFase('cifrando'), 5000),
      setTimeout(() => setFase('seguro'), 7500),
    ]

    return () => {
      clearTimeout(t0)
      timers.forEach(clearTimeout)
    }
  }, [])

  // Reiniciar la animación
  function reiniciar() {
    setFase('enviando')
    const timers = [
      setTimeout(() => setFase('interceptado'), 2500),
      setTimeout(() => setFase('cifrando'), 5000),
      setTimeout(() => setFase('seguro'), 7500),
    ]
    return () => timers.forEach(clearTimeout)
  }

  return (
    <div
      className={`relative mx-auto mt-16 w-full max-w-xl transition-all duration-700 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      {/* ── Contenedor principal con borde brillante ─────────────── */}
      <div className="rounded-2xl border border-border bg-surface/80 backdrop-blur-sm p-5 shadow-2xl">
        {/* Header de la demo */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full transition-colors duration-500 ${
              fase === 'interceptado' ? 'bg-red-500 animate-pulse' :
              fase === 'cifrando' ? 'bg-yellow-500 animate-pulse' :
              fase === 'seguro' ? 'bg-emerald-500' :
              'bg-blue-500 animate-pulse'
            }`} />
            <span className="text-[11px] font-medium tracking-wider uppercase text-muted">
              {fase === 'enviando' && 'Enviando SMS…'}
              {fase === 'interceptado' && '⚠ SMS interceptado'}
              {fase === 'cifrando' && 'Aplicando E2EE…'}
              {fase === 'seguro' && '✓ Canal seguro'}
            </span>
          </div>
          <button
            type="button"
            onClick={reiniciar}
            className="text-[10px] text-muted hover:text-accent transition-colors"
            aria-label="Reiniciar animación"
          >
            Repetir ↻
          </button>
        </div>

        {/* ── Escena de la animación ────────────────────────────────── */}
        <div className="relative flex items-center justify-between gap-3 px-2">
          {/* Emisor */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-500 ${
              fase === 'seguro' || fase === 'cifrando'
                ? 'border-accent bg-accent/10'
                : 'border-border bg-surface-elevated'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="text-[10px] text-muted">Emisor</span>
          </div>

          {/* Línea de transmisión + mensaje */}
          <div className="flex-1 relative min-h-[80px] flex items-center">
            {/* Línea */}
            <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2">
              <div className={`h-full transition-colors duration-500 ${
                fase === 'interceptado' ? 'bg-red-500/40' :
                fase === 'seguro' ? 'bg-accent/40' :
                'bg-border'
              }`} />
              {/* Pulso viajero */}
              {fase === 'enviando' && (
                <div className="absolute top-0 left-0 h-full w-16 animate-slide-right bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
              )}
              {fase === 'cifrando' && (
                <div className="absolute top-0 left-0 h-full w-16 animate-slide-right bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
              )}
            </div>

            {/* Burbuja del mensaje */}
            <div className={`relative z-10 mx-auto rounded-xl border px-3.5 py-2.5 transition-all duration-700 max-w-[220px] ${
              fase === 'interceptado'
                ? 'border-red-500/50 bg-red-950/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                : fase === 'cifrando' || fase === 'seguro'
                  ? 'border-accent/50 bg-accent/5 shadow-[0_0_20px_var(--accent-glow)]'
                  : 'border-border bg-surface-elevated'
            }`}>
              {/* Contenido del mensaje */}
              <p className={`text-xs font-mono leading-relaxed transition-all duration-500 ${
                fase === 'interceptado'
                  ? 'text-red-400'
                  : fase === 'cifrando' || fase === 'seguro'
                    ? 'text-accent'
                    : 'text-foreground-secondary'
              }`}>
                {fase === 'enviando' && MENSAJE_PLANO}
                {fase === 'interceptado' && MENSAJE_PLANO}
                {fase === 'cifrando' && (
                  <span className="inline-block animate-pulse">
                    {MENSAJE_CIFRADO}
                  </span>
                )}
                {fase === 'seguro' && MENSAJE_CIFRADO}
              </p>

              {/* Etiqueta de estado */}
              <div className={`mt-1.5 flex items-center gap-1 transition-opacity duration-300 ${
                fase === 'enviando' ? 'opacity-0' : 'opacity-100'
              }`}>
                {fase === 'interceptado' && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span className="text-[9px] text-red-500 font-medium">Texto plano expuesto</span>
                  </>
                )}
                {fase === 'cifrando' && (
                  <>
                    <div className="h-2.5 w-2.5 animate-spin rounded-full border border-accent border-t-transparent" />
                    <span className="text-[9px] text-accent font-medium">AES-256-GCM</span>
                  </>
                )}
                {fase === 'seguro' && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span className="text-[9px] text-accent font-medium">Cifrado E2EE</span>
                  </>
                )}
              </div>
            </div>

            {/* Atacante (aparece en fase interceptado) */}
            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full flex flex-col items-center gap-1 transition-all duration-700 ${
              fase === 'interceptado'
                ? 'opacity-100 translate-y-[calc(100%+4px)]'
                : fase === 'seguro'
                  ? 'opacity-100 translate-y-[calc(100%+4px)]'
                  : 'opacity-0 translate-y-[calc(100%+20px)] pointer-events-none'
            }`}>
              <div className="h-px w-6 bg-border" />
              <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all duration-500 ${
                fase === 'interceptado'
                  ? 'border-red-500/30 bg-red-950/20'
                  : 'border-border bg-surface-elevated'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 transition-colors duration-500 ${
                  fase === 'interceptado' ? 'text-red-500' : 'text-muted'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className={`text-[10px] font-medium transition-colors duration-500 ${
                  fase === 'interceptado' ? 'text-red-400' : 'text-muted'
                }`}>
                  {fase === 'interceptado' ? '¡Puede leerlo!' : 'Solo ve cifrado'}
                </span>
              </div>
              <span className="text-[9px] text-muted">Atacante</span>
            </div>
          </div>

          {/* Receptor */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-500 ${
              fase === 'seguro'
                ? 'border-accent bg-accent/10'
                : 'border-border bg-surface-elevated'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="text-[10px] text-muted">Receptor</span>
          </div>
        </div>

        {/* ── Barra de progreso ─────────────────────────────────────── */}
        <div className="mt-8 mb-1 flex items-center gap-2">
          {FASES.map((f, i) => (
            <div key={f} className="flex-1">
              <div className={`h-1 rounded-full transition-all duration-500 ${
                FASES.indexOf(fase) >= i
                  ? fase === 'interceptado' && i === 1
                    ? 'bg-red-500'
                    : 'bg-accent'
                  : 'bg-border'
              }`} />
            </div>
          ))}
        </div>

        {/* Leyenda del paso actual */}
        <div className="text-center">
          <p className={`text-xs font-medium transition-colors duration-300 ${
            fase === 'interceptado' ? 'text-red-400' : 'text-foreground-secondary'
          }`}>
            {fase === 'enviando' && 'Un SMS viaja por la red del operador…'}
            {fase === 'interceptado' && 'Un atacante con acceso a la red lee tu mensaje.'}
            {fase === 'cifrando' && 'NexoLibre cifra con AES-256-GCM antes de enviar.'}
            {fase === 'seguro' && 'El atacante solo ve datos cifrados. Tu mensaje está seguro.'}
          </p>
        </div>
      </div>
    </div>
  )
}
