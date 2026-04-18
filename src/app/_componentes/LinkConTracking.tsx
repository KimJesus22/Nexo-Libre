'use client'

/**
 * LinkConTracking — NexoLibre
 *
 * Componente wrapper para <Link> que dispara un evento de analíticas
 * al hacer clic, sin bloquear la navegación.
 */

import Link from 'next/link'
import { trackEvento } from '@/lib/analiticas'

interface Props {
  href: string
  evento: string
  datosEvento?: Record<string, string | number>
  className?: string
  children: React.ReactNode
}

export default function LinkConTracking({
  href,
  evento,
  datosEvento,
  className,
  children,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvento(evento, datosEvento)}
    >
      {children}
    </Link>
  )
}
