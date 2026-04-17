/**
 * Layout para rutas protegidas — NexoLibre
 *
 * Verifica que el usuario esté autenticado antes de renderizar.
 * Si no hay sesión, redirige a /iniciar-sesion.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LayoutProtegido({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/iniciar-sesion')
  }

  return <>{children}</>
}
