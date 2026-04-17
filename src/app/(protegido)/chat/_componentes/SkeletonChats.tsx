'use client'

/**
 * SkeletonChats — NexoLibre
 *
 * Skeleton loader para la lista de chats en la sidebar.
 * Muestra 6 filas con animación shimmer que replica
 * la estructura visual real: avatar + nombre + último mensaje.
 */

export function SkeletonChatItem() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-l-2 border-l-transparent">
      {/* Avatar */}
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-elevated" />

      {/* Info */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-28 animate-pulse rounded bg-surface-elevated" />
          <div className="h-2.5 w-10 animate-pulse rounded bg-surface-elevated" />
        </div>
        <div className="h-3 w-40 animate-pulse rounded bg-surface-elevated/60" />
      </div>
    </div>
  )
}

export default function SkeletonChats() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="h-5 w-14 animate-pulse rounded bg-surface-elevated" />
        <div className="h-8 w-8 animate-pulse rounded-lg bg-surface-elevated" />
      </div>

      {/* Búsqueda skeleton */}
      <div className="shrink-0 border-b border-border-subtle px-3 py-2">
        <div className="h-9 w-full animate-pulse rounded-lg bg-surface-elevated/50" />
      </div>

      {/* Lista skeleton */}
      <div className="flex-1 divide-y divide-border-subtle">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonChatItem key={i} />
        ))}
      </div>
    </div>
  )
}
