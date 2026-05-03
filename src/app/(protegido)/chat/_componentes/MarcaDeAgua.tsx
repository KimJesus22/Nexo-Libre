'use client'

/**
 * MarcaDeAgua — NexoLibre
 *
 * Watermark dinámico de seguridad superpuesto sobre la interfaz de chat.
 *
 * Propósito:
 *   - Disuasivo visual contra capturas de pantalla maliciosas
 *   - Identifica al usuario filtrador si la imagen circula
 *   - El slug/ID se repite diagonalmente en un patrón de mosaico
 *
 * Implementación:
 *   - SVG inline como background-image (máxima performance, 0 DOM nodes)
 *   - Rotación -30° del texto dentro del tile SVG
 *   - Opacidad extremadamente baja (3-5%) → invisible en uso normal,
 *     visible al ajustar brillo/contraste de una captura
 *   - pointer-events-none + select-none → no interfiere con clics ni texto
 *   - aria-hidden → invisible para lectores de pantalla
 *
 * El componente obtiene el nombre_usuario (slug) del perfil del usuario.
 * Si no está disponible, usa los primeros 8 caracteres del userId como fallback.
 */

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PropsMarcaDeAgua {
  /** UUID del usuario autenticado */
  userId: string | null
}

export default function MarcaDeAgua({ userId }: PropsMarcaDeAgua) {
  const [etiqueta, setEtiqueta] = useState<string | null>(null)

  // Obtener el slug del usuario al montar
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    supabase
      .from('perfiles')
      .select('nombre_usuario')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        // Usar nombre_usuario (slug) o los primeros 8 chars del UUID como fallback
        setEtiqueta(data?.nombre_usuario ?? userId.slice(0, 8))
      })
  }, [userId])

  // Generar el SVG tile con el texto rotado
  const backgroundSVG = useMemo(() => {
    if (!etiqueta) return null

    // Escapar caracteres especiales para uso en SVG
    const textoSeguro = etiqueta
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

    // Tile SVG: texto rotado -30° en un cuadro de 280x160px
    // El texto se coloca en el centro del tile, la rotación genera el efecto diagonal
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="280" height="160" viewBox="0 0 280 160">
        <text
          x="140"
          y="80"
          text-anchor="middle"
          dominant-baseline="central"
          transform="rotate(-30 140 80)"
          fill="currentColor"
          font-family="ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
          font-size="11"
          font-weight="500"
          letter-spacing="1"
        >${textoSeguro}</text>
      </svg>
    `.trim()

    // Codificar como data URI (más eficiente que base64 para SVG)
    const encoded = encodeURIComponent(svg)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')

    return `url("data:image/svg+xml,${encoded}")`
  }, [etiqueta])

  // No renderizar si no hay datos
  if (!userId || !backgroundSVG) return null

  return (
    <div
      className="marca-de-agua"
      aria-hidden="true"
      style={{
        backgroundImage: backgroundSVG,
        backgroundRepeat: 'repeat',
        color: 'var(--foreground)',
      }}
    />
  )
}
