'use client'

/**
 * ProveedorOnboarding — NexoLibre
 *
 * Wrapper client-side que:
 * 1. Verifica si el usuario tiene nombre_usuario en su perfil
 * 2. Si no lo tiene → muestra ModalOnboarding (no dismissable)
 * 3. Al completar → recarga la página para refrescar el layout server
 */

import { useState } from 'react'
import ModalOnboarding from './ModalOnboarding'

interface PropsProveedor {
  userId: string
  emailUsuario: string
  requiereOnboarding: boolean
  children: React.ReactNode
}

export default function ProveedorOnboarding({
  userId,
  emailUsuario,
  requiereOnboarding,
  children,
}: PropsProveedor) {
  const [mostrar, setMostrar] = useState(requiereOnboarding)

  return (
    <>
      {children}
      {mostrar && (
        <ModalOnboarding
          userId={userId}
          emailUsuario={emailUsuario}
          alCompletar={() => {
            setMostrar(false)
            // Recargar para que el server layout refresque los datos del perfil
            window.location.reload()
          }}
        />
      )}
    </>
  )
}
