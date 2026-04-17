/**
 * Página de inicio de sesión — /iniciar-sesion
 */
import FormularioInicioSesion from '@/app/(auth)/_componentes/FormularioInicioSesion'

export const metadata = {
  title: 'Iniciar sesión',
  description: 'Accede a tu cuenta de NexoLibre con correo electrónico.',
}

export default function PaginaIniciarSesion() {
  return <FormularioInicioSesion />
}
