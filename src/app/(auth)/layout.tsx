/**
 * Layout del grupo de autenticación — NexoLibre
 *
 * Envuelve las páginas de iniciar-sesion, registrarse y verificar-correo.
 * Centra el contenido en la pantalla sin barra de navegación.
 */
export default function LayoutAuth({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      {children}
    </main>
  )
}
