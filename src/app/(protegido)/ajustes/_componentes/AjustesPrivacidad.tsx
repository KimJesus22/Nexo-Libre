'use client'

/**
 * AjustesPrivacidad — NexoLibre
 *
 * Vista de configuración de privacidad con toggles:
 * - Modo Efímero: borra datos locales al cerrar sesión
 * - Borrar al cerrar: limpia mensajes de pantalla al salir
 * - Deshabilitar previsualización: oculta contenido en notificaciones
 */

import { useState, useEffect, useCallback } from 'react'
import {
  obtenerPreferencias,
  guardarPreferencias,
  purgarDatosLocales,
  type PreferenciasPrivacidad,
} from '@/lib/privacidad'
import PanelInvitaciones from '../../_componentes/PanelInvitaciones'

/* ── Toggle reutilizable ──────────────────────────────────────────────────── */

interface PropsToggle {
  activo: boolean
  alCambiar: (valor: boolean) => void
  id: string
  labelId: string
  deshabilitado?: boolean
}

function Toggle({ activo, alCambiar, id, labelId, deshabilitado }: PropsToggle) {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        id={id}
        className="peer sr-only"
        checked={activo}
        disabled={deshabilitado}
        onChange={(e) => alCambiar(e.target.checked)}
        aria-checked={activo}
        aria-labelledby={labelId}
      />
      <div className={`w-14 h-7 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent peer-focus:ring-offset-2 peer-focus:ring-offset-black rounded-full peer peer-checked:after:translate-x-[28px] peer-checked:after:border-white after:content-['✕'] peer-checked:after:content-['✓'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-accent after:flex after:items-center after:justify-center after:text-xs peer-checked:after:text-accent after:text-gray-500 ${deshabilitado ? 'opacity-40 cursor-not-allowed' : ''}`}></div>
    </label>
  )
}

/* ── Componente principal ─────────────────────────────────────────────────── */

export default function AjustesPrivacidad() {
  const [prefs, setPrefs] = useState<PreferenciasPrivacidad>({
    modoEfimero: false,
    borrarAlCerrar: false,
    deshabilitarPrevisualizacion: false,
  })
  const [guardado, setGuardado] = useState(false)
  const [purgaEjecutada, setPurgaEjecutada] = useState(false)
  const [modalPurgaAbierto, setModalPurgaAbierto] = useState(false)

  // Cargar preferencias al montar
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with localStorage
    setPrefs(obtenerPreferencias())
  }, [])

  // Guardar cambios con feedback visual
  const actualizarPref = useCallback(
    (campo: keyof PreferenciasPrivacidad, valor: boolean) => {
      const nuevas = { ...prefs, [campo]: valor }

      // Si activa modo efímero, también activa borrar al cerrar
      if (campo === 'modoEfimero' && valor) {
        nuevas.borrarAlCerrar = true
      }

      setPrefs(nuevas)
      guardarPreferencias(nuevas)

      // Feedback visual
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    },
    [prefs]
  )

  // Purga manual inmediata
  const ejecutarPurgaManual = useCallback(() => {
    purgarDatosLocales()
    setPurgaEjecutada(true)
    setModalPurgaAbierto(false)
    setTimeout(() => setPurgaEjecutada(false), 3000)
  }, [])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-foreground">Ajustes de privacidad</h1>
        <p className="text-sm text-gray-400">
          Controla cómo NexoLibre gestiona tus datos locales. Estos ajustes solo
          afectan este dispositivo.
        </p>
      </div>

      {/* ── Modo Efímero ───────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <label id="label-efimero" htmlFor="toggle-efimero" className="text-base font-semibold text-gray-300 cursor-pointer">
                Modo Efímero
              </label>
              {prefs.modoEfimero && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  Activo
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              Al cerrar sesión, se borran automáticamente todos los datos locales:
              mensajes en pantalla, claves de cifrado E2EE y caches del navegador.{' '}
              <span className="font-medium text-foreground-secondary">Cero rastros.</span>
            </p>
          </div>
          <Toggle
            id="toggle-efimero"
            labelId="label-efimero"
            activo={prefs.modoEfimero}
            alCambiar={(v) => actualizarPref('modoEfimero', v)}
          />
        </div>
      </section>

      {/* ── Borrar datos al cerrar ─────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <label id="label-borrar" htmlFor="toggle-borrar" className="text-base font-semibold text-gray-300 cursor-pointer">
                Borrar mensajes de pantalla al salir
              </label>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              Limpia los mensajes visibles cuando abandonas la aplicación o cierras
              la pestaña. No afecta los mensajes almacenados en el servidor.
            </p>
          </div>
          <Toggle
            id="toggle-borrar"
            labelId="label-borrar"
            activo={prefs.borrarAlCerrar}
            alCambiar={(v) => actualizarPref('borrarAlCerrar', v)}
            deshabilitado={prefs.modoEfimero}
          />
        </div>
        {prefs.modoEfimero && (
          <p className="mt-3 rounded-lg bg-accent/5 px-3 py-2 text-[11px] text-accent">
            Activado automáticamente por el Modo Efímero.
          </p>
        )}
      </section>

      {/* ── Previsualización de mensajes ────────────────────────────── */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground-secondary/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-foreground-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </div>
              <label id="label-preview" htmlFor="toggle-preview" className="text-base font-semibold text-gray-300 cursor-pointer">
                Ocultar previsualización de mensajes
              </label>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              No muestra el contenido del mensaje en la lista de chats ni en
              notificaciones. Solo verás &quot;Mensaje nuevo&quot;.
            </p>
          </div>
          <Toggle
            id="toggle-preview"
            labelId="label-preview"
            activo={prefs.deshabilitarPrevisualizacion}
            alCambiar={(v) => actualizarPref('deshabilitarPrevisualizacion', v)}
          />
        </div>
      </section>

      {/* ── Panel de Invitaciones Seguras ──────────────────────────── */}
      <PanelInvitaciones />

      {/* ── Purga manual ───────────────────────────────────────────── */}
      <section className="rounded-xl border border-destructive/30 bg-surface p-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-300">Purgar datos ahora</h3>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed max-w-md">
            Borra inmediatamente todas las claves E2EE, caches y datos de sesión
            almacenados en este dispositivo. Esta acción no se puede deshacer.
          </p>
          <button
            type="button"
            onClick={() => setModalPurgaAbierto(true)}
            disabled={purgaEjecutada}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-md transition-colors mt-4 w-full sm:w-auto inline-block text-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            {purgaEjecutada ? '✓ Datos purgados' : 'Ejecutar purga'}
          </button>
        </div>
      </section>

      {/* ── Modal de Confirmación: Purga de Datos ─────────────────────── */}
      {modalPurgaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            role="dialog" 
            aria-modal="true"
            aria-labelledby="modal-purga-titulo"
            className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 id="modal-purga-titulo" className="text-xl font-bold text-foreground">¿Estás absolutamente seguro?</h2>
            </div>
            
            <p className="text-sm text-gray-300 mb-6">
              Esta acción eliminará de forma <strong>permanente</strong> todas tus claves E2EE locales, caché de la aplicación y borrará tus mensajes en pantalla.
              No podrás recuperar los mensajes descifrados a menos que inicies sesión nuevamente.
            </p>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setModalPurgaAbierto(false)}
                className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarPurgaManual}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition-opacity hover:bg-red-700 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
              >
                Purgar Datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Apoya el Proyecto ──────────────────────────────────────── */}
      <section className="rounded-xl border border-border/50 bg-surface/50 p-5 mt-8">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Apoya el Proyecto</h3>
              <p className="mt-1 text-sm text-gray-400">
                NexoLibre es de código abierto, gratuito y sin anuncios. Se mantiene vivo gracias a aportaciones voluntarias que nos ayudan a cubrir los costos de infraestructura (servidores, base de datos) para asegurar que tu comunicación siga siendo privada.
              </p>
            </div>
            <a
              href="https://buymeacoffee.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-surface-elevated px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-border/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              Donar para los servidores
            </a>
          </div>
        </div>
      </section>

      {/* ── Feedback de guardado ────────────────────────────────────── */}
      <div
        className={`fixed bottom-6 right-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-lg transition-all duration-300 ${
          guardado
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        ✓ Preferencia guardada
      </div>
    </div>
  )
}
