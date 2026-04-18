'use client'

/**
 * ModalLegal — NexoLibre
 *
 * Modal interactivo para Términos y Condiciones / Aviso de Privacidad.
 *
 * Cumplimiento legal (derecho mercantil y civil):
 * - El botón "Aceptar" permanece bloqueado hasta que el usuario
 *   haga scroll hasta el final ABSOLUTO del documento.
 * - Se detecta el final con: scrollTop + clientHeight >= scrollHeight - umbral
 * - Umbral de 2px para compensar redondeo sub-pixel del navegador.
 * - Indicador visual de progreso de lectura.
 * - Timestamp de aceptación registrado.
 */

import { useState, useRef, useCallback, useEffect } from 'react'

/* ── Tipos ────────────────────────────────────────────────────────────────── */

interface PropiedadesModalLegal {
  /** Tipo de documento legal */
  tipo: 'terminos' | 'privacidad'
  /** Si el modal está abierto */
  abierto: boolean
  /** Callback al cerrar sin aceptar */
  alCerrar: () => void
  /** Callback al aceptar (incluye timestamp) */
  alAceptar: (timestamp: string) => void
}

/* ── Contenido legal ──────────────────────────────────────────────────────── */

const CONTENIDO_LEGAL = {
  terminos: {
    titulo: 'Términos y Condiciones de Uso',
    subtitulo: 'Contrato de adhesión — Última actualización: abril 2026',
    secciones: [
      {
        encabezado: 'CLÁUSULA PRIMERA — Objeto del contrato',
        contenido:
          'El presente instrumento jurídico establece los términos y condiciones generales que regulan el acceso y uso de la plataforma digital denominada "NexoLibre" (en adelante, "la Plataforma"). Al acceder, registrarse o utilizar cualquier funcionalidad de la Plataforma, el usuario (en adelante, "el Usuario") manifiesta su consentimiento expreso e inequívoco a los presentes términos, los cuales tienen carácter vinculante y obligatorio conforme a la legislación aplicable en materia de comercio electrónico y protección al consumidor.',
      },
      {
        encabezado: 'CLÁUSULA SEGUNDA — Definiciones',
        contenido:
          'Para los efectos del presente contrato, se entenderá por: (a) "Plataforma": el conjunto de interfaces, servicios, funcionalidades y contenidos accesibles a través del dominio nexolibre.app y sus subdominios; (b) "Usuario": toda persona física o moral que acceda, se registre o utilice la Plataforma; (c) "Cuenta": el registro individual del Usuario que permite el acceso personalizado a los servicios de la Plataforma; (d) "Datos personales": cualquier información concerniente a una persona física identificada o identificable, en los términos de la legislación aplicable; (e) "Servicio": las funcionalidades proporcionadas por la Plataforma, incluyendo pero no limitándose a la gestión de identidad digital, autenticación y almacenamiento seguro de información.',
      },
      {
        encabezado: 'CLÁUSULA TERCERA — Capacidad legal',
        contenido:
          'El Usuario declara bajo protesta de decir verdad que cuenta con capacidad legal plena para celebrar el presente contrato. En caso de que el Usuario sea menor de edad, deberá contar con la autorización expresa de su padre, madre, tutor o representante legal. La Plataforma se reserva el derecho de verificar la capacidad legal del Usuario en cualquier momento y de suspender o cancelar la Cuenta en caso de incumplimiento a esta cláusula.',
      },
      {
        encabezado: 'CLÁUSULA CUARTA — Registro y autenticación',
        contenido:
          'Para acceder a los servicios de la Plataforma, el Usuario deberá crear una Cuenta proporcionando una dirección de correo electrónico válida. La Plataforma ofrece métodos de autenticación que NO requieren la vinculación de una línea telefónica móvil ni la presentación de identificaciones oficiales. Esta decisión de diseño responde a principios de minimización de datos y prevención de vulnerabilidades asociadas al intercambio fraudulento de tarjetas SIM (SIM Swapping). El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de cualquier factor de autenticación adicional que configure, incluyendo pero no limitándose a aplicaciones de contraseñas de un solo uso basadas en tiempo (TOTP).',
      },
      {
        encabezado: 'CLÁUSULA QUINTA — Uso aceptable',
        contenido:
          'El Usuario se obliga a utilizar la Plataforma de conformidad con la ley, la moral, las buenas costumbres y el orden público. Queda expresamente prohibido: (a) utilizar la Plataforma para actividades ilícitas o contrarias a la buena fe; (b) intentar acceder a cuentas ajenas o a sistemas internos de la Plataforma sin autorización; (c) realizar ingeniería inversa, descompilar o desensamblar cualquier componente de la Plataforma; (d) introducir virus, código malicioso o cualquier software que pueda dañar la integridad de la Plataforma; (e) utilizar mecanismos automatizados de extracción de datos sin autorización escrita.',
      },
      {
        encabezado: 'CLÁUSULA SEXTA — Propiedad intelectual',
        contenido:
          'La Plataforma, su código fuente, diseño gráfico, interfaces de usuario, logotipos, nombres comerciales y demás elementos que la componen están protegidos por la legislación aplicable en materia de propiedad intelectual e industrial. El carácter de código abierto de determinados componentes de la Plataforma no implica una renuncia a los derechos de propiedad intelectual, sino que se sujeta a los términos de la licencia específica bajo la cual se distribuyen.',
      },
      {
        encabezado: 'CLÁUSULA SÉPTIMA — Limitación de responsabilidad',
        contenido:
          'La Plataforma se proporciona "tal cual" y "según disponibilidad". En la máxima medida permitida por la ley aplicable, NexoLibre no otorga garantías de ningún tipo, ya sean expresas, implícitas, legales o de otro tipo, incluyendo pero no limitándose a garantías de comerciabilidad, idoneidad para un propósito particular, título, y no infracción. NexoLibre no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo pero no limitándose a pérdida de beneficios, datos, uso, fondo de comercio u otras pérdidas intangibles.',
      },
      {
        encabezado: 'CLÁUSULA OCTAVA — Modificaciones',
        contenido:
          'NexoLibre se reserva el derecho de modificar los presentes términos en cualquier momento. Las modificaciones entrarán en vigor a partir de su publicación en la Plataforma. El uso continuado de la Plataforma después de la publicación de las modificaciones constituirá la aceptación tácita de las mismas. En caso de modificaciones sustanciales, NexoLibre notificará al Usuario a través de los medios de contacto registrados en su Cuenta.',
      },
      {
        encabezado: 'CLÁUSULA NOVENA — Legislación aplicable y jurisdicción',
        contenido:
          'El presente contrato se regirá e interpretará de conformidad con las leyes aplicables. Para la resolución de cualquier controversia derivada del presente contrato, las partes se someten a la jurisdicción de los tribunales competentes, renunciando expresamente a cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.',
      },
    ],
  },
  privacidad: {
    titulo: 'Aviso de Privacidad Integral',
    subtitulo: 'Protección de datos personales — Última actualización: abril 2026',
    secciones: [
      {
        encabezado: 'I. Identidad del responsable',
        contenido:
          'NexoLibre, con domicilio para efectos del presente aviso en el que se indique en la sección de contacto de la Plataforma, es responsable del tratamiento de los datos personales que recabe de los usuarios, en cumplimiento con la legislación aplicable en materia de protección de datos personales.',
      },
      {
        encabezado: 'II. Datos personales que recabamos',
        contenido:
          'Para las finalidades señaladas en el presente aviso, recabamos las siguientes categorías de datos personales: (a) Datos de identificación: dirección de correo electrónico; (b) Datos de autenticación: contraseñas cifradas, factores TOTP; (c) Datos de uso: registros de actividad, direcciones IP, tipo de navegador, fecha y hora de acceso. Declaramos expresamente que NO recabamos: números telefónicos, datos biométricos, copias de identificaciones oficiales, datos de geolocalización precisa, ni información financiera de ningún tipo.',
      },
      {
        encabezado: 'III. Finalidades del tratamiento',
        contenido:
          'Los datos personales recabados serán utilizados para las siguientes finalidades primarias, que son necesarias para la prestación del servicio: (a) Creación y administración de la Cuenta del Usuario; (b) Autenticación y verificación de identidad; (c) Prestación de los servicios contratados; (d) Comunicaciones relacionadas con el servicio. Finalidades secundarias: (a) Mejora de la experiencia de usuario; (b) Análisis estadísticos anónimos. El Usuario puede manifestar su negativa al tratamiento de datos para finalidades secundarias enviando un correo electrónico al contacto indicado en la Plataforma.',
      },
      {
        encabezado: 'IV. Fundamento para el tratamiento',
        contenido:
          'El tratamiento de datos personales se realiza con base en: (a) El consentimiento del titular, otorgado mediante la aceptación del presente aviso; (b) La ejecución del contrato de prestación de servicios entre NexoLibre y el Usuario; (c) El cumplimiento de obligaciones legales aplicables. El Usuario puede revocar su consentimiento en cualquier momento a través de los mecanismos establecidos en la sección de derechos ARCO.',
      },
      {
        encabezado: 'V. Medidas de seguridad',
        contenido:
          'NexoLibre implementa medidas de seguridad técnicas, administrativas y físicas para proteger los datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado. Dichas medidas incluyen: (a) Cifrado en tránsito (TLS 1.3) y en reposo; (b) Row Level Security (RLS) a nivel de base de datos; (c) Autenticación multifactor (TOTP) opcional; (d) Tokens JWT de vida corta con refresco automático; (e) Esquema de permisos de mínimo privilegio; (f) Funciones de base de datos aisladas en esquema privado.',
      },
      {
        encabezado: 'VI. Derechos ARCO',
        contenido:
          'El titular de los datos personales tiene derecho a: (A) Acceder a sus datos personales; (R) Rectificar sus datos cuando sean inexactos o incompletos; (C) Cancelar sus datos cuando considere que no se requieren para alguna de las finalidades señaladas; (O) Oponerse al tratamiento de sus datos para fines específicos. Para el ejercicio de cualquiera de estos derechos, el titular podrá enviar una solicitud a través de los canales de contacto establecidos en la Plataforma.',
      },
      {
        encabezado: 'VII. Transferencias de datos',
        contenido:
          'NexoLibre podrá transferir datos personales a terceros proveedores de infraestructura (Supabase, Vercel) para la prestación del servicio. Dichas transferencias se realizan con las garantías adecuadas y los terceros receptores están obligados contractualmente a mantener la confidencialidad y seguridad de los datos. No se realizan transferencias de datos personales con fines comerciales, publicitarios o de perfilamiento a terceros.',
      },
      {
        encabezado: 'VIII. Modificaciones al aviso de privacidad',
        contenido:
          'NexoLibre se reserva el derecho de efectuar modificaciones o actualizaciones al presente aviso de privacidad. Cualquier modificación será notificada al Usuario a través de la Plataforma. La fecha de la última actualización se indicará al inicio del presente documento.',
      },
    ],
  },
} as const

/* ── Componente principal ─────────────────────────────────────────────────── */

export default function ModalLegal({
  tipo,
  abierto,
  alCerrar,
  alAceptar,
}: PropiedadesModalLegal) {
  const [leido, setLeido] = useState(false)
  const [progresoScroll, setProgresoScroll] = useState(0)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const doc = CONTENIDO_LEGAL[tipo]

  /* ── Reset al abrir ─────────────────────────────────────────────────── */
  // Sincronizar estado del scroll y body overflow con la prop 'abierto'
  useEffect(() => {
    if (abierto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset modal state when prop changes
      setLeido(false)
      setProgresoScroll(0)
      // Bloquear scroll del body
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [abierto])

  /* ── Detectar scroll hasta el final absoluto ────────────────────────── */
  const manejarScroll = useCallback(() => {
    const el = contenedorRef.current
    if (!el) return

    const { scrollTop, scrollHeight, clientHeight } = el
    const scrollable = scrollHeight - clientHeight

    if (scrollable <= 0) {
      // El contenido cabe sin scroll → ya se "leyó"
      setLeido(true)
      setProgresoScroll(100)
      return
    }

    // Progreso: 0% → 100%
    const progreso = Math.min((scrollTop / scrollable) * 100, 100)
    setProgresoScroll(progreso)

    // Umbral de 2px para compensar redondeo sub-pixel del navegador
    if (scrollTop + clientHeight >= scrollHeight - 2) {
      setLeido(true)
    }
  }, [])

  /* ── Aceptar ────────────────────────────────────────────────────────── */
  const aceptar = useCallback(() => {
    if (!leido) return
    const timestamp = new Date().toISOString()
    alAceptar(timestamp)
  }, [leido, alAceptar])

  /* ── Cerrar con Escape ──────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrar()
    }
    if (abierto) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [abierto, alCerrar])

  if (!abierto) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={alCerrar}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-4 z-50 mx-auto flex max-w-3xl flex-col rounded-2xl border border-border bg-surface shadow-2xl sm:inset-8 md:inset-y-12 md:inset-x-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-legal"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2
              id="titulo-legal"
              className="text-lg font-bold text-foreground"
            >
              {doc.titulo}
            </h2>
            <p className="mt-0.5 text-xs text-muted">{doc.subtitulo}</p>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* ── Barra de progreso de lectura ─────────────────────────────── */}
        <div className="relative h-1 w-full bg-border-subtle">
          <div
            className="absolute left-0 top-0 h-full transition-all duration-150"
            style={{
              width: `${progresoScroll}%`,
              background: leido
                ? 'var(--success)'
                : 'var(--accent)',
            }}
          />
        </div>

        {/* ── Contenido scrollable ────────────────────────────────────── */}
        <div
          ref={contenedorRef}
          onScroll={manejarScroll}
          className="flex-1 overflow-y-auto scroll-smooth px-6 py-6"
          tabIndex={0}
        >
          <div className="prose prose-sm max-w-none">
            {doc.secciones.map((seccion) => (
              <article key={seccion.encabezado} className="mb-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground">
                  {seccion.encabezado}
                </h3>
                <p className="text-sm leading-relaxed text-foreground-secondary">
                  {seccion.contenido}
                </p>
              </article>
            ))}

            {/* Marcador de fin de documento */}
            <div className="mt-8 flex flex-col items-center gap-2 border-t border-border-subtle pt-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-xs font-medium text-muted">
                — Fin del documento —
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer con indicador y botones ───────────────────────────── */}
        <footer className="flex shrink-0 items-center justify-between border-t border-border px-6 py-4">
          <div className="flex items-center gap-2">
            {leido ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Documento leído
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
                Desplázate hasta el final para aceptar
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={alCerrar}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={aceptar}
              disabled={!leido}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              title={leido ? 'Aceptar los términos' : 'Debes leer todo el documento primero'}
            >
              Aceptar
            </button>
          </div>
        </footer>
      </div>
    </>
  )
}
