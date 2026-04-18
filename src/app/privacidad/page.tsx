import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Aviso de Privacidad | NexoLibre',
  description:
    'Aviso de Privacidad Integral de NexoLibre conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
}

/**
 * /privacidad — Aviso de Privacidad Integral
 *
 * Documento legal redactado conforme a la LFPDPPP (México).
 * Ruta pública accesible sin autenticación.
 */
export default function PaginaPrivacidad() {
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

      <h1 className="text-3xl font-bold text-foreground mb-2">Aviso de Privacidad Integral</h1>
      <p className="text-sm text-gray-400 mb-10">
        Última actualización: 18 de abril de 2026
      </p>

      <article className="prose-sm space-y-8 leading-relaxed">

        {/* ── I ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">I. Identidad y domicilio del responsable</h2>
          <p>
            <strong className="text-foreground">NexoLibre</strong> (en adelante, &ldquo;la Plataforma&rdquo;), con domicilio para oír y recibir notificaciones en territorio mexicano, es responsable del tratamiento de los datos personales que usted proporcione, de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (&ldquo;LFPDPPP&rdquo;), su Reglamento y los Lineamientos del Aviso de Privacidad publicados por el INAI.
          </p>
        </section>

        {/* ── II ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">II. Datos personales que recabamos</h2>
          <p className="mb-3">
            Adoptamos un modelo de <strong className="text-foreground">mínima recopilación de datos</strong>. Únicamente recabamos:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-foreground">Correo electrónico:</strong> necesario para autenticar su identidad y permitir la recuperación de su cuenta.</li>
            <li><strong className="text-foreground">Seudónimo (opcional):</strong> alias elegido libremente por el usuario para interactuar sin revelar su identidad real.</li>
            <li><strong className="text-foreground">Contraseña (hash criptográfico):</strong> almacenada exclusivamente en formato cifrado irreversible. NexoLibre nunca tiene acceso a su contraseña en texto plano.</li>
          </ul>

          <div className="mt-5 rounded-lg border border-accent/30 bg-accent/5 p-4">
            <h3 className="text-base font-semibold text-accent mb-2">Lo que NO recabamos</h3>
            <ul className="list-none space-y-1.5 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-accent">✕</span>
                <span>Número telefónico — Eliminamos la puerta de entrada al SIM Swapping desde el diseño.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-accent">✕</span>
                <span>Identificación oficial (INE, pasaporte, CURP) — No exigimos documentos que expongan su identidad.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-accent">✕</span>
                <span>Datos biométricos (huellas digitales, reconocimiento facial).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-accent">✕</span>
                <span>Datos de geolocalización precisa.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── III ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">III. Finalidades del tratamiento</h2>
          <p className="mb-3">Los datos recabados serán utilizados para las siguientes finalidades <strong className="text-foreground">primarias</strong> (necesarias para el servicio):</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Crear y administrar su cuenta de usuario en la Plataforma.</li>
            <li>Autenticar su identidad al iniciar sesión, incluyendo verificación en dos pasos (TOTP/2FA) cuando el usuario la active voluntariamente.</li>
            <li>Permitir el envío y recepción de mensajes cifrados entre usuarios de la Plataforma.</li>
            <li>Enviar notificaciones exclusivamente relacionadas con la seguridad de su cuenta (alertas de inicio de sesión, enlaces de verificación).</li>
          </ol>
          <p className="mt-4">
            <strong className="text-foreground">NexoLibre no tiene finalidades secundarias.</strong> No utilizamos sus datos con fines publicitarios, de perfilamiento comercial, de mercadotecnia ni de cesión a terceros bajo ninguna circunstancia.
          </p>
        </section>

        {/* ── IV ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">IV. Cifrado de comunicaciones</h2>
          <p>
            Todos los mensajes que transitan por la Plataforma viajan protegidos mediante cifrado en tránsito (TLS 1.3) entre su dispositivo y nuestros servidores. Adicionalmente, NexoLibre implementa mecanismos de protección en reposo en la base de datos, de modo que incluso en un escenario de acceso no autorizado a la infraestructura, el contenido de los mensajes permanece ininteligible para terceros.
          </p>
        </section>

        {/* ── V ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">V. Mecanismos de purga de datos (Derecho de Cancelación)</h2>
          <p>
            De conformidad con el artículo 11 de la LFPDPPP, usted tiene derecho a solicitar la cancelación (eliminación) de sus datos personales cuando considere que no están siendo tratados conforme a la ley.
          </p>
          <p className="mt-3">
            NexoLibre le facilita una <strong className="text-foreground">herramienta automatizada de purga</strong> accesible desde la sección &ldquo;Ajustes de Privacidad&rdquo; de su panel de control. Mediante esta herramienta, usted puede eliminar de forma irreversible:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Su historial de mensajes almacenado localmente en el dispositivo.</li>
            <li>Datos de sesión y preferencias de la Plataforma.</li>
            <li>Tokens de invitación generados por su cuenta.</li>
          </ul>
          <p className="mt-3">
            Esta acción es voluntaria, gratuita y requiere una confirmación explícita mediante un modal de seguridad para prevenir ejecuciones accidentales.
          </p>
        </section>

        {/* ── VI ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">VI. Derechos ARCO</h2>
          <p className="mb-3">
            Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales (&ldquo;Derechos ARCO&rdquo;), así como a revocar su consentimiento, conforme a los artículos 28 a 35 de la LFPDPPP.
          </p>
          <p>
            Para ejercer cualquiera de estos derechos, podrá enviar una solicitud al correo electrónico:
          </p>
          <p className="mt-2 font-semibold text-accent">
            privacidad@nexolibre.com
          </p>
          <p className="mt-3">
            Su solicitud deberá contener: (i) nombre o seudónimo, (ii) correo electrónico registrado en la Plataforma, (iii) descripción clara del derecho que desea ejercer, y (iv) cualquier documento que facilite la localización de sus datos. NexoLibre responderá en un plazo máximo de 20 días hábiles.
          </p>
        </section>

        {/* ── VII ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">VII. Transferencia de datos</h2>
          <p>
            NexoLibre <strong className="text-foreground">no vende, cede, transfiere ni comparte</strong> sus datos personales con terceros, nacionales o internacionales, salvo en los casos expresamente previstos por la LFPDPPP (requerimiento de autoridad competente mediante mandato judicial debidamente fundado y motivado).
          </p>
        </section>

        {/* ── VIII ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">VIII. Uso de cookies y tecnologías de rastreo</h2>
          <p>
            La Plataforma utiliza exclusivamente cookies de sesión necesarias para mantener su autenticación activa. No empleamos cookies de terceros, píxeles de seguimiento, scripts de analítica invasiva ni ninguna otra tecnología que recopile información para fines publicitarios o de perfilamiento.
          </p>
        </section>

        {/* ── IX ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">IX. Medidas de seguridad</h2>
          <p>NexoLibre implementa medidas técnicas, administrativas y físicas para proteger sus datos personales, incluyendo:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Cifrado de contraseñas mediante algoritmos hash irreversibles (bcrypt/argon2).</li>
            <li>Políticas de Seguridad a Nivel de Fila (RLS) en la base de datos que garantizan el aislamiento de datos entre usuarios.</li>
            <li>Autenticación de dos factores (TOTP) disponible para todos los usuarios.</li>
            <li>Comunicaciones protegidas mediante TLS 1.3.</li>
            <li>Auditorías periódicas del código fuente (proyecto de código abierto).</li>
          </ul>
        </section>

        {/* ── X ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">X. Modificaciones al Aviso de Privacidad</h2>
          <p>
            NexoLibre se reserva el derecho de efectuar modificaciones al presente Aviso de Privacidad. Cualquier cambio será notificado a través de la propia Plataforma y/o mediante correo electrónico al usuario registrado. La fecha de última actualización se indicará siempre en la parte superior de este documento.
          </p>
        </section>

        {/* ── XI ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">XI. Autoridad competente</h2>
          <p>
            Si usted considera que su derecho a la protección de datos personales ha sido vulnerado, tiene el derecho de acudir al Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI) para hacer valer sus derechos. Más información en:{' '}
            <a href="https://www.inai.org.mx" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.inai.org.mx</a>.
          </p>
        </section>

        {/* ── Consentimiento ───────────────────────────────── */}
        <section className="rounded-lg border border-border bg-surface p-5 mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-2">Consentimiento</h2>
          <p>
            Al crear una cuenta en NexoLibre, usted manifiesta haber leído, comprendido y aceptado el presente Aviso de Privacidad, consintiendo de forma libre, específica, informada e inequívoca el tratamiento de sus datos personales en los términos aquí descritos.
          </p>
        </section>

      </article>

      <footer className="mt-14 border-t border-border pt-6 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} NexoLibre — Todos los derechos reservados.</p>
        <div className="mt-3 flex justify-center gap-6">
          <Link href="/terminos" className="hover:text-accent transition-colors">Términos de Servicio</Link>
          <Link href="/" className="hover:text-accent transition-colors">Inicio</Link>
        </div>
      </footer>
    </main>
  )
}
