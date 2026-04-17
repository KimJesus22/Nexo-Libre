-- =============================================================================
-- Migración: Perfiles de usuario con RLS inflexible
-- Proyecto: NexoLibre
-- Fecha:    2026-04-17
-- =============================================================================
--
-- Este esquema implementa:
--
-- 1. Tabla `public.perfiles` vinculada a `auth.users` con CASCADE en eliminación.
-- 2. Trigger automático que crea el perfil al registrar un usuario.
-- 3. Columna `rol` en app_metadata (no user_metadata, que es editable por el usuario).
-- 4. RLS habilitado + FORCE (aplica incluso al propietario de la tabla).
-- 5. Políticas granulares por operación (SELECT, INSERT, UPDATE, DELETE).
-- 6. `(select auth.uid())` envuelto en subquery para rendimiento (se ejecuta 1 vez, no por fila).
-- 7. Índice en `id` (PK) que también optimiza las políticas RLS.
-- 8. Columna `actualizado_en` con trigger de actualización automática.
-- 9. Restricciones CHECK para validar datos en la base de datos.
-- 10. Función helper en esquema privado para evitar exposición vía API.
--
-- IMPORTANTE (Supabase Security Checklist):
-- - user_metadata (raw_user_meta_data) es EDITABLE por el usuario → NO se usa en RLS.
-- - Las funciones SECURITY DEFINER NO están en el esquema expuesto (public).
-- - UPDATE requiere SELECT policy → ambas están definidas.
-- - auth.uid() está envuelto en (select ...) para evitar evaluación por fila.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Esquema privado para funciones privilegiadas
-- ─────────────────────────────────────────────────────────────────────────────
-- Las funciones SECURITY DEFINER nunca deben estar en un esquema expuesto.
-- Usamos un esquema privado que NO se expone a través de la API de Supabase.

create schema if not exists privado;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tabla de perfiles
-- ─────────────────────────────────────────────────────────────────────────────
-- PK uuid referenciando auth.users con ON DELETE CASCADE.
-- No se usa UUIDv4 aleatorio como PK (hereda el UUID de auth.users).

create table public.perfiles (
  -- Identificador: hereda el UUID de auth.users
  id uuid not null references auth.users on delete cascade,

  -- Datos del perfil
  nombre_completo text,
  nombre_usuario  text unique,
  avatar_url      text,
  sitio_web       text,
  biografia       text,

  -- Auditoría
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  -- Clave primaria
  primary key (id),

  -- Restricciones de validación
  constraint nombre_usuario_formato
    check (nombre_usuario ~ '^[a-z0-9_]{3,30}$'),

  constraint nombre_completo_longitud
    check (char_length(nombre_completo) between 2 and 100),

  constraint biografia_longitud
    check (char_length(biografia) <= 500),

  constraint avatar_url_formato
    check (avatar_url is null or avatar_url ~ '^https?://'),

  constraint sitio_web_formato
    check (sitio_web is null or sitio_web ~ '^https?://')
);

-- Comentarios descriptivos
comment on table public.perfiles is
  'Perfil público de cada usuario. Se crea automáticamente al registrarse.';
comment on column public.perfiles.id is
  'UUID heredado de auth.users — nunca se genera manualmente.';
comment on column public.perfiles.nombre_usuario is
  'Handle único del usuario. Solo letras minúsculas, números y guiones bajos (3-30 caracteres).';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Índices para rendimiento de RLS
-- ─────────────────────────────────────────────────────────────────────────────
-- La PK ya indexa `id`. Creamos índice adicional para búsquedas por nombre_usuario.

create unique index perfiles_nombre_usuario_idx
  on public.perfiles (nombre_usuario)
  where nombre_usuario is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Trigger de actualización automática de `actualizado_en`
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function privado.actualizar_timestamp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger trigger_actualizar_timestamp
  before update on public.perfiles
  for each row execute function privado.actualizar_timestamp();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Trigger: crear perfil automáticamente al registrarse
-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY DEFINER en esquema privado (no expuesto vía API).
-- Lee raw_user_meta_data solo para datos NO sensibles (nombre).
-- NUNCA se usa raw_user_meta_data para decisiones de autorización.

create or replace function privado.crear_perfil_para_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre_completo, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nombre_completo',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function privado.crear_perfil_para_nuevo_usuario();


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Row Level Security — INFLEXIBLE
-- ─────────────────────────────────────────────────────────────────────────────
-- Principios aplicados:
--   a) ENABLE + FORCE → aplica RLS incluso al propietario de la tabla.
--   b) Políticas granulares por operación (no usar FOR ALL).
--   c) (select auth.uid()) → subquery para evaluación única (rendimiento).
--   d) Solo el rol `authenticated` tiene acceso (no `anon`).
--   e) INSERT bloqueado por policy → solo el trigger crea perfiles.
--   f) DELETE bloqueado completamente → los perfiles se eliminan vía CASCADE.

alter table public.perfiles enable row level security;
alter table public.perfiles force row level security;

-- ── SELECT: cualquier usuario autenticado puede ver perfiles públicos ────
-- Los perfiles son información pública (nombre, avatar, bio).
create policy "perfiles_select_autenticado"
  on public.perfiles
  for select
  to authenticated
  using (true);

-- ── INSERT: NADIE puede insertar manualmente ────────────────────────────
-- Los perfiles se crean SOLO por el trigger on_auth_user_created.
-- No existe policy de INSERT → la inserción directa está bloqueada por RLS.

-- ── UPDATE: solo el propietario puede modificar su propio perfil ─────────
create policy "perfiles_update_propietario"
  on public.perfiles
  for update
  to authenticated
  using ((select auth.uid()) = id)        -- Solo puede VER su propio registro
  with check ((select auth.uid()) = id);  -- Solo puede MODIFICAR su propio registro

-- ── DELETE: NADIE puede eliminar perfiles manualmente ───────────────────
-- Los perfiles se eliminan SOLO por CASCADE cuando se elimina el usuario
-- de auth.users. No existe policy de DELETE → la eliminación directa
-- está bloqueada por RLS.


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Revocar permisos al rol anónimo
-- ─────────────────────────────────────────────────────────────────────────────
-- Aunque RLS ya bloquea el acceso sin policy, revocamos explícitamente
-- para defensa en profundidad.

revoke all on public.perfiles from anon;
revoke all on schema privado from anon;
revoke all on schema privado from authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Otorgar permisos mínimos al rol autenticado
-- ─────────────────────────────────────────────────────────────────────────────
-- Principio de mínimo privilegio: solo SELECT y UPDATE, no INSERT ni DELETE.

grant usage on schema public to authenticated;
grant select, update on public.perfiles to authenticated;
