import React from 'react'

interface StatusCardProps {
  estado: 'activo' | 'inactivo'
  titulo: string
  descripcion: string
}

export function StatusCard({ estado, titulo, descripcion }: StatusCardProps) {
  const isActivo = estado === 'activo'
  const textColorClass = isActivo ? 'text-green-400' : 'text-yellow-400'

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-md p-4 flex items-start gap-3">
      <div className={`mt-0.5 flex shrink-0 items-center justify-center ${textColorClass}`}>
        {isActivo ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-200">{titulo}</h3>
        <p className="text-xs text-gray-400 mt-1">{descripcion}</p>
      </div>
    </div>
  )
}
