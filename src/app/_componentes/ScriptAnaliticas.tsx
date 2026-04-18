'use client'

/**
 * ScriptAnaliticas — NexoLibre
 *
 * Componente que inyecta el script de Umami Analytics de forma condicional.
 * Solo se renderiza si hay un WEBSITE_ID configurado.
 *
 * Atributos de privacidad:
 * - data-do-not-track="true": respeta DNT del navegador
 * - data-domains: restringe el tracking solo al dominio de producción
 * - async + defer: no bloquea el render
 */

import { useEffect, useState } from 'react'
import { UMAMI_SCRIPT_URL, UMAMI_WEBSITE_ID } from '@/lib/analiticas'

export default function ScriptAnaliticas() {
  const [montar, setMontar] = useState(false)

  useEffect(() => {
    // No montar en desarrollo, sin Website ID, o con Do Not Track
    if (!UMAMI_WEBSITE_ID) return
    if (window.location.hostname === 'localhost') return
    if (navigator.doNotTrack === '1') return

    setMontar(true)
  }, [])

  if (!montar) return null

  return (
    <script
      async
      defer
      data-website-id={UMAMI_WEBSITE_ID}
      data-do-not-track="true"
      data-domains="nexolibre.app,nexo-libre.vercel.app"
      src={UMAMI_SCRIPT_URL}
    />
  )
}
