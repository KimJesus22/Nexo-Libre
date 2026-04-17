"use client";

/**
 * Página de error global — NexoLibre
 *
 * Se muestra cuando ocurre un error no capturado en la aplicación.
 * Archivo especial de Next.js: error.tsx (debe ser Client Component).
 */

interface PropiedadesError {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PaginaError({ error, reset }: PropiedadesError) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-destructive">
        Algo salió mal
      </h1>
      <p className="max-w-md text-lg text-muted">
        Ocurrió un error inesperado. Intenta recargar la página.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted">
          Código de error: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent"
      >
        Intentar de nuevo
      </button>
    </main>
  );
}
