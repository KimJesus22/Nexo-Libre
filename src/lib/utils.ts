/**
 * Utilidades compartidas de la aplicación.
 *
 * Agrega aquí funciones auxiliares reutilizables que no dependan
 * de un dominio de negocio específico (formateo de fechas,
 * validación genérica, generación de slugs, etc.).
 */

/**
 * Combina clases de CSS condicionalmente.
 * Filtra valores falsy y une las clases resultantes con un espacio.
 *
 * @ejemplo
 *   cn('base', esActivo && 'activa', esDeshabilitado && 'opacidad-50')
 *   // → 'base activa' (si esActivo=true, esDeshabilitado=false)
 */
export function cn(...clases: (string | boolean | undefined | null)[]): string {
  return clases.filter(Boolean).join(' ')
}
