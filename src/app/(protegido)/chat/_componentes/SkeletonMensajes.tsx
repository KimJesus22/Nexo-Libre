'use client'

/**
 * SkeletonMensajes — NexoLibre
 *
 * Skeleton loader para la ventana de mensajes.
 * Alterna burbujas izquierda/derecha con anchos variados
 * para simular una conversación real durante la carga.
 */

function SkeletonBurbuja({
  propio,
  ancho,
}: {
  propio: boolean
  ancho: string
}) {
  return (
    <div className={`flex ${propio ? 'justify-end' : 'justify-start'} px-4`}>
      <div
        className={`animate-pulse rounded-2xl ${ancho} ${
          propio
            ? 'rounded-br-md bg-accent/15'
            : 'rounded-bl-md bg-surface-elevated'
        }`}
      >
        {/* Líneas de texto simuladas */}
        <div className="space-y-1.5 p-3">
          <div className={`h-3 rounded bg-border/30 ${propio ? 'w-full' : 'w-[90%]'}`} />
          {ancho !== 'w-24' && (
            <div className={`h-3 rounded bg-border/20 ${propio ? 'w-[70%] ml-auto' : 'w-[75%]'}`} />
          )}
        </div>
      </div>
    </div>
  )
}

export default function SkeletonMensajes() {
  // Patrón realista de burbujas: alternas, anchos variados
  const burbujas: { propio: boolean; ancho: string }[] = [
    { propio: false, ancho: 'w-48' },
    { propio: false, ancho: 'w-32' },
    { propio: true, ancho: 'w-56' },
    { propio: true, ancho: 'w-24' },
    { propio: false, ancho: 'w-64' },
    { propio: true, ancho: 'w-40' },
    { propio: false, ancho: 'w-36' },
    { propio: true, ancho: 'w-52' },
  ]

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header skeleton */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-surface-elevated" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-32 animate-pulse rounded bg-surface-elevated" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-surface-elevated/60" />
        </div>
        <div className="h-8 w-8 animate-pulse rounded-lg bg-surface-elevated" />
      </header>

      {/* Burbujas skeleton */}
      <div className="flex-1 space-y-3 overflow-hidden py-4">
        {burbujas.map((b, i) => (
          <SkeletonBurbuja key={i} propio={b.propio} ancho={b.ancho} />
        ))}
      </div>

      {/* Input skeleton */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-surface-elevated" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-surface-elevated" />
        </div>
      </div>
    </div>
  )
}
