/**
 * Esqueleto de carga — NexoLibre
 *
 * Se muestra mientras se carga el contenido de una página.
 * Archivo especial de Next.js: loading.tsx
 */
export default function Cargando() {
  return (
    <main className="flex flex-1 items-center justify-center" aria-busy="true" aria-label="Cargando contenido">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent"
          role="status"
        >
          <span className="sr-only">Cargando…</span>
        </div>
        <p className="text-sm text-muted">Cargando…</p>
      </div>
    </main>
  );
}
