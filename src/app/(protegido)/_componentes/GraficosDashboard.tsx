'use client'

/**
 * Gráficos animados del Dashboard — NexoLibre
 *
 * Implementa animaciones suaves usando conceptos de cálculo diferencial:
 *
 * 1. **Easing cúbico** — f(t) = 3t² - 2t³ (Hermite smoothstep)
 *    Derivada: f'(t) = 6t - 6t² = 6t(1-t), siempre ≥0 en [0,1]
 *    Esto garantiza monotonía (la animación nunca retrocede)
 *    y f'(0) = f'(1) = 0 (arranca y frena suavemente).
 *
 * 2. **Interpolación lineal** — lerp(a, b, t) = a + (b - a) * t
 *    Para animar valores numéricos de un estado a otro.
 *
 * 3. **SVG arcos circulares** — parametrización polar:
 *    x(θ) = cx + r·cos(θ), y(θ) = cy + r·sin(θ)
 *    El stroke-dasharray simula progreso radial.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

/* ── Funciones de easing (cálculo diferencial) ────────────────────────────── */

/**
 * Smoothstep de Hermite: f(t) = 3t² − 2t³
 * - f(0) = 0, f(1) = 1
 * - f'(0) = 0, f'(1) = 0 → arranque y frenado suaves
 * - f''(t) = 6 − 12t → punto de inflexión en t = 0.5
 */
function smoothstep(t: number): number {
  const tc = Math.max(0, Math.min(1, t))
  return tc * tc * (3 - 2 * tc)
}

/**
 * Ease-out cuadrático: f(t) = 1 − (1−t)²
 * Derivada: f'(t) = 2(1−t) → desacelera linealmente
 */
function easeOutQuad(t: number): number {
  const tc = Math.max(0, Math.min(1, t))
  return 1 - (1 - tc) * (1 - tc)
}

/** Interpolación lineal */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/* ── Hook: animar un valor numérico ───────────────────────────────────────── */

function useValorAnimado(objetivo: number, duracion: number = 1200): number {
  const [valor, setValor] = useState(0)
  const inicioRef = useRef<number | null>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    inicioRef.current = null

    function animar(timestamp: number) {
      if (inicioRef.current === null) inicioRef.current = timestamp
      const progreso = Math.min((timestamp - inicioRef.current) / duracion, 1)
      const eased = smoothstep(progreso)
      setValor(lerp(0, objetivo, eased))

      if (progreso < 1) {
        frameRef.current = requestAnimationFrame(animar)
      }
    }

    frameRef.current = requestAnimationFrame(animar)
    return () => cancelAnimationFrame(frameRef.current)
  }, [objetivo, duracion])

  return valor
}

/* ── Componente: Progreso radial animado ───────────────────────────────────── */

interface ProgresoRadialProps {
  porcentaje: number
  etiqueta: string
  color?: string
  tamaño?: number
}

export function ProgresoRadial({
  porcentaje,
  etiqueta,
  color = 'var(--accent)',
  tamaño = 120,
}: ProgresoRadialProps) {
  const animado = useValorAnimado(porcentaje, 1500)

  // Parámetros del arco — geometría polar
  const radio = (tamaño - 12) / 2
  const circunferencia = 2 * Math.PI * radio // C = 2πr
  const dashOffset = circunferencia * (1 - animado / 100)
  const centro = tamaño / 2

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: tamaño, height: tamaño }}>
        <svg
          width={tamaño}
          height={tamaño}
          viewBox={`0 0 ${tamaño} ${tamaño}`}
          className="-rotate-90"
        >
          {/* Track de fondo */}
          <circle
            cx={centro}
            cy={centro}
            r={radio}
            fill="none"
            stroke="var(--border)"
            strokeWidth={8}
          />
          {/* Arco de progreso */}
          <circle
            cx={centro}
            cy={centro}
            r={radio}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 0.1s linear',
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        {/* Valor central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {Math.round(animado)}
            <span className="text-sm text-muted">%</span>
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted">{etiqueta}</span>
    </div>
  )
}

/* ── Componente: Gráfico de barras animado ────────────────────────────────── */

interface BarraActividad {
  dia: string
  valor: number
}

interface GraficoBarrasProps {
  datos: BarraActividad[]
  alturaMax?: number
}

export function GraficoBarras({ datos, alturaMax = 100 }: GraficoBarrasProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const maximo = Math.max(...datos.map((d) => d.valor), 1)

  return (
    <div ref={ref} className="flex items-end justify-between gap-1.5" style={{ height: alturaMax }}>
      {datos.map((barra, i) => {
        const alturaPct = (barra.valor / maximo) * 100
        return (
          <div key={barra.dia} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: visible ? `${alturaPct}%` : '0%',
                background: `linear-gradient(to top, var(--accent), var(--accent-hover))`,
                transitionDuration: `${600 + i * 80}ms`,
                // Función de easing cúbica: cubic-bezier derivada de smoothstep
                // Control points calculados: P1=(0.4, 0), P2=(0.2, 1)
                // f'(0) ≈ 0 (arranque suave), f'(1) ≈ 0 (frenado suave)
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: visible ? 1 : 0,
              }}
            />
            <span className="text-[10px] text-muted">{barra.dia}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Componente: Contador animado ─────────────────────────────────────────── */

interface ContadorProps {
  valor: number
  sufijo?: string
  duracion?: number
}

export function Contador({ valor, sufijo = '', duracion = 1000 }: ContadorProps) {
  const animado = useValorAnimado(valor, duracion)
  return (
    <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
      {Math.round(animado)}
      {sufijo && <span className="text-sm text-muted">{sufijo}</span>}
    </span>
  )
}

/* ── Componente: Curva suavizada con SVG ──────────────────────────────────── */

interface GraficoCurvaProps {
  puntos: number[]
  ancho?: number
  alto?: number
}

export function GraficoCurva({ puntos, ancho = 300, alto = 80 }: GraficoCurvaProps) {
  const [progreso, setProgreso] = useState(0)
  const frameRef = useRef<number>(0)
  const inicioRef = useRef<number | null>(null)

  const animar = useCallback((timestamp: number) => {
    if (inicioRef.current === null) inicioRef.current = timestamp
    const t = Math.min((timestamp - inicioRef.current) / 2000, 1)
    setProgreso(easeOutQuad(t))
    if (t < 1) frameRef.current = requestAnimationFrame(animar)
  }, [])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animar)
    return () => cancelAnimationFrame(frameRef.current)
  }, [animar])

  if (puntos.length < 2) return null

  const maxVal = Math.max(...puntos)
  const minVal = Math.min(...puntos)
  const rango = maxVal - minVal || 1
  const padding = 4

  // Convertir puntos a coordenadas SVG
  const coords = puntos.map((v, i) => ({
    x: padding + (i / (puntos.length - 1)) * (ancho - padding * 2),
    y: padding + (1 - (v - minVal) / rango) * (alto - padding * 2),
  }))

  /**
   * Curva suavizada con splines cúbicos de Catmull-Rom → Bézier
   *
   * La conversión usa la derivada numérica en cada punto:
   *   m_k ≈ (P_{k+1} - P_{k-1}) / 2
   * para calcular los puntos de control de una curva Bézier cúbica:
   *   CP1 = P_k + m_k / 3
   *   CP2 = P_{k+1} - m_{k+1} / 3
   *
   * Esto produce una curva C¹-continua (tangentes continuas en cada punto).
   */
  let pathD = `M ${coords[0].x},${coords[0].y}`

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[Math.min(coords.length - 1, i + 2)]

    // Derivadas numéricas (aproximación de diferencias centrales)
    const m1x = (p2.x - p0.x) / 2
    const m1y = (p2.y - p0.y) / 2
    const m2x = (p3.x - p1.x) / 2
    const m2y = (p3.y - p1.y) / 2

    // Puntos de control Bézier
    const cp1x = p1.x + m1x / 3
    const cp1y = p1.y + m1y / 3
    const cp2x = p2.x - m2x / 3
    const cp2y = p2.y - m2y / 3

    pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }

  // Calcular longitud total para animación con stroke-dasharray
  const longitudTotal = ancho * 2

  return (
    <svg
      width={ancho}
      height={alto}
      viewBox={`0 0 ${ancho} ${alto}`}
      className="w-full"
      preserveAspectRatio="none"
    >
      {/* Área bajo la curva (gradiente) */}
      <defs>
        <linearGradient id="gradienteCurva" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Área rellena */}
      <path
        d={`${pathD} L ${coords[coords.length - 1].x},${alto} L ${coords[0].x},${alto} Z`}
        fill="url(#gradienteCurva)"
        opacity={progreso}
      />

      {/* Línea de la curva */}
      <path
        d={pathD}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={longitudTotal}
        strokeDashoffset={longitudTotal * (1 - progreso)}
        style={{ filter: 'drop-shadow(0 0 4px var(--accent-glow))' }}
      />

      {/* Puntos */}
      {coords.map((c, i) => (
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={3}
          fill="var(--accent)"
          opacity={progreso > i / coords.length ? 1 : 0}
          style={{ transition: 'opacity 0.3s ease' }}
        />
      ))}
    </svg>
  )
}
