import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión",
  description: "NexoLibre no puede conectarse a internet en este momento.",
};

/**
 * Página de fallback offline.
 *
 * Se muestra cuando el Service Worker intercepta una solicitud de navegación
 * y no hay conexión a internet ni contenido en caché disponible.
 */
export default function OfflinePage() {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Ícono de desconexión */}
      <div
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl"
        style={{
          background: "var(--surface-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--muted)" }}
        >
          {/* Wi-Fi off icon */}
          <path d="M1 1l22 22" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="1" />
        </svg>
      </div>

      {/* Título */}
      <h1
        className="mb-3 text-2xl font-semibold"
        style={{ color: "var(--foreground)" }}
      >
        Sin conexión
      </h1>

      {/* Descripción */}
      <p
        className="mb-8 max-w-md text-base leading-relaxed"
        style={{ color: "var(--foreground-secondary)" }}
      >
        No hay conexión a internet disponible. Verifica tu conexión e intenta de
        nuevo.
      </p>

      {/* Botón de reintentar */}
      <button
        onClick={undefined}
        className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200"
        style={{
          background: "var(--accent)",
          color: "var(--accent-foreground)",
        }}
        id="offline-retry-button"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        Reintentar
      </button>

      {/* Nota */}
      <p className="mt-12 text-xs" style={{ color: "var(--muted)" }}>
        NexoLibre funciona mejor con una conexión estable.
      </p>

      {/* Script inline para el botón de reintentar (funciona offline) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('offline-retry-button')?.addEventListener('click', function() {
              window.location.reload();
            });
          `,
        }}
      />
    </main>
  );
}
