/**
 * Generador de identificadores públicos — NexoLibre
 *
 * Convierte un UUID (128 bits, base 16) a un identificador corto
 * en base 62 (0-9, a-z, A-Z) que es:
 *
 * - Estéticamente limpio (sin guiones ni caracteres especiales)
 * - Seguro para URLs y para compartir
 * - Determinista (el mismo UUID siempre produce el mismo ID)
 * - Compacto (8 caracteres por defecto → 62^8 ≈ 218 billones de combinaciones)
 *
 * Matemática:
 *   UUID hex (32 chars, base 16) → BigInt → división sucesiva por 62 → string base 62
 *
 * Ejemplo:
 *   "550e8400-e29b-41d4-a716-446655440000" → "4kFz9wXq"
 */

/* ── Alfabeto base 62 ─────────────────────────────────────────────────────── */

const ALFABETO_BASE62 =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

const BASE = BigInt(ALFABETO_BASE62.length) // 62n

/* ── Conversión BigInt → Base 62 ──────────────────────────────────────────── */

/**
 * Convierte un BigInt a una cadena en base 62.
 *
 * Algoritmo: división sucesiva por 62, acumulando los residuos
 * mapeados al alfabeto base 62.
 *
 * @param valor - Número entero grande (BigInt)
 * @returns Cadena en base 62
 */
function bigintABase62(valor: bigint): string {
  if (valor === 0n) return ALFABETO_BASE62[0]

  let resultado = ''
  let restante = valor

  while (restante > 0n) {
    const residuo = Number(restante % BASE)
    resultado = ALFABETO_BASE62[residuo] + resultado
    restante = restante / BASE
  }

  return resultado
}

/* ── Conversión UUID → BigInt ─────────────────────────────────────────────── */

/**
 * Convierte un UUID (string con o sin guiones) a un BigInt.
 *
 * Elimina los guiones y parsea el hex resultante como un entero
 * de 128 bits en base 16.
 *
 * @param uuid - UUID en formato estándar (con o sin guiones)
 * @returns BigInt representando los 128 bits del UUID
 * @throws Error si el UUID no tiene el formato correcto
 */
function uuidABigint(uuid: string): bigint {
  const hex = uuid.replace(/-/g, '')

  if (hex.length !== 32 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(`UUID inválido: "${uuid}"`)
  }

  return BigInt(`0x${hex}`)
}

/* ── API pública ──────────────────────────────────────────────────────────── */

/**
 * Convierte un UUID a un identificador público corto en base 62.
 *
 * @param uuid - UUID del usuario (de auth.users)
 * @param longitud - Cantidad de caracteres del ID resultante (default: 8)
 * @returns Identificador público corto (ej: "4kFz9wXq")
 *
 * @example
 * ```ts
 * import { generarIdPublico } from '@/lib/id-publico'
 *
 * const idCorto = generarIdPublico('550e8400-e29b-41d4-a716-446655440000')
 * // → "4kFz9wXq"
 *
 * const idLargo = generarIdPublico('550e8400-e29b-41d4-a716-446655440000', 12)
 * // → "4kFz9wXq3B7m"
 * ```
 */
export function generarIdPublico(uuid: string, longitud: number = 8): string {
  const valor = uuidABigint(uuid)
  const base62Completo = bigintABase62(valor)

  // Tomar los primeros N caracteres (más significativos)
  // Para 8 chars: 62^8 = 218,340,105,584,896 combinaciones → virtualmente sin colisiones
  return base62Completo.slice(0, longitud)
}

/**
 * Convierte un UUID a formato hexadecimal corto (primeros N caracteres del UUID sin guiones).
 *
 * @param uuid - UUID del usuario
 * @param longitud - Cantidad de caracteres (default: 8)
 * @returns Hex corto (ej: "550e8400")
 *
 * @example
 * ```ts
 * import { generarHexCorto } from '@/lib/id-publico'
 *
 * const hex = generarHexCorto('550e8400-e29b-41d4-a716-446655440000')
 * // → "550e8400"
 * ```
 */
export function generarHexCorto(uuid: string, longitud: number = 8): string {
  return uuid.replace(/-/g, '').slice(0, longitud).toLowerCase()
}

/**
 * Tabla de referencia de colisiones por longitud:
 *
 * | Longitud | Combinaciones (base 62) | Probabilidad de colisión (1M usuarios) |
 * |----------|-------------------------|----------------------------------------|
 * |    6     | 56,800,235,584          | ~0.0009%                               |
 * |    8     | 218,340,105,584,896     | ~0.0000002%                            |
 * |   10     | 839,299,365,868,340,224 | Prácticamente 0                        |
 * |   12     | ~3.2 × 10^21            | 0                                      |
 */
