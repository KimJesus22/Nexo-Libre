'use client'

/**
 * Componente IdPublico — NexoLibre
 *
 * Muestra un identificador público corto generado a partir de un UUID.
 * Incluye funcionalidad de copiar al portapapeles con feedback visual.
 *
 * Uso:
 *   <IdPublico uuid="550e8400-e29b-41d4-a716-446655440000" />
 *   <IdPublico uuid={user.id} formato="hex" longitud={10} />
 */

import { useState, useCallback } from 'react'
import { generarIdPublico, generarHexCorto } from '@/lib/id-publico'

interface PropiedadesIdPublico {
  /** UUID del usuario (de auth.users o Supabase) */
  uuid: string
  /** Formato de salida: base62 (compacto) o hex (hexadecimal corto) */
  formato?: 'base62' | 'hex'
  /** Longitud del identificador generado (default: 8) */
  longitud?: number
  /** Prefijo visual opcional (ej: "NX-", "#") */
  prefijo?: string
  /** Mostrar botón de copiar al portapapeles */
  copiable?: boolean
  /** Clases CSS adicionales para el contenedor */
  className?: string
}

export default function IdPublico({
  uuid,
  formato = 'base62',
  longitud = 8,
  prefijo = '',
  copiable = true,
  className = '',
}: PropiedadesIdPublico) {
  const [copiado, setCopiado] = useState(false)

  const idGenerado =
    formato === 'base62'
      ? generarIdPublico(uuid, longitud)
      : generarHexCorto(uuid, longitud)

  const idCompleto = `${prefijo}${idGenerado}`

  const copiarAlPortapapeles = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(idCompleto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Fallback para navegadores que no soportan la Clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = idCompleto
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }, [idCompleto])

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-sm text-foreground transition-colors ${className}`}
      title={`ID público: ${idCompleto} (UUID: ${uuid})`}
    >
      {/* Prefijo con estilo diferenciado */}
      {prefijo && (
        <span className="text-muted" aria-hidden="true">
          {prefijo}
        </span>
      )}

      {/* Identificador */}
      <span className="select-all tracking-wide">{idGenerado}</span>

      {/* Botón copiar */}
      {copiable && (
        <button
          type="button"
          onClick={copiarAlPortapapeles}
          className="ml-0.5 rounded p-0.5 text-muted transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={copiado ? 'Copiado' : 'Copiar identificador'}
        >
          {copiado ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      )}
    </span>
  )
}
