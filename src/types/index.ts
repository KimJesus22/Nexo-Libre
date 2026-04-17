/**
 * Definiciones de tipos TypeScript compartidas.
 *
 * Agrega aquí interfaces y tipos que se reutilicen en múltiples
 * módulos de la aplicación. Los tipos específicos de un dominio
 * van dentro de su propio módulo.
 *
 * Ejemplo:
 *   import type { Usuario, Paginacion } from '@/types'
 */

/** Respuesta genérica paginada */
export interface RespuestaPaginada<T> {
  datos: T[]
  total: number
  pagina: number
  porPagina: number
}

/** Estado genérico de carga asíncrona */
export interface EstadoAsincrono<T> {
  datos: T | null
  cargando: boolean
  error: string | null
}
