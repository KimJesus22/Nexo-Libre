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
  const [mostrar, setMostrar] = useState(() => {
    if (typeof window !== 'undefined') {
      return requiereOnboarding && !sessionStorage.getItem('onboardingSkipped')
    }
    return requiereOnboarding
  })

  return (
    <>
      {children}
      {mostrar && (
        <ModalOnboarding
          userId={userId}
          emailUsuario={emailUsuario}
          alCompletar={() => {
            setMostrar(false)
            window.location.reload()
          }}
          alOmitir={() => {
            sessionStorage.setItem('onboardingSkipped', 'true')
            setMostrar(false)
          }}
        />
      )}
    </>
  )
}
