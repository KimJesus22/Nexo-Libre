'use client'

/**
 * Formulario de registro — NexoLibre
 *
 * Client Component para crear cuenta con email + contraseña.
 * Sin campos de teléfono/SMS para evitar SIM Swapping.
 *
 * Integra ModalLegal: el usuario debe aceptar Términos y Condiciones
 * y Aviso de Privacidad (scroll obligatorio hasta el final) antes de
 * poder enviar el formulario de registro.
 */

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { registrarConCorreo } from '@/app/(auth)/_acciones/actions'
import { ModalLegal } from '@/components/ui'

export default function FormularioRegistro() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Estado de aceptación legal
  const [terminosAceptados, setTerminosAceptados] = useState(false)
  const [privacidadAceptada, setPrivacidadAceptada] = useState(false)
  const [modalActivo, setModalActivo] = useState<'terminos' | 'privacidad' | null>(null)
  const [timestampTerminos, setTimestampTerminos] = useState<string | null>(null)
  const [timestampPrivacidad, setTimestampPrivacidad] = useState<string | null>(null)

  const ambosAceptados = terminosAceptados && privacidadAceptada

  function handleSubmit(formData: FormData) {
    setError(null)

    if (!ambosAceptados) {
      setError('Debes aceptar los Términos y Condiciones y el Aviso de Privacidad.')
      return
    }

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm-password') as string

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    startTransition(async () => {
      const resultado = await registrarConCorreo(formData)
      if (resultado?.error) {
        setError(resultado.error)
      }
    })
  }

  return (
    <>
      <section className="w-full max-w-sm" aria-labelledby="titulo-registro">
        <header className="mb-8 text-center">
          <h1
            id="titulo-registro"
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-muted">
            Regístrate con tu correo electrónico
          </p>
        </header>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={isPending} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@correo.com"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Repite tu contraseña"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            {/* ── Aceptación legal ──────────────────────────────────────── */}
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="mb-3 text-xs font-medium text-muted">
                Para continuar, debes leer y aceptar:
              </p>
              <div className="flex flex-col gap-2">
                {/* Términos y Condiciones */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${
                        terminosAceptados
                          ? 'bg-success/15'
                          : 'border border-border'
                      }`}
                    >
                      {terminosAceptados && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm text-foreground">
                      Términos y Condiciones
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalActivo('terminos')}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    {terminosAceptados ? 'Revisar' : 'Leer y aceptar'}
                  </button>
                </div>

                {/* Aviso de Privacidad */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${
                        privacidadAceptada
                          ? 'bg-success/15'
                          : 'border border-border'
                      }`}
                    >
                      {privacidadAceptada && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm text-foreground">
                      Aviso de Privacidad
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalActivo('privacidad')}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    {privacidadAceptada ? 'Revisar' : 'Leer y aceptar'}
                  </button>
                </div>
              </div>

              {/* Timestamps de aceptación (visible tras aceptar) */}
              {(timestampTerminos || timestampPrivacidad) && (
                <div className="mt-3 border-t border-border-subtle pt-2">
                  {timestampTerminos && (
                    <p className="text-[10px] text-muted">
                      T&C aceptados: {new Date(timestampTerminos).toLocaleString('es-MX')}
                    </p>
                  )}
                  {timestampPrivacidad && (
                    <p className="text-[10px] text-muted">
                      Privacidad aceptada: {new Date(timestampPrivacidad).toLocaleString('es-MX')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <output
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {error}
              </output>
            )}

            <button
              type="submit"
              disabled={!ambosAceptados}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </fieldset>
        </form>

        <footer className="mt-6 text-center text-sm text-muted">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/iniciar-sesion"
              className="font-medium text-accent hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </footer>
      </section>

      {/* ── Modales legales ─────────────────────────────────────────────── */}
      <ModalLegal
        tipo="terminos"
        abierto={modalActivo === 'terminos'}
        alCerrar={() => setModalActivo(null)}
        alAceptar={(ts) => {
          setTerminosAceptados(true)
          setTimestampTerminos(ts)
          setModalActivo(null)
        }}
      />
      <ModalLegal
        tipo="privacidad"
        abierto={modalActivo === 'privacidad'}
        alCerrar={() => setModalActivo(null)}
        alAceptar={(ts) => {
          setPrivacidadAceptada(true)
          setTimestampPrivacidad(ts)
          setModalActivo(null)
        }}
      />
    </>
  )
}
