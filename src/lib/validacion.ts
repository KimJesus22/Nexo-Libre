/**
 * Esquemas de validación Zod — NexoLibre
 *
 * Validación server-side estricta para:
 *   - Autenticación (correo, contraseña, Magic Link)
 *   - Mensajes de chat (contenido sanitizado)
 *   - Perfiles (nombre de usuario, nombre completo)
 *
 * Reglas de seguridad:
 *   - Correos: formato RFC 5322 via z.string().email()
 *   - Contraseñas: mínimo 8 caracteres, máximo 128
 *   - Mensajes: máximo 5000 caracteres, sin HTML peligroso
 *   - Sanitización: rechaza <script>, <iframe>, onerror=, javascript:, etc.
 *   - Todos los strings pasan por .trim()
 */

import { z } from 'zod'

/* ── Patrones de detección de inyección ───────────────────────────────────── */

/**
 * Regex que detecta etiquetas HTML peligrosas y atributos de ejecución.
 * Cubre: <script>, <iframe>, <object>, <embed>, <form>,
 *        on*= event handlers, javascript: URIs, data: URIs con script.
 */
const REGEX_HTML_PELIGROSO =
  /<\s*\/?\s*(script|iframe|object|embed|form|link|meta|base|svg)\b[^>]*>|on\w+\s*=|javascript\s*:|data\s*:\s*text\/html/gi

/** Verifica que un string NO contenga HTML peligroso */
function sinHtmlPeligroso(valor: string): boolean {
  return !REGEX_HTML_PELIGROSO.test(valor)
}

/* ── Esquemas de autenticación ────────────────────────────────────────────── */

/** Correo electrónico validado */
export const esquemaEmail = z
  .string()
  .trim()
  .min(1, 'El correo electrónico es obligatorio.')
  .max(254, 'El correo no puede exceder 254 caracteres.')
  .email('El formato del correo electrónico no es válido.')
  .toLowerCase()

/** Contraseña con requisitos mínimos */
export const esquemaPassword = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(128, 'La contraseña no puede exceder 128 caracteres.')

/** Formulario de Magic Link */
export const esquemaMagicLink = z.object({
  email: esquemaEmail,
})

/** Formulario de inicio de sesión con contraseña */
export const esquemaInicioSesion = z.object({
  email: esquemaEmail,
  password: esquemaPassword,
})

/** Formulario de registro */
export const esquemaRegistro = z.object({
  email: esquemaEmail,
  password: esquemaPassword,
})

/* ── Esquemas de mensajes de chat ─────────────────────────────────────────── */

/** Contenido de un mensaje de chat — texto plano sanitizado */
export const esquemaContenidoMensaje = z
  .string()
  .trim()
  .min(1, 'El mensaje no puede estar vacío.')
  .max(5000, 'El mensaje no puede exceder 5000 caracteres.')
  .refine(sinHtmlPeligroso, {
    message:
      'El mensaje contiene contenido no permitido (etiquetas HTML o scripts).',
  })

/** Datos completos para enviar un mensaje */
export const esquemaMensaje = z.object({
  chatId: z.string().uuid('ID de chat inválido.'),
  contenido: esquemaContenidoMensaje,
})

/* ── Esquemas de perfil (Onboarding) ──────────────────────────────────────── */

/** Nombre de usuario (seudónimo) */
export const esquemaUsername = z
  .string()
  .trim()
  .min(3, 'El seudónimo debe tener al menos 3 caracteres.')
  .max(30, 'El seudónimo no puede exceder 30 caracteres.')
  .regex(
    /^[a-z0-9_]+$/,
    'Solo se permiten letras minúsculas, números y guión bajo.'
  )

/** Nombre completo (opcional) */
export const esquemaNombreCompleto = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(100, 'El nombre no puede exceder 100 caracteres.')
  .refine(sinHtmlPeligroso, {
    message: 'El nombre contiene contenido no permitido.',
  })
  .optional()

/* ── Utilidad para extraer datos de FormData ──────────────────────────────── */

/**
 * Extrae y valida campos de un FormData contra un esquema Zod.
 * Retorna un discriminated union con `success` para narrowing de TS.
 */
export function validarFormData<T extends z.ZodObject<z.ZodRawShape>>(
  esquema: T,
  formData: FormData
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  // Convertir FormData a objeto plano
  const raw: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      raw[key] = value
    }
  }

  const resultado = esquema.safeParse(raw)

  if (!resultado.success) {
    // Tomar el primer error legible
    const primerError = resultado.error.issues[0]
    return { success: false, error: primerError?.message ?? 'Datos inválidos.' }
  }

  return { success: true, data: resultado.data }
}
