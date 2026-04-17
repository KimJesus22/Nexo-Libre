/**
 * Página principal — NexoLibre
 *
 * Server Component por defecto.
 * Muestra un mensaje de bienvenida con enlaces de autenticación.
 */
import Link from 'next/link'

export default function PaginaInicio() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          NexoLibre
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Plataforma modular construida con Next.js&nbsp;16, Tailwind&nbsp;CSS&nbsp;v4
          y Supabase. Todo listo para desarrollar.
        </p>
      </header>

      <nav aria-label="Acciones principales">
        <ul className="flex flex-wrap justify-center gap-4" role="list">
          <li>
            <Link
              href="/iniciar-sesion"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent"
            >
              Iniciar sesión
            </Link>
          </li>
          <li>
            <Link
              href="/registrarse"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-accent"
            >
              Crear cuenta
            </Link>
          </li>
        </ul>
      </nav>

      <footer className="mt-4 text-center text-sm text-muted">
        <p>
          Edita{' '}
          <code className="rounded bg-border/50 px-1.5 py-0.5 font-mono text-xs text-foreground">
            src/app/page.tsx
          </code>{' '}
          para comenzar.
        </p>
      </footer>
    </main>
  )
}
