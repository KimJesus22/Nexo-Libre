'use client'

import { useState, useEffect } from 'react'

export default function OnboardingTour() {
  const [paso, setPaso] = useState(1)
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    // Evitamos mostrar el tour en SSR y lo mostramos solo si no fue cerrado en esta sesión
    if (!sessionStorage.getItem('onboardingTourVisto')) {
      setMostrar(true)
    }
  }, [])

  const cerrarGuia = () => {
    sessionStorage.setItem('onboardingTourVisto', 'true')
    setMostrar(false)
  }

  const siguientePaso = () => {
    if (paso < 3) {
      setPaso(paso + 1)
    } else {
      cerrarGuia()
    }
  }

  const anteriorPaso = () => {
    if (paso > 1) {
      setPaso(paso - 1)
    }
  }

  if (!mostrar) return null

  // Información de cada paso
  const pasosInfo = [
    {
      titulo: "Bienvenido a NexoLibre",
      descripcion: "Este es tu panel de control. Desde aquí puedes gestionar tu identidad y actividad de forma segura."
    },
    {
      titulo: "Score de Seguridad",
      descripcion: "Monitorea constantemente tu score. Te indicaremos las mejores prácticas para mantener tu información encriptada y segura."
    },
    {
      titulo: "Chats y Privacidad",
      descripcion: "Nadie puede leer tus mensajes. Tu comunicación está protegida con cifrado de extremo a extremo real."
    }
  ]

  const pasoActual = pasosInfo[paso - 1]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop con desenfoque que destaca la tarjeta sobre el fondo */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={cerrarGuia} 
        aria-hidden="true"
      />

      {/* Tarjeta del Tour Accesible */}
      <div 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="tour-titulo"
        aria-describedby="tour-descripcion"
        className="relative z-10 w-full max-w-sm rounded-2xl bg-surface border border-border p-6 shadow-[0_0_40px_rgba(16,185,129,0.1)] animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="mb-4">
          <span className="text-xs font-semibold text-accent mb-2 block uppercase tracking-wider">
            Paso {paso} de 3
          </span>
          <h2 id="tour-titulo" className="text-xl font-bold text-gray-200">
            {pasoActual.titulo}
          </h2>
          <p id="tour-descripcion" className="mt-3 text-sm leading-relaxed text-gray-400">
            {pasoActual.descripcion}
          </p>
        </div>

        {/* Indicador de progreso (Dots) */}
        <div className="flex items-center gap-2 mb-6 justify-center" aria-hidden="true">
          {[1, 2, 3].map((p) => (
            <div 
              key={p} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                p === paso ? 'w-6 bg-accent' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Botón de Cerrar guía claramente visible */}
          <button
            type="button"
            onClick={cerrarGuia}
            className="text-sm font-medium text-gray-400 hover:text-accent underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1 py-0.5 transition-colors"
          >
            Cerrar guía
          </button>
          
          <div className="flex items-center gap-3">
            {paso > 1 && (
              <button
                type="button"
                onClick={anteriorPaso}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-gray-200 hover:bg-surface-elevated hover:border-accent/50 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
              >
                Anterior
              </button>
            )}
            <button
              type="button"
              onClick={siguientePaso}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
            >
              {paso === 3 ? 'Finalizar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
