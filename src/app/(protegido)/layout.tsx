/**
 * Layout para rutas protegidas — NexoLibre
 *
 * Verifica que el usuario esté autenticado antes de renderizar.
 * Si no hay sesión, redirige a /iniciar-sesion.
 *
 * Si el usuario no tiene seudónimo (nombre_usuario), muestra
 * el modal de Onboarding para completar su perfil.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProveedorOnboarding from './_componentes/ProveedorOnboarding'

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

  // Verificar si el perfil tiene nombre_usuario
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre_usuario')
    .eq('id', user.id)
    .single()

  const requiereOnboarding = !perfil?.nombre_usuario

  return (
    <ProveedorOnboarding
      userId={user.id}
      emailUsuario={user.email ?? ''}
      requiereOnboarding={requiereOnboarding}
    >
      {children}
    </ProveedorOnboarding>
  )
}
