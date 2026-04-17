-- =============================================================================
-- Migración: Perfiles de usuario con RLS inflexible + 2FA TOTP
-- Proyecto: NexoLibre
-- Fecha:    2026-04-17
-- =============================================================================
-- IDEMPOTENTE: seguro de ejecutar múltiples veces.
-- Usa IF NOT EXISTS, CREATE OR REPLACE, y DROP ... IF EXISTS.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Esquema privado para funciones privilegiadas
-- ─────────────────────────────────────────────────────────────────────────────
create schema if not exists privado;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tabla de perfiles
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.perfiles (
  id uuid not null references auth.users on delete cascade,
  nombre_completo text,
  nombre_usuario  text unique,
  avatar_url      text,
  sitio_web       text,
  biografia       text,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  primary key (id),

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

comment on table public.perfiles is
  'Perfil público de cada usuario. Se crea automáticamente al registrarse.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Índice para búsquedas por nombre_usuario
-- ─────────────────────────────────────────────────────────────────────────────
create unique index if not exists perfiles_nombre_usuario_idx
  on public.perfiles (nombre_usuario)
  where nombre_usuario is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Trigger: actualización automática de `actualizado_en`
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

drop trigger if exists trigger_actualizar_timestamp on public.perfiles;
create trigger trigger_actualizar_timestamp
  before update on public.perfiles
  for each row execute function privado.actualizar_timestamp();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Trigger: crear perfil al registrarse
-- ─────────────────────────────────────────────────────────────────────────────
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function privado.crear_perfil_para_nuevo_usuario();


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Row Level Security — INFLEXIBLE
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.perfiles enable row level security;
alter table public.perfiles force row level security;

-- Eliminar policies existentes para recrearlas limpiamente
drop policy if exists "perfiles_select_autenticado" on public.perfiles;
drop policy if exists "perfiles_update_propietario" on public.perfiles;
drop policy if exists "perfiles_requiere_2fa_si_activado" on public.perfiles;

-- SELECT: cualquier usuario autenticado puede ver perfiles públicos
create policy "perfiles_select_autenticado"
  on public.perfiles
  for select
  to authenticated
  using (true);

-- UPDATE: solo el propietario puede modificar su propio perfil
create policy "perfiles_update_propietario"
  on public.perfiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- INSERT: bloqueado (solo el trigger crea perfiles)
-- DELETE: bloqueado (solo CASCADE desde auth.users)


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Revocar permisos + mínimo privilegio
-- ─────────────────────────────────────────────────────────────────────────────
revoke all on public.perfiles from anon;
revoke all on schema privado from anon;
revoke all on schema privado from authenticated;

grant usage on schema public to authenticated;
grant select, update on public.perfiles to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Política RLS RESTRICTIVA para 2FA (TOTP) — opt-in
-- ─────────────────────────────────────────────────────────────────────────────
-- Si el usuario tiene factores TOTP verificados → exige aal2.
-- Si no tiene 2FA activado → acepta aal1 y aal2.

-- Función auxiliar (SECURITY DEFINER) para evitar "permission denied" en auth.mfa_factors
create or replace function public.tiene_mfa_verificado(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from auth.mfa_factors
    where user_id = p_user_id
      and status = 'verified'
  );
$$;

create policy "perfiles_requiere_2fa_si_activado"
  on public.perfiles
  as restrictive
  to authenticated
  using (
    not public.tiene_mfa_verificado((select auth.uid()))
    or
    array[(select auth.jwt()->>'aal')] <@ array['aal2']
  );
