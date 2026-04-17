/**
 * Página de registro — /registrarse
 */
import FormularioRegistro from '@/app/(auth)/_componentes/FormularioRegistro'

export const metadata = {
  title: 'Crear cuenta',
  description: 'Crea tu cuenta en NexoLibre con correo electrónico.',
}

export default function PaginaRegistrarse() {
  return <FormularioRegistro />
}
