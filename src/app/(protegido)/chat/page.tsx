/**
 * Página de Chat — /chat
 *
 * Interfaz de mensajería con sidebar de contactos y ventana de chat.
 * Responsiva: sidebar ocupa pantalla completa en mobile.
 */

import InterfazChat from './_componentes/InterfazChat'

export const metadata = {
  title: 'Chat',
  description: 'Mensajería segura en tiempo real — NexoLibre.',
}

export default function PaginaChat() {
  return (
    <main className="flex flex-1 items-center justify-center p-0 md:p-4">
      <InterfazChat />
    </main>
  )
}
