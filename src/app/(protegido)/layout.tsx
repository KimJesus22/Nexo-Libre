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
import NavegacionGlobal from './_componentes/NavegacionGlobal'

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
      <div className="flex min-h-screen flex-col">
        <NavegacionGlobal />
        <div className="flex-1 flex flex-col">
          <div className="mx-auto max-w-7xl w-full flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </div>
      </div>
    </ProveedorOnboarding>
  )
}
