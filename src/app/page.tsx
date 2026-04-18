/**
 * Landing Page — NexoLibre
 *
 * Modo oscuro, paleta de alto contraste, diseño institucional.
 * Hero + Propuesta de valor + Características + CTA final.
 */
import Link from 'next/link'
import AnimacionIntercepcion from './_componentes/AnimacionIntercepcion'
import LinkConTracking from './_componentes/LinkConTracking'

/* ── Datos de las características ─────────────────────────────────────────── */
const CARACTERISTICAS = [
  {
    icono: (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    titulo: 'Sin número de teléfono',
    descripcion:
      'Jamás solicitamos tu línea móvil. Eliminamos la puerta de entrada al SIM Swapping desde el diseño.',
  },
  {
    icono: (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    titulo: 'Sin documentos oficiales',
    descripcion:
      'Tu identidad te pertenece. No requerimos INE, pasaporte ni selfies de verificación para operar.',
  },
  {
    icono: (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    titulo: 'Cifrado extremo a extremo',
    descripcion:
      'Cada sesión se autentica con JWT de vida corta y tokens refrescados automáticamente vía proxy.',
  },
  {
    icono: (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    titulo: 'Magic Links seguros',
    descripcion:
      'Accede con un enlace mágico enviado a tu correo. Sin contraseñas que recordar ni SMS que interceptar.',
  },
  {
    icono: (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75m16.5 3.75v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" />
      </svg>
    ),
    titulo: 'RLS inflexible',
    descripcion:
      'Cada fila de la base de datos tiene políticas de acceso a nivel de registro. Tu información nunca se filtra entre cuentas.',
  },
  {
    icono: (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    titulo: 'Código abierto',
    descripcion:
      'Auditable, transparente, sin cajas negras. Cada línea de código es verificable y libre.',
  },
] as const

/* ── Componente principal ─────────────────────────────────────────────────── */
export default function PaginaInicio() {
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          NAVEGACIÓN
          ══════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 z-50 w-full glass">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2" aria-label="NexoLibre — Inicio">
            <span className="text-xl font-bold tracking-tight text-foreground">
              Nexo<span className="text-accent">Libre</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/iniciar-sesion"
              className="rounded-lg px-4 py-2 text-lg font-semibold text-gray-400 transition-colors hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registrarse"
              className="bg-accent text-black px-4 py-2 rounded-full text-lg font-semibold transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_var(--accent-glow)] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
            >
              Crear cuenta
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        {/* ════════════════════════════════════════════════════════════════
            HERO
            ════════════════════════════════════════════════════════════════ */}
        <section
          className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
          aria-labelledby="hero-titulo"
        >
          {/* Fondo: gradiente radial sutil */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[120px]" />
            <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
          </div>

          {/* Grid decorativo */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            aria-hidden="true"
            style={{
              backgroundImage:
                'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-1.5 text-xs font-medium text-foreground-secondary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Seguridad por diseño, no por promesa
            </div>

            {/* Título principal */}
            <h1
              id="hero-titulo"
              className="animate-fade-in-up-delay-1 text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-200 sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Tu identidad digital{' '}
              <span className="bg-gradient-to-r from-accent via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient">
                sin compromisos
              </span>
            </h1>

            {/* CTAs */}
            <div className="animate-fade-in-up-delay-2 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row w-full">
              <LinkConTracking
                href="/registrarse"
                evento="clic_comenzar"
                className="group w-full sm:w-auto bg-accent hover:bg-accent-light text-black font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
              >
                Comenzar ahora
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </LinkConTracking>

              <Link
                href="#caracteristicas"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-bold text-gray-400 transition-all hover:border-accent/50 hover:text-gray-200 hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
              >
                Conocer más
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
              </Link>
            </div>

            {/* Subtítulo */}
            <p className="animate-fade-in-up-delay-3 mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
              NexoLibre es la plataforma que{' '}
              <strong className="text-gray-200">
                no exige tu número de teléfono
              </strong>
              ,{' '}
              <strong className="text-gray-200">
                no solicita identificaciones oficiales
              </strong>{' '}
              y{' '}
              <strong className="text-gray-200">
                no monetiza tus datos personales
              </strong>
              . Porque acceder a la tecnología no debería costarte tu privacidad.
            </p>

            {/* Animación de intercepción */}
            <AnimacionIntercepcion />

            {/* Indicadores de confianza */}
            <div className="animate-fade-in-up-delay-3 mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-medium text-muted">
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                0 datos biométricos
              </span>
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                0 números telefónicos
              </span>
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                100% código abierto
              </span>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PROPUESTA DE VALOR
            ════════════════════════════════════════════════════════════════ */}
        <section className="relative border-t border-border-subtle bg-surface py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="max-w-4xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-accent text-center">
                El problema
              </h2>
              <p className="mt-4 text-2xl font-bold leading-snug text-foreground sm:text-3xl">
                Las plataformas tradicionales exigen tu número de teléfono
                como requisito de acceso.{' '}
                <span className="text-gray-400">
                  Eso te expone al SIM Swapping, al rastreo comercial
                  y a la pérdida de control sobre tu identidad digital.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            CARACTERÍSTICAS
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="caracteristicas"
          className="relative border-t border-border-subtle py-24"
          aria-labelledby="titulo-caracteristicas"
        >
          {/* Glow decorativo */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/3 blur-[120px]" aria-hidden="true" />

          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <header className="mb-16 text-center w-full">
              <h2
                id="titulo-caracteristicas"
                className="text-sm font-semibold uppercase tracking-widest text-accent text-center"
              >
                Arquitectura de seguridad
              </h2>
              <p className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-center">
                Seis pilares que protegen tu cuenta
              </p>
            </header>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6" role="list">
              {CARACTERISTICAS.map((item) => (
                <li
                  key={item.titulo}
                  tabIndex={0}
                  className="group rounded-2xl border border-border bg-surface p-6 transition-all hover:border-accent/30 hover:bg-surface-elevated hover:shadow-[0_0_40px_var(--accent-glow)] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-accent/10 p-3 text-accent transition-colors group-hover:bg-accent/20">
                    {item.icono}
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-gray-200">
                    {item.titulo}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-400 max-w-xl">
                    {item.descripcion}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            CTA FINAL
            ════════════════════════════════════════════════════════════════ */}
        <section className="relative border-t border-border-subtle py-24">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/3 to-transparent" aria-hidden="true" />

          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-center">
                Tu privacidad no es negociable
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                Crea tu cuenta en segundos. Solo necesitas un correo electrónico.
                Sin teléfono, sin documentos, sin letra pequeña.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/registrarse"
                  className="group inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-accent-foreground transition-all hover:bg-accent-hover hover:shadow-[0_0_30px_var(--accent-glow)] active:scale-[0.98]"
                >
                  Crear cuenta gratuita
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/iniciar-sesion"
                  className="text-sm font-medium text-gray-400 transition-colors hover:text-foreground"
                >
                  ¿Ya tienes cuenta? Inicia sesión →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border-subtle px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} NexoLibre. Código abierto bajo licencia pendiente.
          </p>
          <p className="text-xs text-muted">
            Construido con Next.js&nbsp;16, Supabase y Tailwind&nbsp;CSS
          </p>
        </div>
      </footer>
    </>
  )
}
