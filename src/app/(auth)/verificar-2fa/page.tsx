/**
 * Página de verificación 2FA — /verificar-2fa
 *
 * Se muestra después del login si el usuario tiene TOTP activado.
 * El componente Client Component maneja toda la lógica de MFA.
 */
import type { Metadata } from 'next'
import Verificar2FA from '@/app/(auth)/_componentes/Verificar2FA'

export const metadata: Metadata = {
  title: 'Verificación 2FA',
  description: 'Verifica tu identidad con tu aplicación autenticadora.',
}

export default function PaginaVerificar2FA() {
  return <Verificar2FA />
}
