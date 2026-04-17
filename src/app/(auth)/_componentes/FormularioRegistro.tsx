'use client'

/**
 * Formulario de registro — NexoLibre
 *
 * Client Component para crear cuenta con email + contraseña.
 * Sin campos de teléfono/SMS para evitar SIM Swapping.
 */

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { registrarConCorreo } from '@/app/(auth)/_acciones/actions'

export default function FormularioRegistro() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)

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
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
  )
}
