'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function TerminalStats() {
  const supabase = useRef(createClient()).current
  const canalRef = useRef<RealtimeChannel | null>(null)
  
  const [usuariosOnline, setUsuariosOnline] = useState<number>(0)
  const [logs, setLogs] = useState<string[]>([
    '> INICIANDO CONEXIÓN A NEXOLIBRE MAIN_SERVER...',
    '> ESTABLECIENDO ENLACE CIFRADO DE PRESENCIA...',
  ])

  // Función auxiliar para agregar logs estilo terminal
  const addLog = (msg: string) => {
    setLogs((prev) => {
      const newLogs = [...prev, `> [${new Date().toISOString().split('T')[1].split('.')[0]}] ${msg}`]
      return newLogs.slice(-10) // Mantener solo los últimos 10
    })
  }

  useEffect(() => {
    const canal = supabase.channel('presencia-global')

    canal
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState()
        const count = Object.keys(estado).length
        
        setUsuariosOnline((prev) => {
          if (count > prev) addLog(`NUEVO NODO DETECTADO. TOTAL: ${count}`)
          else if (count < prev) addLog(`NODO DESCONECTADO. TOTAL: ${count}`)
          return count
        })
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        addLog(`JOIN: ${key.slice(0, 8)}...`)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        addLog(`LEAVE: ${key.slice(0, 8)}...`)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          addLog('CONEXIÓN ESTABLECIDA. SINCRONIZANDO PRESENCIA MUNDIAL...')
        }
      })

    canalRef.current = canal

    return () => {
      supabase.removeChannel(canal)
      canalRef.current = null
    }
  }, [supabase])

  return (
    <div className="flex h-full w-full flex-col bg-black font-mono text-emerald-500 overflow-hidden relative selection:bg-emerald-500/30">
      {/* Overlay tipo scanline CRT */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />
      
      {/* Header */}
      <header className="border-b border-emerald-500/30 p-4 shrink-0 flex items-center justify-between z-20 bg-black/80 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-emerald-400">
            NEXOLIBRE<span className="animate-pulse">_</span>SYSADMIN
          </h1>
          <p className="text-xs text-emerald-600">CENTRO DE OPERACIONES DE RED</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-emerald-400">UPLINK ACTIVE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 z-20">
        
        {/* Panel izquierdo: Contador gigante */}
        <section className="flex-1 flex flex-col items-center justify-center border border-emerald-500/20 bg-emerald-950/20 rounded-lg p-8 relative overflow-hidden">
          {/* Decoraciones de esquina */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />

          <p className="text-emerald-600 mb-4 tracking-widest text-sm font-semibold uppercase">
            Nodos Activos en la Red
          </p>
          
          <div className="relative">
            <div className="text-[12rem] lg:text-[16rem] leading-none font-bold text-emerald-400 drop-shadow-[0_0_35px_rgba(16,185,129,0.5)]">
              {usuariosOnline.toString().padStart(3, '0')}
            </div>
            
            {/* Animación de escaneo */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent h-full w-full animate-[scan_3s_ease-in-out_infinite]" />
          </div>
          
          <div className="mt-8 flex gap-4 text-xs text-emerald-600/80">
            <span>SECURE: TRUE</span>
            <span>|</span>
            <span>E2EE: FORCED</span>
            <span>|</span>
            <span>LATENCY: &lt;50MS</span>
          </div>
        </section>

        {/* Panel derecho: Logs de consola */}
        <section className="w-full lg:w-1/3 flex flex-col border border-emerald-500/20 bg-black/60 rounded-lg p-4">
          <div className="border-b border-emerald-500/20 pb-2 mb-4">
            <h2 className="text-emerald-500/80 text-xs font-bold uppercase tracking-widest">
              Live Event Stream
            </h2>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col justify-end gap-1 text-sm text-emerald-400/80">
            {logs.map((log, i) => (
              <div 
                key={i} 
                className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  i === logs.length - 1 ? 'text-emerald-300 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : ''
                }`}
              >
                {log}
              </div>
            ))}
            <div className="mt-2 text-emerald-300 animate-pulse">_</div>
          </div>
        </section>
        
      </main>
      
      {/* Custom styles for animations that are hard with pure tailwind utilities */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}} />
    </div>
  )
}
