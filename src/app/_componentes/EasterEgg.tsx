'use client'

import { useEffect } from 'react'

let hasShownEasterEgg = false

export default function EasterEgg() {
  useEffect(() => {
    // Evitar que se ejecute más de una vez en modo desarrollo estricto (React 18+)
    if (typeof window !== 'undefined' && !hasShownEasterEgg) {
      console.log(
        '%c¿Buscando vulnerabilidades? Nos encanta tu curiosidad. El código de NexoLibre es abierto. Audítanos en GitHub.',
        'color: #00FFCC; background-color: #000; font-size: 14px; padding: 10px; border-radius: 4px;'
      )
      hasShownEasterEgg = true
    }
  }, [])

  return null
}
