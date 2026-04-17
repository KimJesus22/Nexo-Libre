-- =============================================================================
-- Migración: Sistema de invitaciones seguras
-- Proyecto: NexoLibre
-- Fecha:    2026-04-17
-- =============================================================================
-- IDEMPOTENTE: seguro de ejecutar múltiples veces.
--
-- Tabla `invitaciones`:
--   - Token criptográfico de 32 bytes (hex = 64 chars)
--   - Un solo uso: `usado` se marca como TRUE al consumir
--   - Caduca en 24 horas: `caduca_en` se compara con now()
--   - El creador debe ser un usuario autenticado
--   - RLS estricta: solo el creador puede ver sus invitaciones
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tabla: invitaciones
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.invitaciones (
  id           uuid primary key default gen_random_uuid(),
  creador_id   uuid not null references auth.users on delete cascade,
  token        text not null unique,
  usado        boolean not null default false,
  usado_por    uuid references auth.users on delete set null,
  caduca_en    timestamptz not null default (now() + interval '24 hours'),
  creado_en    timestamptz not null default now(),
  usado_en     timestamptz,

  -- Token: 64 caracteres hexadecimales exactos (32 bytes)
  constraint token_formato
    check (token ~ '^[a-f0-9]{64}$'),

  -- No puede estar usado sin registrar quién lo usó
  constraint uso_consistente
    check (not usado or (usado_por is not null and usado_en is not null))
);

comment on table public.invitaciones is
  'Invitaciones de un solo uso con token criptográfico y expiración de 24h.';

-- Índice para buscar invitaciones por token (la query más frecuente)
create unique index if not exists idx_invitaciones_token
  on public.invitaciones (token);

-- Índice para buscar invitaciones de un usuario
create index if not exists idx_invitaciones_creador
  on public.invitaciones (creador_id, creado_en desc);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Función: consumir invitación (SECURITY DEFINER en esquema privado)
-- ─────────────────────────────────────────────────────────────────────────────
-- Atómica: verifica validez + marca como usada en una sola transacción.
-- Retorna el ID del creador si éxito, NULL si falla.

create or replace function privado.consumir_invitacion(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creador_id uuid;
begin
  -- Intentar marcar como usada (atómico, sin race conditions)
  update public.invitaciones
    set usado = true,
        usado_por = (select auth.uid()),
        usado_en = now()
    where token = p_token
      and not usado
      and caduca_en > now()
    returning creador_id into v_creador_id;

  return v_creador_id;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RPC expuesta: wrapper seguro para consumir invitación
-- ─────────────────────────────────────────────────────────────────────────────
-- En esquema public para que la API REST pueda invocarla.
-- Solo valida el formato del token antes de delegar a la función privada.

create or replace function public.usar_invitacion(p_token text)
returns json
language plpgsql
security invoker
as $$
declare
  v_creador_id uuid;
begin
  -- Validar formato del token
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    return json_build_object('ok', false, 'error', 'Token inválido.');
  end if;

  -- Consumir invitación (atómico)
  v_creador_id := privado.consumir_invitacion(p_token);

  if v_creador_id is null then
    return json_build_object('ok', false, 'error', 'Invitación expirada, ya utilizada o no encontrada.');
  end if;

  return json_build_object('ok', true, 'creador_id', v_creador_id);
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.invitaciones enable row level security;
alter table public.invitaciones force row level security;

drop policy if exists "invitaciones_select_creador" on public.invitaciones;
drop policy if exists "invitaciones_insert_autenticado" on public.invitaciones;

-- SELECT: solo ver tus propias invitaciones
create policy "invitaciones_select_creador"
  on public.invitaciones
  for select
  to authenticated
  using ((select auth.uid()) = creador_id);

-- INSERT: solo como tú mismo
create policy "invitaciones_insert_autenticado"
  on public.invitaciones
  for insert
  to authenticated
  with check ((select auth.uid()) = creador_id);

-- UPDATE/DELETE: bloqueado desde el cliente.
-- Solo la función SECURITY DEFINER puede actualizar.


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Permisos mínimos
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on public.invitaciones from anon;
grant select, insert on public.invitaciones to authenticated;
-- No grant UPDATE: solo la función privada.consumir_invitacion puede hacer UPDATE.

-- Permitir invocar la RPC pública
grant execute on function public.usar_invitacion(text) to authenticated;
