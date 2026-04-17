/**
 * Página 404 — NexoLibre
 *
 * Se muestra cuando el usuario navega a una ruta que no existe.
 * Archivo especial de Next.js: not-found.tsx
 */
import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="max-w-md text-lg text-muted">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
