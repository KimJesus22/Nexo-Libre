'use client'

/**
 * Formulario de inicio de sesión — NexoLibre
 *
 * Client Component con dos modos:
 * 1. Magic Link — ingresa email, recibe enlace mágico
 * 2. Email + Contraseña — login tradicional
 *
 * Sin campos de teléfono/SMS para evitar SIM Swapping.
 */

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  iniciarSesionConMagicLink,
  iniciarSesionConCorreo,
} from '@/app/(auth)/_acciones/actions'

type ModoAuth = 'magic-link' | 'contrasena'

export default function FormularioInicioSesion() {
  const [modo, setModo] = useState<ModoAuth>('magic-link')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const resultado =
        modo === 'magic-link'
          ? await iniciarSesionConMagicLink(formData)
          : await iniciarSesionConCorreo(formData)

      if (resultado?.error) {
        setError(resultado.error)
      } else if (modo === 'magic-link') {
        toast.success('Enlace mágico enviado, revisa tu correo')
      }
    })
  }

  return (
    <section className="w-full max-w-sm" aria-labelledby="titulo-inicio-sesion">
      <header className="mb-8 text-center">
        <h1
          id="titulo-inicio-sesion"
          className="text-2xl font-bold tracking-tight text-foreground"
        >
          Iniciar sesión
        </h1>
        <p className="mt-2 text-sm text-muted">
          Accede a tu cuenta con correo electrónico
        </p>
      </header>

      {/* ── Selector de modo ──────────────────────────────────────────── */}
      <nav
        className="mb-6 flex rounded-lg border border-border p-1"
        role="tablist"
        aria-label="Método de inicio de sesión"
      >
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'magic-link'}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black ${
            modo === 'magic-link'
              ? 'bg-accent text-accent-foreground'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => {
            setModo('magic-link')
            setError(null)
          }}
        >
          Magic Link
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'contrasena'}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black ${
            modo === 'contrasena'
              ? 'bg-accent text-accent-foreground'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => {
            setModo('contrasena')
            setError(null)
          }}
        >
          Contraseña
        </button>
      </nav>

      {/* ── Formulario ────────────────────────────────────────────────── */}
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

          {modo === 'contrasena' && (
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
                autoComplete="current-password"
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-gray-200 placeholder:text-gray-300 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
              />
            </div>
          )}

          {/* ── Error ──────────────────────────────────────────────────── */}
          {error && (
            <output
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              {error}
            </output>
          )}

          {/* ── Botón de envío ─────────────────────────────────────────── */}
          <button
            type="submit"
            className="min-h-[44px] w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending
              ? 'Procesando…'
              : modo === 'magic-link'
                ? 'Enviar enlace mágico'
                : 'Iniciar sesión'}
          </button>
        </fieldset>
      </form>

      {/* ── Enlace a registro ─────────────────────────────────────────── */}
      <footer className="mt-6 text-center text-sm text-gray-400">
        <p>
          ¿No tienes cuenta?{' '}
          <Link
            href="/registrarse"
            className="font-medium text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded-sm"
          >
            Regístrate aquí
          </Link>
        </p>
      </footer>
    </section>
  )
}
