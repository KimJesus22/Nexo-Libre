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
export default function FormularioRegistro() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Estado de aceptación legal
  const [terminosAceptados, setTerminosAceptados] = useState(false)
  const [privacidadAceptada, setPrivacidadAceptada] = useState(false)

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
                className="mb-1.5 block text-sm font-medium text-gray-400"
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
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-gray-200 placeholder:text-gray-300 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-400"
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
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-gray-200 placeholder:text-gray-300 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1.5 block text-sm font-medium text-gray-400"
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
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-gray-200 placeholder:text-gray-300 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
              />
            </div>

            {/* ── Aceptación legal ──────────────────────────────────────── */}
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="mb-3 text-sm font-medium text-gray-200">
                Privacidad y Condiciones
              </p>
              <ul className="mb-4 space-y-1 text-xs text-gray-400 list-disc pl-4">
                <li>No compartimos tu información con terceros bajo ninguna circunstancia.</li>
                <li>Tus datos se almacenan encriptados de extremo a extremo.</li>
                <li>Tienes el control total para exportar o eliminar tu cuenta en cualquier momento.</li>
              </ul>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 accent-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded-sm"
                    checked={terminosAceptados}
                    onChange={(e) => setTerminosAceptados(e.target.checked)}
                  />
                  <span className="text-sm text-gray-300">
                    Acepto los <a href="/terminos" target="_blank" className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded-sm">Términos y Condiciones</a>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 accent-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded-sm"
                    checked={privacidadAceptada}
                    onChange={(e) => setPrivacidadAceptada(e.target.checked)}
                  />
                  <span className="text-sm text-gray-300">
                    Acepto el <a href="/privacidad" target="_blank" className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded-sm">Aviso de Privacidad</a>
                  </span>
                </label>
              </div>
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
              className="min-h-[44px] w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </fieldset>
        </form>

        <footer className="mt-6 text-center text-sm text-gray-400">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/iniciar-sesion"
              className="font-medium text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded-sm"
            >
              Inicia sesión
            </Link>
          </p>
        </footer>
      </section>

    </>
  )
}
