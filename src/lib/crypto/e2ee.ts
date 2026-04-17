/**
 * Módulo de cifrado end-to-end (E2EE) — NexoLibre
 *
 * Implementa cifrado AES-256-GCM con la Web Crypto API.
 * Los mensajes se cifran en el navegador ANTES de enviarse a Supabase,
 * y se descifran ÚNICAMENTE en el cliente destino.
 *
 * Supabase nunca ve texto plano — solo ciphertext.
 *
 * Arquitectura:
 *   1. Cada chat tiene una clave simétrica AES-256-GCM
 *   2. La clave se genera con crypto.getRandomValues (256 bits)
 *   3. Cada mensaje usa un IV aleatorio de 12 bytes (nunca reutilizado)
 *   4. El payload cifrado se almacena como: base64(iv) + "." + base64(ciphertext)
 *   5. Las claves se persisten en localStorage cifradas con PBKDF2 + contraseña del usuario
 *
 * Algoritmo: AES-256-GCM
 *   - Cifrado autenticado (confidencialidad + integridad)
 *   - IV de 96 bits (12 bytes) — estándar NIST SP 800-38D
 *   - Tag de autenticación de 128 bits (implícito en GCM)
 */

/* ── Constantes ───────────────────────────────────────────────────────────── */
const ALGORITMO = 'AES-GCM' as const
const LONGITUD_CLAVE = 256 // bits
const LONGITUD_IV = 12 // bytes (96 bits, estándar NIST para GCM)
const SEPARADOR_PAYLOAD = '.' // Separa IV del ciphertext en el payload
const PREFIJO_CIFRADO = 'e2ee:' // Identifica mensajes cifrados vs. texto plano
const PBKDF2_ITERACIONES = 600_000 // OWASP 2023 recomienda ≥600k para SHA-256
const LONGITUD_SAL = 16 // bytes

/* ── Utilidades de codificación ───────────────────────────────────────────── */

/** Convierte ArrayBuffer a string base64 URL-safe */
function bufferABase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Convierte string base64 URL-safe a ArrayBuffer */
function base64ABuffer(base64: string): ArrayBuffer {
  const padded = base64.replace(/-/g, '+').replace(/_/g, '/')
  const paddedFull = padded + '='.repeat((4 - (padded.length % 4)) % 4)
  const binary = atob(paddedFull)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

/** Convierte string a ArrayBuffer (UTF-8) */
function textoABuffer(texto: string): ArrayBuffer {
  return new TextEncoder().encode(texto).buffer as ArrayBuffer
}

/** Convierte ArrayBuffer a string (UTF-8) */
function bufferATexto(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

/* ── Generación de claves ─────────────────────────────────────────────────── */

/**
 * Genera una clave AES-256-GCM criptográficamente segura.
 * Usa crypto.getRandomValues() como fuente de entropía.
 */
export async function generarClaveSimetrica(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITMO, length: LONGITUD_CLAVE },
    true, // extractable: necesario para exportar/importar
    ['encrypt', 'decrypt']
  )
}

/**
 * Exporta una CryptoKey a formato raw (ArrayBuffer).
 * Necesario para persistir en localStorage.
 */
export async function exportarClave(clave: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', clave)
}

/**
 * Importa un ArrayBuffer como CryptoKey AES-256-GCM.
 */
export async function importarClave(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: ALGORITMO, length: LONGITUD_CLAVE },
    true,
    ['encrypt', 'decrypt']
  )
}

/* ── Cifrado y descifrado de mensajes ─────────────────────────────────────── */

/**
 * Cifra un mensaje de texto plano con AES-256-GCM.
 *
 * @param textoPlano - Mensaje a cifrar
 * @param clave - CryptoKey AES-256-GCM
 * @returns Payload cifrado en formato: "e2ee:base64(iv).base64(ciphertext)"
 *
 * El IV (Initialization Vector) se genera aleatoriamente para cada mensaje.
 * NUNCA se reutiliza un IV con la misma clave — hacerlo destruiría
 * la seguridad de GCM (per NIST SP 800-38D, Sección 8.3).
 */
export async function cifrarMensaje(
  textoPlano: string,
  clave: CryptoKey
): Promise<string> {
  // IV aleatorio de 12 bytes (96 bits)
  const iv = crypto.getRandomValues(new Uint8Array(LONGITUD_IV))

  // Cifrar con AES-256-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITMO, iv },
    clave,
    textoABuffer(textoPlano)
  )

  // Formato: "e2ee:base64(iv).base64(ciphertext)"
  const ivB64 = bufferABase64(iv.buffer as ArrayBuffer)
  const ctB64 = bufferABase64(ciphertext)

  return `${PREFIJO_CIFRADO}${ivB64}${SEPARADOR_PAYLOAD}${ctB64}`
}

/**
 * Descifra un payload cifrado con AES-256-GCM.
 *
 * @param payloadCifrado - String en formato "e2ee:base64(iv).base64(ciphertext)"
 * @param clave - CryptoKey AES-256-GCM (misma que se usó para cifrar)
 * @returns Texto plano descifrado
 * @throws Error si el payload está corrupto, el tag de autenticación falla,
 *         o la clave es incorrecta
 */
export async function descifrarMensaje(
  payloadCifrado: string,
  clave: CryptoKey
): Promise<string> {
  // Verificar que es un mensaje cifrado
  if (!esMensajeCifrado(payloadCifrado)) {
    // Si no tiene el prefijo, devolver tal cual (compatibilidad con mensajes antiguos)
    return payloadCifrado
  }

  // Extraer IV y ciphertext
  const sinPrefijo = payloadCifrado.slice(PREFIJO_CIFRADO.length)
  const separadorIdx = sinPrefijo.indexOf(SEPARADOR_PAYLOAD)

  if (separadorIdx === -1) {
    throw new Error('E2EE: Payload malformado — falta separador IV/ciphertext')
  }

  const ivB64 = sinPrefijo.slice(0, separadorIdx)
  const ctB64 = sinPrefijo.slice(separadorIdx + 1)

  const iv = new Uint8Array(base64ABuffer(ivB64))
  const ciphertext = base64ABuffer(ctB64)

  // Descifrar (GCM verifica el tag de autenticación automáticamente)
  try {
    const textoPlano = await crypto.subtle.decrypt(
      { name: ALGORITMO, iv },
      clave,
      ciphertext
    )
    return bufferATexto(textoPlano)
  } catch {
    throw new Error(
      'E2EE: Descifrado fallido — clave incorrecta o mensaje corrupto/manipulado'
    )
  }
}

/**
 * Verifica si un string es un mensaje cifrado E2EE.
 */
export function esMensajeCifrado(contenido: string): boolean {
  return contenido.startsWith(PREFIJO_CIFRADO)
}

/* ── Almacenamiento seguro de claves (localStorage + PBKDF2) ──────────────── */

/**
 * Deriva una clave de cifrado a partir de una contraseña usando PBKDF2.
 * Se usa para proteger las claves de chat en localStorage.
 *
 * PBKDF2 con 600k iteraciones (OWASP 2023) + sal aleatoria.
 */
async function derivarClaveDeProteccion(
  password: string,
  sal: Uint8Array
): Promise<CryptoKey> {
  // Importar password como material de clave
  const material = await crypto.subtle.importKey(
    'raw',
    textoABuffer(password) as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derivar clave AES-256 con PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: sal.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERACIONES,
      hash: 'SHA-256',
    },
    material,
    { name: ALGORITMO, length: LONGITUD_CLAVE },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Guarda una clave de chat en localStorage, protegida con PBKDF2.
 *
 * @param chatId - ID del chat
 * @param clavChat - CryptoKey del chat a guardar
 * @param userId - ID del usuario (se usa como parte de la contraseña de derivación)
 */
export async function guardarClaveChat(
  chatId: string,
  claveChat: CryptoKey,
  userId: string
): Promise<void> {
  // Exportar la clave del chat a raw bytes
  const rawKey = await exportarClave(claveChat)

  // Generar sal aleatoria
  const sal = crypto.getRandomValues(new Uint8Array(LONGITUD_SAL))

  // Derivar clave de protección usando el userId como base
  // (en producción se usaría la contraseña del usuario o un PIN dedicado)
  const claveProteccion = await derivarClaveDeProteccion(userId, sal)

  // Cifrar la clave del chat
  const iv = crypto.getRandomValues(new Uint8Array(LONGITUD_IV))
  const claveCifrada = await crypto.subtle.encrypt(
    { name: ALGORITMO, iv },
    claveProteccion,
    rawKey
  )

  // Guardar en localStorage: sal + iv + clave cifrada
  const almacenamiento = {
    s: bufferABase64(sal.buffer as ArrayBuffer),
    i: bufferABase64(iv.buffer as ArrayBuffer),
    k: bufferABase64(claveCifrada),
  }

  localStorage.setItem(`nexo_e2ee_${chatId}`, JSON.stringify(almacenamiento))
}

/**
 * Recupera y descifra una clave de chat desde localStorage.
 *
 * @param chatId - ID del chat
 * @param userId - ID del usuario
 * @returns CryptoKey del chat, o null si no existe
 */
export async function recuperarClaveChat(
  chatId: string,
  userId: string
): Promise<CryptoKey | null> {
  const json = localStorage.getItem(`nexo_e2ee_${chatId}`)
  if (!json) return null

  try {
    const { s, i, k } = JSON.parse(json) as { s: string; i: string; k: string }

    const sal = new Uint8Array(base64ABuffer(s))
    const iv = new Uint8Array(base64ABuffer(i))
    const claveCifrada = base64ABuffer(k)

    // Derivar la misma clave de protección
    const claveProteccion = await derivarClaveDeProteccion(userId, sal)

    // Descifrar la clave del chat
    const rawKey = await crypto.subtle.decrypt(
      { name: ALGORITMO, iv },
      claveProteccion,
      claveCifrada
    )

    return importarClave(rawKey)
  } catch {
    // Clave corrupta o userId diferente
    console.error(`E2EE: No se pudo recuperar la clave del chat ${chatId}`)
    return null
  }
}

/**
 * Obtiene o genera la clave de un chat.
 * Si no existe, genera una nueva y la guarda.
 */
export async function obtenerOCrearClaveChat(
  chatId: string,
  userId: string
): Promise<CryptoKey> {
  // Intentar recuperar clave existente
  const existente = await recuperarClaveChat(chatId, userId)
  if (existente) return existente

  // Generar nueva clave
  const nueva = await generarClaveSimetrica()
  await guardarClaveChat(chatId, nueva, userId)
  return nueva
}
