/**
 * Preferencias de privacidad — NexoLibre
 *
 * Gestiona las preferencias locales de privacidad del usuario.
 * Los datos se almacenan en localStorage (nunca en servidor).
 *
 * Modo Efímero:
 *   - Cuando está activo, al cerrar sesión se borran:
 *     • Mensajes en memoria (state)
 *     • Claves E2EE de localStorage
 *     • Cache del navegador para la app
 *   - Refuerza la política de "cero rastros"
 */

const CLAVE_PREFERENCIAS = 'nexo_privacidad'

export interface PreferenciasPrivacidad {
  modoEfimero: boolean
  borrarAlCerrar: boolean
  deshabilitarPrevisualizacion: boolean
}

const DEFAULTS: PreferenciasPrivacidad = {
  modoEfimero: false,
  borrarAlCerrar: false,
  deshabilitarPrevisualizacion: false,
}

/** Obtiene las preferencias de privacidad desde localStorage */
export function obtenerPreferencias(): PreferenciasPrivacidad {
  if (typeof window === 'undefined') return DEFAULTS

  try {
    const json = localStorage.getItem(CLAVE_PREFERENCIAS)
    if (!json) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(json) }
  } catch {
    return DEFAULTS
  }
}

/** Guarda las preferencias de privacidad en localStorage */
export function guardarPreferencias(prefs: Partial<PreferenciasPrivacidad>): void {
  if (typeof window === 'undefined') return

  const actuales = obtenerPreferencias()
  const nuevas = { ...actuales, ...prefs }
  localStorage.setItem(CLAVE_PREFERENCIAS, JSON.stringify(nuevas))
}

/**
 * Ejecuta la purga de datos locales (Modo Efímero).
 *
 * Borra:
 *   1. Todas las claves E2EE (nexo_e2ee_*)
 *   2. Preferencias de privacidad
 *   3. Cualquier cache de sesión
 *
 * Se llama automáticamente al cerrar sesión si modoEfimero está activo.
 */
export function purgarDatosLocales(): void {
  if (typeof window === 'undefined') return

  // 1. Borrar claves E2EE
  const clavesAEliminar: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('nexo_e2ee_') || key?.startsWith('nexo_')) {
      clavesAEliminar.push(key)
    }
  }
  clavesAEliminar.forEach((key) => localStorage.removeItem(key))

  // 2. Limpiar sessionStorage
  sessionStorage.clear()

  // 3. Borrar caches de la app (Service Workers)
  if ('caches' in window) {
    caches.keys().then((nombres) => {
      nombres.forEach((nombre) => caches.delete(nombre))
    })
  }
}

/**
 * Verifica si el modo efímero está activo y ejecuta la purga si corresponde.
 * Llamar al cerrar sesión (antes de redirect).
 */
export function ejecutarPurgaSiEfimero(): void {
  const prefs = obtenerPreferencias()
  if (prefs.modoEfimero) {
    purgarDatosLocales()
  }
}
