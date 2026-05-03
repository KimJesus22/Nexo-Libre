/**
 * mensajesCache — NexoLibre
 *
 * Capa de caché para mensajes descifrados usando localforage (IndexedDB).
 *
 * Propósito:
 *   - Almacena temporalmente mensajes descifrados en el dispositivo
 *   - Permite navegación offline de conversaciones previamente cargadas
 *   - Se destruye completamente con destruirCacheMensajes() al:
 *     • Cerrar sesión (BotonCerrarSesion)
 *     • Botón de Pánico (BotonPanico)
 *     • Purga manual del Modo Efímero
 *
 * Seguridad:
 *   - Los mensajes ya llegan descifrados (post-E2EE) al ser cacheados
 *   - IndexedDB está aislado por origen (same-origin policy)
 *   - La instancia usa un nombre y storeName únicos para facilitar limpieza
 *   - destruirCacheMensajes() ejecuta localforage.clear() + dropInstance()
 *     para no dejar NINGÚN rastro en el dispositivo
 *
 * Estructura de almacenamiento:
 *   - Clave: "chat:{chatId}" → valor: Mensaje[] (ya descifrados)
 *   - Las claves usan el chatId como namespace
 */

import localforage from 'localforage'

/* ── Tipos ────────────────────────────────────────────────────────────────── */

export interface MensajeCacheado {
  id: string
  autorId: string
  autorNombre: string
  contenido: string
  creadoEn: string
  esMio: boolean
}

/* ── Instancia dedicada de localforage ────────────────────────────────────── */

const cacheMensajes = localforage.createInstance({
  name: 'nexolibre_mensajes',
  storeName: 'mensajes_descifrados',
  description: 'Cache temporal de mensajes descifrados para acceso offline',
})

/* ── Constantes ───────────────────────────────────────────────────────────── */

/** Prefijo de las claves de chat */
const CHAT_PREFIX = 'chat:'

/** Máximo de mensajes a cachear por chat (evitar crecer sin control) */
const MAX_MENSAJES_POR_CHAT = 200

/* ── API pública ──────────────────────────────────────────────────────────── */

/**
 * Obtiene mensajes cacheados para un chat específico.
 * Retorna null si no hay caché (primera visita o post-purga).
 */
export async function obtenerMensajesCacheados(
  chatId: string
): Promise<MensajeCacheado[] | null> {
  try {
    return await cacheMensajes.getItem<MensajeCacheado[]>(
      `${CHAT_PREFIX}${chatId}`
    )
  } catch (error) {
    console.warn('mensajesCache: Error leyendo caché:', error)
    return null
  }
}

/**
 * Guarda mensajes descifrados en caché para un chat.
 * Trunca a MAX_MENSAJES_POR_CHAT para evitar crecimiento descontrolado.
 */
export async function guardarMensajesEnCache(
  chatId: string,
  mensajes: MensajeCacheado[]
): Promise<void> {
  try {
    // Truncar a los últimos N mensajes (más recientes)
    const truncados =
      mensajes.length > MAX_MENSAJES_POR_CHAT
        ? mensajes.slice(-MAX_MENSAJES_POR_CHAT)
        : mensajes
    await cacheMensajes.setItem(`${CHAT_PREFIX}${chatId}`, truncados)
  } catch (error) {
    console.warn('mensajesCache: Error escribiendo caché:', error)
  }
}

/**
 * Agrega un mensaje individual al caché existente de un chat.
 * Usado para mensajes nuevos recibidos via Realtime.
 */
export async function agregarMensajeAlCache(
  chatId: string,
  mensaje: MensajeCacheado
): Promise<void> {
  try {
    const existentes = (await obtenerMensajesCacheados(chatId)) ?? []

    // Evitar duplicados
    if (existentes.some((m) => m.id === mensaje.id)) return

    const actualizados = [...existentes, mensaje]
    await guardarMensajesEnCache(chatId, actualizados)
  } catch (error) {
    console.warn('mensajesCache: Error agregando mensaje:', error)
  }
}

/**
 * Prepend: agrega mensajes antiguos al inicio del caché (paginación).
 */
export async function prependMensajesAlCache(
  chatId: string,
  mensajesAntiguos: MensajeCacheado[]
): Promise<void> {
  try {
    const existentes = (await obtenerMensajesCacheados(chatId)) ?? []

    // Filtrar duplicados
    const idsExistentes = new Set(existentes.map((m) => m.id))
    const nuevos = mensajesAntiguos.filter((m) => !idsExistentes.has(m.id))

    const actualizados = [...nuevos, ...existentes]
    await guardarMensajesEnCache(chatId, actualizados)
  } catch (error) {
    console.warn('mensajesCache: Error en prepend:', error)
  }
}

/**
 * 🔴 DESTRUCCIÓN TOTAL del caché de mensajes.
 *
 * Ejecuta localforage.clear() para borrar todos los datos de la instancia,
 * y luego dropInstance() para eliminar la base de datos IndexedDB por completo.
 *
 * DEBE llamarse en:
 *   - Cierre de sesión
 *   - Botón de Pánico
 *   - Purga del Modo Efímero
 *
 * Después de llamar esta función, NO queda ningún rastro de mensajes
 * descifrados en el dispositivo.
 */
export async function destruirCacheMensajes(): Promise<void> {
  try {
    // 1. Borrar todos los items de la instancia
    await cacheMensajes.clear()

    // 2. Eliminar la base de datos IndexedDB por completo
    await cacheMensajes.dropInstance({
      name: 'nexolibre_mensajes',
      storeName: 'mensajes_descifrados',
    })

    console.log('mensajesCache: ✓ Caché de mensajes destruido completamente')
  } catch (error) {
    // Fallback: intentar borrar IndexedDB directamente
    console.warn(
      'mensajesCache: Error en destrucción limpia, intentando fallback:',
      error
    )
    try {
      if (typeof indexedDB !== 'undefined') {
        indexedDB.deleteDatabase('nexolibre_mensajes')
      }
    } catch {
      // Silenciar — el navegador puede no soportar deleteDatabase
    }
  }
}
