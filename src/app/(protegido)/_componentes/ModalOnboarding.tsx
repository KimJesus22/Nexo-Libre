'use client'

/**
 * ModalOnboarding — NexoLibre
 *
 * Modal de bienvenida que aparece la primera vez que un usuario
 * inicia sesión con Magic Link y aún no tiene seudónimo.
 *
 * Flujo:
 *   1. Detecta nombre_usuario === null en el perfil
 *   2. Muestra modal (no dismissable) para:
 *      - Elegir un seudónimo (username) — validado en tiempo real
 *      - Subir una foto de perfil (opcional) — a Supabase Storage
 *   3. Al confirmar, actualiza public.perfiles y cierra el modal
 *
 * Validación del username:
 *   - 3-30 caracteres
 *   - Solo a-z, 0-9, _ (lowercase)
 *   - Unicidad verificada en tiempo real con debounce
 *
 * Avatar:
 *   - Supabase Storage bucket "avatares"
 *   - Ruta: {userId}/avatar.{ext}
 *   - Límite: 2MB, JPEG/PNG/WebP/GIF
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ── Constantes ───────────────────────────────────────────────────────────── */
const REGEX_USERNAME = /^[a-z0-9_]{3,30}$/
const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB
const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/* ── Props ────────────────────────────────────────────────────────────────── */
interface PropsOnboarding {
  userId: string
  emailUsuario: string
  alCompletar: () => void
}

/* ── Debounce hook ────────────────────────────────────────────────────────── */
function useDebounce<T>(valor: T, demora: number): T {
  const [d, setD] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setD(valor), demora)
    return () => clearTimeout(t)
  }, [valor, demora])
  return d
}

/* ── Componente ───────────────────────────────────────────────────────────── */

export default function ModalOnboarding({
  userId,
  emailUsuario,
  alCompletar,
}: PropsOnboarding) {
  const supabase = useRef(createClient()).current

  // Estado del formulario
  const [username, setUsername] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [archivoAvatar, setArchivoAvatar] = useState<File | null>(null)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)

  // Estado de validación
  const [usernameDisponible, setUsernameDisponible] = useState<boolean | null>(null)
  const [verificandoUsername, setVerificandoUsername] = useState(false)
  const [errorUsername, setErrorUsername] = useState<string | null>(null)
  const [errorAvatar, setErrorAvatar] = useState<string | null>(null)

  // Estado de envío
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  const inputFileRef = useRef<HTMLInputElement>(null)
  const usernameDebounced = useDebounce(username, 400)

  /* ── Verificar disponibilidad del username ──────────────────────────── */
  useEffect(() => {
    const verificar = async () => {
      if (!usernameDebounced || !REGEX_USERNAME.test(usernameDebounced)) {
        setUsernameDisponible(null)
        return
      }

      setVerificandoUsername(true)
      const { data } = await supabase
        .from('perfiles')
        .select('id')
        .eq('nombre_usuario', usernameDebounced)
        .limit(1)
        .maybeSingle()

      // Si data existe y NO es mi propio perfil → no disponible
      setUsernameDisponible(!data || data.id === userId)
      setVerificandoUsername(false)
    }

    verificar()
  }, [usernameDebounced, supabase, userId])

  /* ── Validar username en tiempo real ────────────────────────────────── */
  useEffect(() => {
    if (!username) {
      setErrorUsername(null)
      return
    }
    if (username.length < 3) {
      setErrorUsername('Mínimo 3 caracteres')
    } else if (username.length > 30) {
      setErrorUsername('Máximo 30 caracteres')
    } else if (!/^[a-z0-9_]+$/.test(username)) {
      setErrorUsername('Solo letras minúsculas, números y _')
    } else if (usernameDisponible === false) {
      setErrorUsername('Este seudónimo ya está en uso')
    } else {
      setErrorUsername(null)
    }
  }, [username, usernameDisponible])

  /* ── Manejo de archivo de avatar ────────────────────────────────────── */
  const handleAvatar = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!MIME_PERMITIDOS.includes(file.type)) {
      setErrorAvatar('Solo se permiten imágenes JPEG, PNG, WebP o GIF')
      return
    }

    // Validar tamaño
    if (file.size > MAX_AVATAR_SIZE) {
      setErrorAvatar('La imagen no debe superar 2MB')
      return
    }

    setErrorAvatar(null)
    setArchivoAvatar(file)

    // Generar preview
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewAvatar(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const eliminarAvatar = useCallback(() => {
    setArchivoAvatar(null)
    setPreviewAvatar(null)
    setErrorAvatar(null)
    if (inputFileRef.current) inputFileRef.current.value = ''
  }, [])

  /* ── Guardar perfil ─────────────────────────────────────────────────── */
  const guardar = useCallback(async () => {
    // Validaciones finales
    if (!REGEX_USERNAME.test(username)) {
      setErrorUsername('Seudónimo inválido')
      return
    }
    if (usernameDisponible === false) {
      setErrorUsername('Este seudónimo ya está en uso')
      return
    }

    setGuardando(true)
    setErrorGeneral(null)

    try {
      let avatarUrl: string | null = null

      // 1. Subir avatar a Storage si hay archivo
      if (archivoAvatar) {
        const ext = archivoAvatar.name.split('.').pop() ?? 'jpg'
        const ruta = `${userId}/avatar.${ext}`

        const { error: errorUpload } = await supabase.storage
          .from('avatares')
          .upload(ruta, archivoAvatar, {
            cacheControl: '3600',
            upsert: true,
          })

        if (errorUpload) {
          throw new Error(`Error al subir avatar: ${errorUpload.message}`)
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('avatares')
          .getPublicUrl(ruta)

        avatarUrl = publicUrl
      }

      // 2. Actualizar perfil en la base de datos
      const actualizacion: Record<string, string | null> = {
        nombre_usuario: username,
      }

      if (nombreCompleto.trim()) {
        actualizacion.nombre_completo = nombreCompleto.trim()
      }

      if (avatarUrl) {
        actualizacion.avatar_url = avatarUrl
      }

      const { error: errorUpdate } = await supabase
        .from('perfiles')
        .update(actualizacion)
        .eq('id', userId)

      if (errorUpdate) {
        throw new Error(`Error al actualizar perfil: ${errorUpdate.message}`)
      }

      // 3. Completar onboarding
      alCompletar()
    } catch (e) {
      setErrorGeneral(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setGuardando(false)
    }
  }, [username, usernameDisponible, archivoAvatar, nombreCompleto, userId, supabase, alCompletar])

  /* ── Formulario válido ──────────────────────────────────────────────── */
  const formularioValido =
    REGEX_USERNAME.test(username) &&
    usernameDisponible === true &&
    !errorUsername &&
    !errorAvatar &&
    !guardando

  /* ── Iniciales para preview ─────────────────────────────────────────── */
  const iniciales = username
    ? username.slice(0, 2).toUpperCase()
    : emailUsuario.slice(0, 2).toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">Bienvenido a NexoLibre</h2>
          <p className="mt-1 text-sm text-muted">
            Elige un seudónimo para identificarte de forma segura
          </p>
        </div>

        {/* ── Avatar ───────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => inputFileRef.current?.click()}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface-elevated transition-all hover:border-accent"
          >
            {previewAvatar ? (
              <img
                src={previewAvatar}
                alt="Preview avatar"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-muted group-hover:text-accent transition-colors">
                {iniciales}
              </span>
            )}
            {/* Overlay de hover */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
          </button>

          <input
            ref={inputFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatar}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Foto de perfil</span>
            {previewAvatar && (
              <button
                type="button"
                onClick={eliminarAvatar}
                className="text-xs text-destructive hover:underline"
              >
                Eliminar
              </button>
            )}
          </div>

          {errorAvatar && (
            <p className="text-xs text-destructive">{errorAvatar}</p>
          )}
        </div>

        {/* ── Formulario ───────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="onboarding-username" className="mb-1.5 block text-xs font-medium text-foreground-secondary">
              Seudónimo <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">@</span>
              <input
                id="onboarding-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="tu_seudonimo"
                maxLength={30}
                autoComplete="off"
                spellCheck={false}
                className={`w-full rounded-xl border bg-background py-2.5 pl-8 pr-10 text-sm text-foreground placeholder:text-muted outline-none transition-colors ${
                  errorUsername
                    ? 'border-destructive focus:border-destructive'
                    : usernameDisponible === true && username.length >= 3
                      ? 'border-success focus:border-success'
                      : 'border-border focus:border-accent'
                }`}
              />
              {/* Indicador de estado */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {verificandoUsername ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                ) : usernameDisponible === true && username.length >= 3 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : errorUsername ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : null}
              </div>
            </div>
            {errorUsername && (
              <p className="mt-1 text-xs text-destructive">{errorUsername}</p>
            )}
            {usernameDisponible === true && username.length >= 3 && !errorUsername && (
              <p className="mt-1 text-xs text-success">Disponible</p>
            )}
          </div>

          {/* Nombre completo (opcional) */}
          <div>
            <label htmlFor="onboarding-nombre" className="mb-1.5 block text-xs font-medium text-foreground-secondary">
              Nombre completo <span className="text-muted">(opcional)</span>
            </label>
            <input
              id="onboarding-nombre"
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Tu nombre real"
              maxLength={100}
              className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>

        {/* ── Error general ────────────────────────────────────────── */}
        {errorGeneral && (
          <div className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorGeneral}
          </div>
        )}

        {/* ── Botón de confirmar ───────────────────────────────────── */}
        <button
          type="button"
          onClick={guardar}
          disabled={!formularioValido}
          className="mt-6 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {guardando ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
              Guardando…
            </span>
          ) : (
            'Comenzar'
          )}
        </button>

        {/* ── Nota legal ───────────────────────────────────────────── */}
        <p className="mt-3 text-center text-[10px] text-muted leading-relaxed">
          Tu seudónimo será visible para otros usuarios.
          Puedes cambiarlo más adelante en Ajustes.
        </p>
      </div>
    </div>
  )
}
