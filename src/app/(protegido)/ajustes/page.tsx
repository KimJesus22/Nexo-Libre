/**
 * Página de Ajustes — /ajustes
 *
 * Vista de configuración de privacidad del usuario.
 */

import AjustesPrivacidad from './_componentes/AjustesPrivacidad'

export const metadata = {
  title: 'Ajustes de privacidad',
  description: 'Configura cómo NexoLibre gestiona tus datos — NexoLibre.',
}

export default function PaginaAjustes() {
  return (
    <main className="flex flex-1 justify-center px-4 py-8 md:px-8">
      <AjustesPrivacidad />
    </main>
  )
}
