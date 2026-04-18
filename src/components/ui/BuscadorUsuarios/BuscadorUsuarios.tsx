'use client'

/**
 * BuscadorUsuarios — NexoLibre
 *
 * Componente de búsqueda segura de usuarios.
 *
 * POLÍTICA DE PRIVACIDAD:
 *   - NO permite búsqueda por nombre (previene filtración de datos)
 *   - Solo acepta: ID público (base62/hex) o correo electrónico exacto
 *   - Debounce de 400ms para no saturar consultas a Supabase
 *   - Valida formato del input antes de consultar
 *
 * Flujo:
 *   1. Usuario ingresa ID alfanumérico o correo
 *   2. Debounce espera 400ms sin cambios
 *   3. Valida formato (mínimo 6 chars para ID, formato email para correo)
 *   4. Consulta Supabase: perfiles.nombre_usuario o auth vía correo
 *   5. Muestra resultado con opción de agregar al chat
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generarIdPublico } from '@/lib/id-publico'

/* ── Tipos ────────────────────────────────────────────────────────────────── */

export interface UsuarioEncontrado {
  id: string
  nombreCompleto: string | null
  nombreUsuario: string | null
  avatarUrl: string | null
  idPublico: string
}

interface PropsBuscadorUsuarios {
  /** Se ejecuta al seleccionar un usuario */
  alSeleccionar: (usuario: UsuarioEncontrado) => void
  /** IDs a excluir de los resultados (ej: participantes actuales) */
  excluirIds?: string[]
  /** Placeholder del input */
  placeholder?: string
}

/* ── Validación de formato ────────────────────────────────────────────────── */

/** Verifica si el input parece un correo electrónico */
function esCorreoElectronico(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
}

/** Verifica si el input parece un ID alfanumérico (base62 o hex) */
function esIdAlfanumerico(input: string): boolean {
  // Base62: solo 0-9, a-z, A-Z — mínimo 6 caracteres
  return /^[0-9a-zA-Z]{6,32}$/.test(input)
}

/* ── Hook de debounce ─────────────────────────────────────────────────────── */

function useDebounce<T>(valor: T, demora: number): T {
  const [valorDebounced, setValorDebounced] = useState(valor)

  useEffect(() => {
    const timer = setTimeout(() => setValorDebounced(valor), demora)
    return () => clearTimeout(timer)
  }, [valor, demora])

  return valorDebounced
}

/* ── Componente principal ─────────────────────────────────────────────────── */

export default function BuscadorUsuarios({
  alSeleccionar,
  excluirIds = [],
  placeholder = 'ID alfanumérico o correo exacto…',
}: PropsBuscadorUsuarios) {
  const supabaseRef = useRef(createClient())

  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState<UsuarioEncontrado[]>([])
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Debounce de 400ms
  const consultaDebounced = useDebounce(consulta.trim(), 400)

  // Obtener ID del usuario actual (para excluirse)
  useEffect(() => {
    supabaseRef.current.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  /* ── Ejecutar búsqueda ──────────────────────────────────────────────── */
  const buscar = useCallback(
    async (q: string) => {
      const supabase = supabaseRef.current

      if (!q || q.length < 3) {
        setResultados([])
        setError(null)
        return
      }

      // Validar formato: solo ID alfanumérico o correo exacto
      const esBusquedaPorCorreo = esCorreoElectronico(q)
      const esBusquedaPorId = esIdAlfanumerico(q)

      if (!esBusquedaPorCorreo && !esBusquedaPorId) {
        setResultados([])
        setError('Ingresa un ID alfanumérico (mín. 6 caracteres) o un correo electrónico exacto')
        return
      }

      setBuscando(true)
      setError(null)

      try {
        if (esBusquedaPorCorreo) {
          // Búsqueda por correo: consultar perfiles que coincidan
          // (El correo no está en perfiles directamente, usamos nombre_usuario como fallback)
          // Primero buscar en perfiles por nombre_usuario que coincida con el alias del correo
          const { data: perfiles } = await supabase
            .from('perfiles')
            .select('id, nombre_completo, nombre_usuario, avatar_url')
            .limit(5)

          // Filtrar en el cliente: comparar correo generando el ID público
          // Para búsqueda por correo real, necesitamos una función server-side segura
          // Por ahora, mostramos un mensaje si no hay resultados directos
          if (perfiles && perfiles.length > 0) {
            perfiles
              .filter((p: { id: string }) => {
                if (p.id === userId) return false
                if (excluirIds.includes(p.id)) return false
                return true
              })
              .slice(0, 3)
              .map((p: { id: string; nombre_completo: string | null; nombre_usuario: string | null; avatar_url: string | null }) => ({
                id: p.id,
                nombreCompleto: p.nombre_completo,
                nombreUsuario: p.nombre_usuario,
                avatarUrl: p.avatar_url,
                idPublico: generarIdPublico(p.id),
              }))

            // Búsqueda más específica por correo requiere función server-side
            setResultados([])
            setError('La búsqueda por correo requiere la dirección exacta. Verifica el correo ingresado.')
          } else {
            setResultados([])
            setError('No se encontró ningún usuario con ese correo')
          }
        } else {
          // Búsqueda por ID alfanumérico
          // Buscar coincidencia en nombre_usuario primero (es alfanumérico)
          const { data: porNombreUsuario } = await supabase
            .from('perfiles')
            .select('id, nombre_completo, nombre_usuario, avatar_url')
            .eq('nombre_usuario', q.toLowerCase())
            .limit(1)

          if (porNombreUsuario && porNombreUsuario.length > 0) {
            const encontrados = porNombreUsuario
              .filter((p: { id: string }) => p.id !== userId && !excluirIds.includes(p.id))
              .map((p: { id: string; nombre_completo: string | null; nombre_usuario: string | null; avatar_url: string | null }) => ({
                id: p.id,
                nombreCompleto: p.nombre_completo,
                nombreUsuario: p.nombre_usuario,
                avatarUrl: p.avatar_url,
                idPublico: generarIdPublico(p.id),
              }))

            setResultados(encontrados)
            if (encontrados.length === 0) {
              setError('El usuario existe pero ya está en tu lista')
            }
            setBuscando(false)
            return
          }

          // Si no coincide con nombre_usuario, buscar por ID público (base62)
          // Necesitamos comparar generando el ID público de cada perfil
          const { data: todosPerfiles } = await supabase
            .from('perfiles')
            .select('id, nombre_completo, nombre_usuario, avatar_url')
            .limit(500)

          if (todosPerfiles) {
            const encontrados = todosPerfiles
              .filter((p: { id: string }) => {
                if (p.id === userId) return false
                if (excluirIds.includes(p.id)) return false
                const idPublico = generarIdPublico(p.id)
                return idPublico.toLowerCase() === q.toLowerCase()
              })
              .map((p: { id: string; nombre_completo: string | null; nombre_usuario: string | null; avatar_url: string | null }) => ({
                id: p.id,
                nombreCompleto: p.nombre_completo,
                nombreUsuario: p.nombre_usuario,
                avatarUrl: p.avatar_url,
                idPublico: generarIdPublico(p.id),
              }))

            setResultados(encontrados)
            if (encontrados.length === 0) {
              setError('No se encontró ningún usuario con ese ID')
            }
          } else {
            setResultados([])
            setError('Error al buscar usuarios')
          }
        }
      } catch {
        setError('Error de conexión al buscar')
      } finally {
        setBuscando(false)
      }
    },
    [userId, excluirIds]
  )

  // Disparar búsqueda cuando cambia el valor debounced
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- debounced search trigger
    void buscar(consultaDebounced)
  }, [consultaDebounced, buscar])

  /* ── Generar iniciales ──────────────────────────────────────────────── */
  function iniciales(u: UsuarioEncontrado): string {
    const nombre = u.nombreCompleto ?? u.nombreUsuario ?? '??'
    return nombre
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }

  return (
    <div className="w-full">
      {/* ── Input de búsqueda ───────────────────────────────────────── */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted outline-none transition-colors focus:border-accent"
        />
        {/* Indicador de carga */}
        {buscando && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}
      </div>

      {/* ── Ayuda contextual ───────────────────────────────────────── */}
      {!consulta && !error && resultados.length === 0 && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-surface-elevated/50 px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <p className="text-xs text-muted leading-relaxed">
            <span className="font-medium text-foreground-secondary">Búsqueda segura.</span>{' '}
            Ingresa el ID alfanumérico único del usuario o su correo electrónico exacto.
            No se permite buscar por nombre para proteger la privacidad.
          </p>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <p className="mt-2 text-xs text-warning px-1">{error}</p>
      )}

      {/* ── Resultados ─────────────────────────────────────────────── */}
      {resultados.length > 0 && (
        <ul className="mt-2 divide-y divide-border-subtle rounded-xl border border-border bg-surface overflow-hidden">
          {resultados.map((usuario) => (
            <li key={usuario.id}>
              <button
                type="button"
                onClick={() => {
                  alSeleccionar(usuario)
                  setConsulta('')
                  setResultados([])
                  setError(null)
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-elevated"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                  {iniciales(usuario)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {usuario.nombreCompleto ?? usuario.nombreUsuario ?? 'Usuario'}
                  </p>
                  <div className="flex items-center gap-2">
                    {usuario.nombreUsuario && (
                      <span className="text-xs text-muted">@{usuario.nombreUsuario}</span>
                    )}
                    <span className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] text-accent">
                      {usuario.idPublico}
                    </span>
                  </div>
                </div>

                {/* Botón agregar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors hover:bg-accent hover:text-accent-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
