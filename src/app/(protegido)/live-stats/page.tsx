import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TerminalStats from './TerminalStats'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Stats | NexoLibre',
  description: 'Estadísticas en tiempo real de la red NexoLibre.',
}

/**
 * Página /live-stats
 *
 * Ruta protegida exclusiva para administradores.
 * Valida el correo del usuario autenticado contra NEXT_PUBLIC_ADMIN_EMAIL o ADMIN_EMAIL.
 * Si no es admin, redirige al /panel.
 */
export default async function PaginaLiveStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/iniciar-sesion')
  }

  // Validación de administrador
  // Se pueden configurar varios correos separados por coma
  const adminEmailsEnv = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@nexolibre.com'
  const allowedAdminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase())
  
  if (!user.email || !allowedAdminEmails.includes(user.email.toLowerCase())) {
    // Si no es admin, no puede acceder a esta ruta
    redirect('/panel')
  }

  // Renderizar la terminal (Client Component que conecta con Realtime)
  return (
    <div className="h-screen w-full bg-black">
      <TerminalStats />
    </div>
  )
}
