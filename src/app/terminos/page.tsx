import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos de Servicio | NexoLibre',
  description:
    'Términos y Condiciones de uso de la plataforma NexoLibre. Documento legal vigente en los Estados Unidos Mexicanos.',
}

/**
 * /terminos — Términos de Servicio
 *
 * Documento legal que regula la relación entre NexoLibre y sus usuarios.
 * Ruta pública accesible sin autenticación.
 */
export default function PaginaTerminos() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-gray-300">
      {/* Navegación de retorno */}
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Volver al inicio
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2">Términos y Condiciones de Servicio</h1>
      <p className="text-sm text-gray-400 mb-10">
        Última actualización: 18 de abril de 2026
      </p>

      <article className="prose-sm space-y-8 leading-relaxed">

        {/* ── 1 ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Objeto y aceptación</h2>
          <p>
            Los presentes Términos y Condiciones de Servicio (en adelante, los &ldquo;Términos&rdquo;) regulan el acceso y uso de la plataforma <strong className="text-foreground">NexoLibre</strong> (en adelante, &ldquo;la Plataforma&rdquo;), una aplicación web de mensajería orientada a la privacidad.
          </p>
          <p className="mt-3">
            Al crear una cuenta o utilizar la Plataforma, usted (&ldquo;el Usuario&rdquo;) acepta de forma íntegra y sin reservas los presentes Términos, así como el <Link href="/privacidad" className="text-accent hover:underline">Aviso de Privacidad</Link>. Si no está de acuerdo con alguna de sus disposiciones, le rogamos abstenerse de utilizar el servicio.
          </p>
        </section>

        {/* ── 2 ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">2. Descripción del servicio</h2>
          <p>
            NexoLibre ofrece un servicio gratuito de mensajería instantánea que prioriza la privacidad del usuario. Sus características principales incluyen:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong className="text-foreground">Registro sin número telefónico:</strong> la creación de cuenta requiere exclusivamente un correo electrónico y una contraseña. NexoLibre no solicita números de teléfono celular ni línea fija, eliminando de raíz el vector de ataque conocido como SIM Swapping.</li>
            <li><strong className="text-foreground">Sin identificación oficial:</strong> en ningún momento se le solicitará INE, pasaporte, CURP, comprobante de domicilio ni ningún otro documento que exponga su identidad real.</li>
            <li><strong className="text-foreground">Mensajes cifrados:</strong> las comunicaciones entre usuarios se transmiten mediante protocolos de cifrado (TLS 1.3) y se almacenan con protecciones de seguridad en reposo.</li>
            <li><strong className="text-foreground">Purga de datos:</strong> el Usuario dispone de una herramienta automatizada dentro de la sección &ldquo;Ajustes de Privacidad&rdquo; que le permite eliminar de forma irreversible su historial local, datos de sesión y tokens de invitación en cualquier momento, sin necesidad de justificación alguna.</li>
            <li><strong className="text-foreground">Autenticación de dos factores (2FA):</strong> activación voluntaria de un segundo factor de autenticación basado en contraseñas de un solo uso (TOTP) para reforzar la seguridad de la cuenta.</li>
            <li><strong className="text-foreground">Código abierto:</strong> el código fuente de NexoLibre se encuentra disponible públicamente, permitiendo a cualquier persona verificar, auditar y contribuir al proyecto.</li>
          </ul>
        </section>

        {/* ── 3 ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">3. Requisitos de uso</h2>
          <p>Para utilizar la Plataforma, el Usuario deberá:</p>
          <ol className="list-decimal pl-6 mt-3 space-y-2">
            <li>Ser mayor de edad conforme a la legislación aplicable en su jurisdicción (18 años en los Estados Unidos Mexicanos).</li>
            <li>Proporcionar un correo electrónico válido y verificable.</li>
            <li>Aceptar los presentes Términos y el Aviso de Privacidad.</li>
          </ol>
        </section>

        {/* ── 4 ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Registro y cuenta de usuario</h2>
          <p>
            El registro se realiza proporcionando una dirección de correo electrónico y una contraseña. Opcionalmente, el Usuario podrá elegir un seudónimo para interactuar en la Plataforma sin revelar su identidad real.
          </p>
          <p className="mt-3">
            El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que se realicen bajo su cuenta. En caso de detectar un uso no autorizado, deberá notificarlo de inmediato a NexoLibre.
          </p>
        </section>

        {/* ── 5 ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">5. Uso aceptable</h2>
          <p className="mb-3">El Usuario se compromete a utilizar la Plataforma de conformidad con la legislación vigente y los presentes Términos. Queda expresamente prohibido:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Utilizar la Plataforma para la comisión de delitos o actividades ilícitas.</li>
            <li>Difundir contenido que constituya apología del delito, incitación a la violencia, discurso de odio, explotación de menores o cualquier material que vulnere derechos de terceros.</li>
            <li>Realizar ingeniería inversa, descompilar o intentar vulnerar la seguridad de la Plataforma con fines maliciosos.</li>
            <li>Crear cuentas masivas o automatizadas (bots) sin autorización previa.</li>
            <li>Suplantar la identidad de otra persona o entidad.</li>
            <li>Transmitir malware, virus o cualquier código dañino a través de los mensajes.</li>
          </ul>
          <p className="mt-3">
            NexoLibre se reserva el derecho de suspender o cancelar cuentas que incumplan estas disposiciones, previa notificación al Usuario cuando sea razonablemente posible.
          </p>
        </section>

        {/* ── 6 ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">6. Propiedad intelectual</h2>
          <p>
            NexoLibre es un proyecto de <strong className="text-foreground">código abierto</strong>. El código fuente se distribuye bajo la licencia indicada en el repositorio oficial del proyecto. Los nombres, logotipos y elementos distintivos de &ldquo;NexoLibre&rdquo; son propiedad de sus titulares y no podrán ser utilizados sin autorización escrita.
          </p>
          <p className="mt-3">
            El contenido generado por los usuarios (mensajes) es propiedad de cada Usuario. NexoLibre no reclama titularidad sobre dicho contenido ni lo utiliza para fines distintos a la prestación del servicio.
          </p>
        </section>

        {/* ── 7 ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">7. Privacidad y protección de datos</h2>
          <p>
            El tratamiento de datos personales se rige por el <Link href="/privacidad" className="text-accent hover:underline">Aviso de Privacidad</Link> de NexoLibre, elaborado conforme a la LFPDPPP. Al aceptar estos Términos, el Usuario reconoce haber leído y comprendido dicho Aviso.
          </p>
          <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
            <h3 className="text-base font-semibold text-accent mb-2">Compromiso de privacidad</h3>
            <ul className="text-sm space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-accent">✓</span>
                <span>No vendemos, cedemos ni compartimos datos con terceros.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-accent">✓</span>
                <span>No solicitamos teléfono, identificación oficial ni datos biométricos.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-accent">✓</span>
                <span>Los mensajes viajan cifrados de extremo a extremo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-accent">✓</span>
                <span>El usuario puede purgar sus datos en cualquier momento desde su panel.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── 8 ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">8. Disponibilidad del servicio</h2>
          <p>
            NexoLibre se esfuerza por mantener la Plataforma disponible de forma continua; sin embargo, no garantiza un funcionamiento ininterrumpido. El servicio podrá suspenderse temporalmente por mantenimiento, actualizaciones de seguridad o causas de fuerza mayor, sin que ello genere responsabilidad alguna para la Plataforma.
          </p>
        </section>

        {/* ── 9 ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">9. Limitación de responsabilidad</h2>
          <p>
            La Plataforma se proporciona &ldquo;tal cual&rdquo; (<em>as is</em>) y &ldquo;según disponibilidad&rdquo; (<em>as available</em>). NexoLibre no será responsable por:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Daños directos, indirectos, incidentales o consecuenciales derivados del uso o la imposibilidad de uso de la Plataforma.</li>
            <li>Pérdida de datos ocasionada por el uso voluntario de la herramienta de purga.</li>
            <li>Contenido generado por los usuarios dentro de la Plataforma.</li>
            <li>Interrupciones del servicio causadas por ataques externos, fallas de proveedores de infraestructura o circunstancias ajenas al control de NexoLibre.</li>
          </ul>
        </section>

        {/* ── 10 ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">10. Cancelación de cuenta</h2>
          <p>
            El Usuario podrá cancelar su cuenta en cualquier momento. Para ello, podrá utilizar la herramienta de purga integrada en &ldquo;Ajustes de Privacidad&rdquo; y, posteriormente, enviar una solicitud de baja al correo <span className="text-accent font-semibold">soporte@nexolibre.com</span>.
          </p>
          <p className="mt-3">
            NexoLibre podrá cancelar cuentas de forma unilateral cuando exista un incumplimiento grave de los presentes Términos, notificando al Usuario por correo electrónico cuando sea posible.
          </p>
        </section>

        {/* ── 11 ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">11. Modificaciones</h2>
          <p>
            NexoLibre se reserva el derecho de modificar los presentes Términos en cualquier momento. Las modificaciones entrarán en vigor a partir de su publicación en la Plataforma. El uso continuado del servicio tras la publicación de los cambios constituirá la aceptación de los mismos. Cuando las modificaciones sean sustanciales, se notificará al Usuario por correo electrónico.
          </p>
        </section>

        {/* ── 12 ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">12. Legislación aplicable y jurisdicción</h2>
          <p>
            Los presentes Términos se rigen por la legislación vigente en los Estados Unidos Mexicanos. Para la interpretación y resolución de cualquier controversia derivada de los mismos, las partes se someten a la jurisdicción de los tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles por razón de domicilio presente o futuro.
          </p>
        </section>

        {/* ── 13 ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">13. Contacto</h2>
          <p>
            Para cualquier duda, aclaración o solicitud relacionada con los presentes Términos, el Usuario podrá contactar a NexoLibre a través de:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-1">
            <li>Correo electrónico: <span className="text-accent font-semibold">soporte@nexolibre.com</span></li>
            <li>Repositorio oficial del proyecto (sección de Issues)</li>
          </ul>
        </section>

        {/* ── Aceptación ───────────────────────────────────── */}
        <section className="rounded-lg border border-border bg-surface p-5 mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-2">Aceptación</h2>
          <p>
            Al crear una cuenta en NexoLibre, el Usuario declara que ha leído, comprendido y aceptado íntegramente los presentes Términos y Condiciones de Servicio, así como el Aviso de Privacidad de la Plataforma.
          </p>
        </section>

      </article>

      <footer className="mt-14 border-t border-border pt-6 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} NexoLibre — Todos los derechos reservados.</p>
        <div className="mt-3 flex justify-center gap-6">
          <Link href="/privacidad" className="hover:text-accent transition-colors">Aviso de Privacidad</Link>
          <Link href="/" className="hover:text-accent transition-colors">Inicio</Link>
        </div>
      </footer>
    </main>
  )
}
