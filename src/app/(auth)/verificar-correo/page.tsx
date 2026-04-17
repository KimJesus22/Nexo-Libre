/**
 * Página de verificación de correo — /verificar-correo
 *
 * Se muestra después de enviar un Magic Link o registrar una cuenta.
 * Indica al usuario que revise su bandeja de entrada.
 */
import Link from 'next/link'

export const metadata = {
  title: 'Verifica tu correo',
  description: 'Revisa tu bandeja de entrada para continuar.',
}

export default function PaginaVerificarCorreo() {
  return (
    <section className="w-full max-w-sm text-center" aria-labelledby="titulo-verificar">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      <h1
        id="titulo-verificar"
        className="text-2xl font-bold tracking-tight text-foreground"
      >
        Revisa tu correo
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        Te hemos enviado un enlace de verificación a tu correo electrónico.
        Haz clic en el enlace para continuar.
      </p>

      <p className="mt-2 text-xs text-muted">
        Si no lo encuentras, revisa la carpeta de spam.
      </p>

      <footer className="mt-8">
        <Link
          href="/iniciar-sesion"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Volver a iniciar sesión
        </Link>
      </footer>
    </section>
  )
}
