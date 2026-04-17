'use client'

/**
 * AntiScreenshotWrapper — NexoLibre
 *
 * Contenedor avanzado que dificulta la toma de capturas de pantalla (screenshots)
 * o fotografías con cámaras externas.
 *
 * Técnicas aplicadas:
 * 1. SVG Filtro de Ruido (feTurbulence): genera estática estocástica sobre el texto.
 * 2. Moiré Pattern CSS: patrón de líneas finas animadas que causa interferencia en cámaras.
 * 3. Opacidad Parpadeante (Flicker): oscila a alta frecuencia, causando banding en capturas.
 * 4. User-select-none: previene el resaltado de texto para copiado fácil.
 *
 * El ojo humano filtra estas interferencias en tiempo real, pero el sensor de una cámara
 * o el render de una captura de pantalla capta el "ruido" en un fotograma estático,
 * reduciendo dramáticamente la legibilidad.
 */

import { ReactNode } from 'react'

export default function AntiScreenshotWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="anti-screenshot-container group relative inline-block overflow-hidden select-none">
      
      {/* ── Filtro SVG invisible en el DOM, referenciado por CSS ── */}
      <svg className="hidden w-0 h-0" aria-hidden="true">
        <filter id="noise-filter">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.9" 
            numOctaves="3" 
            stitchTiles="stitch" 
          />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0" />
          <feComposite operator="in" in2="SourceGraphic" result="monoNoise" />
          <feBlend in="SourceGraphic" in2="monoNoise" mode="screen" />
        </filter>
      </svg>

      {/* ── Contenido Real (Sometido a micro-parpadeo) ── */}
      <div className="relative z-10 animate-[flicker_0.15s_infinite_alternate] drop-shadow-sm">
        {children}
      </div>

      {/* ── Capa 1: Filtro de Ruido Estático ── */}
      <div 
        className="pointer-events-none absolute inset-0 z-20 mix-blend-overlay opacity-30 group-hover:opacity-10 transition-opacity"
        style={{ filter: 'url(#noise-filter)' }}
        aria-hidden="true"
      />

      {/* ── Capa 2: Moiré Interference Pattern (Anti-Cámara) ── */}
      <div 
        className="pointer-events-none absolute -inset-[100%] z-30 animate-[scan_8s_linear_infinite] opacity-15 mix-blend-difference"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,0,0.8) 1px, rgba(0,255,0,0.8) 2px)',
          backgroundSize: '100% 2px'
        }}
        aria-hidden="true"
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flicker {
          0% { opacity: 0.92; transform: translateY(0px) scale(1); filter: contrast(1); }
          50% { opacity: 1; transform: translateY(0.1px) scale(0.999); filter: contrast(1.05); }
          100% { opacity: 0.88; transform: translateY(-0.1px) scale(1.001); filter: contrast(0.95); }
        }
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(50%); }
        }
        .anti-screenshot-container {
          /* Evita que el navegador suavice en exceso las sub-pixel font anti-aliasing */
          -webkit-font-smoothing: none;
          text-rendering: geometricPrecision;
        }
      `}} />
    </div>
  )
}
