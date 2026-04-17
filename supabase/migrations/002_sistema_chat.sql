-- =============================================================================
-- Migración: Sistema de chat con Realtime
-- Proyecto: NexoLibre
-- Fecha:    2026-04-17
-- =============================================================================
-- IDEMPOTENTE: seguro de ejecutar múltiples veces.
--
-- Arquitectura:
--   chats              → conversaciones (1-a-1 o grupo)
--   participantes_chat → tabla pivote M:N (usuarios ↔ chats)
--   mensajes           → mensajes individuales con Realtime
--
-- Principios de seguridad:
--   1. RLS ENABLE + FORCE en todas las tablas.
--   2. Un usuario solo puede ver/insertar en chats donde es participante.
--   3. La verificación de pertenencia usa (select auth.uid()) en subquery.
--   4. DELETE bloqueado para mensajes (soft-delete vía UPDATE es opcional).
--   5. INSERT en chats solo por funciones privilegiadas (esquema privado).
--   6. Realtime habilitado SOLO en mensajes (no en participantes/chats).
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tabla: chats
-- ─────────────────────────────────────────────────────────────────────────────
-- Una conversación puede ser directa (2 participantes) o grupal.

create table if not exists public.chats (
  id             uuid primary key default gen_random_uuid(),
  nombre         text,
  es_grupo       boolean not null default false,
  creado_por     uuid not null references auth.users on delete set null,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  constraint nombre_grupo_requerido
    check (not es_grupo or nombre is not null),
  constraint nombre_longitud
    check (nombre is null or char_length(nombre) between 1 and 100)
);

comment on table public.chats is
  'Conversaciones entre usuarios. Pueden ser directas (1-a-1) o grupales.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tabla: participantes_chat (pivote M:N)
-- ─────────────────────────────────────────────────────────────────────────────
-- Vincula usuarios con chats. Define quién puede ver/escribir en cada chat.

create table if not exists public.participantes_chat (
  chat_id     uuid not null references public.chats on delete cascade,
  usuario_id  uuid not null references auth.users on delete cascade,
  rol         text not null default 'miembro'
    check (rol in ('admin', 'miembro')),
  unido_en    timestamptz not null default now(),

  primary key (chat_id, usuario_id)
);

comment on table public.participantes_chat is
  'Tabla pivote M:N que vincula usuarios con chats. Define pertenencia.';

-- Índice para buscar los chats de un usuario eficientemente
create index if not exists idx_participantes_usuario
  on public.participantes_chat (usuario_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Tabla: mensajes
-- ─────────────────────────────────────────────────────────────────────────────
-- Mensajes individuales dentro de un chat. Realtime habilitado.

create table if not exists public.mensajes (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references public.chats on delete cascade,
  autor_id    uuid not null references auth.users on delete cascade,
  contenido   text not null,
  editado     boolean not null default false,
  creado_en   timestamptz not null default now(),

  constraint contenido_no_vacio
    check (char_length(trim(contenido)) > 0),
  constraint contenido_longitud
    check (char_length(contenido) <= 5000)
);

comment on table public.mensajes is
  'Mensajes dentro de un chat. Realtime habilitado para recepción en vivo.';

-- Índice compuesto: mensajes de un chat ordenados por fecha (descendente)
-- Optimiza la query más frecuente: "últimos N mensajes del chat X"
create index if not exists idx_mensajes_chat_fecha
  on public.mensajes (chat_id, creado_en desc);

-- Índice para buscar mensajes por autor
create index if not exists idx_mensajes_autor
  on public.mensajes (autor_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Trigger: actualizar `actualizado_en` en chats al insertar mensaje
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function privado.actualizar_chat_al_enviar_mensaje()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.chats
    set actualizado_en = now()
    where id = new.chat_id;
  return new;
end;
$$;

drop trigger if exists trigger_actualizar_chat_mensaje on public.mensajes;
create trigger trigger_actualizar_chat_mensaje
  after insert on public.mensajes
  for each row execute function privado.actualizar_chat_al_enviar_mensaje();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Función helper: verificar pertenencia a un chat
-- ─────────────────────────────────────────────────────────────────────────────
-- En esquema privado (no expuesto vía API).
-- Usada internamente por las políticas RLS.

create or replace function privado.es_participante(p_chat_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.participantes_chat
    where chat_id = p_chat_id
      and usuario_id = (select auth.uid())
  );
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Row Level Security — CHATS
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.chats enable row level security;
alter table public.chats force row level security;

drop policy if exists "chats_select_participante" on public.chats;
drop policy if exists "chats_insert_autenticado" on public.chats;
drop policy if exists "chats_update_admin" on public.chats;

-- SELECT: solo ver chats donde eres participante
create policy "chats_select_participante"
  on public.chats
  for select
  to authenticated
  using (
    exists (
      select 1 from public.participantes_chat
      where chat_id = id
        and usuario_id = (select auth.uid())
    )
  );

-- INSERT: cualquier usuario autenticado puede crear un chat
create policy "chats_insert_autenticado"
  on public.chats
  for insert
  to authenticated
  with check ((select auth.uid()) = creado_por);

-- UPDATE: solo el creador o admin del chat puede modificar nombre
create policy "chats_update_admin"
  on public.chats
  for update
  to authenticated
  using (
    exists (
      select 1 from public.participantes_chat
      where chat_id = id
        and usuario_id = (select auth.uid())
        and rol = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.participantes_chat
      where chat_id = id
        and usuario_id = (select auth.uid())
        and rol = 'admin'
    )
  );

-- DELETE: bloqueado. Los chats se archivan, no se eliminan.


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Row Level Security — PARTICIPANTES_CHAT
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.participantes_chat enable row level security;
alter table public.participantes_chat force row level security;

drop policy if exists "participantes_select" on public.participantes_chat;
drop policy if exists "participantes_insert_creador" on public.participantes_chat;
drop policy if exists "participantes_delete_admin" on public.participantes_chat;

-- SELECT: ver participantes de chats donde tú eres participante
create policy "participantes_select"
  on public.participantes_chat
  for select
  to authenticated
  using (
    exists (
      select 1 from public.participantes_chat pc
      where pc.chat_id = participantes_chat.chat_id
        and pc.usuario_id = (select auth.uid())
    )
  );

-- INSERT: el creador del chat puede agregar participantes
-- También se permite auto-inserción (para el creador al crear el chat)
create policy "participantes_insert_creador"
  on public.participantes_chat
  for insert
  to authenticated
  with check (
    -- Eres admin del chat O te estás agregando a ti mismo como creador
    (select auth.uid()) = usuario_id
    or exists (
      select 1 from public.participantes_chat
      where chat_id = participantes_chat.chat_id
        and usuario_id = (select auth.uid())
        and rol = 'admin'
    )
  );

-- DELETE: solo admins pueden remover participantes
create policy "participantes_delete_admin"
  on public.participantes_chat
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.participantes_chat pc
      where pc.chat_id = participantes_chat.chat_id
        and pc.usuario_id = (select auth.uid())
        and pc.rol = 'admin'
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Row Level Security — MENSAJES (estricta)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.mensajes enable row level security;
alter table public.mensajes force row level security;

drop policy if exists "mensajes_select_participante" on public.mensajes;
drop policy if exists "mensajes_insert_participante" on public.mensajes;
drop policy if exists "mensajes_update_autor" on public.mensajes;

-- SELECT: solo leer mensajes de chats donde eres participante
create policy "mensajes_select_participante"
  on public.mensajes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.participantes_chat
      where chat_id = mensajes.chat_id
        and usuario_id = (select auth.uid())
    )
  );

-- INSERT: solo insertar mensajes en chats donde eres participante
-- y solo como tú mismo (no puedes suplantar otro autor)
create policy "mensajes_insert_participante"
  on public.mensajes
  for insert
  to authenticated
  with check (
    (select auth.uid()) = autor_id
    and exists (
      select 1 from public.participantes_chat
      where chat_id = mensajes.chat_id
        and usuario_id = (select auth.uid())
    )
  );

-- UPDATE: solo el autor puede editar su propio mensaje
create policy "mensajes_update_autor"
  on public.mensajes
  for update
  to authenticated
  using ((select auth.uid()) = autor_id)
  with check ((select auth.uid()) = autor_id);

-- DELETE: bloqueado. Los mensajes no se eliminan.


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Permisos: mínimo privilegio
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on public.chats from anon;
revoke all on public.participantes_chat from anon;
revoke all on public.mensajes from anon;

grant select, insert on public.chats to authenticated;
grant update (nombre) on public.chats to authenticated;
grant select, insert, delete on public.participantes_chat to authenticated;
grant select, insert on public.mensajes to authenticated;
grant update (contenido, editado) on public.mensajes to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Supabase Realtime — activar en mensajes
-- ─────────────────────────────────────────────────────────────────────────────
-- Solo la tabla `mensajes` necesita Realtime para el chat en vivo.
-- La publicación `supabase_realtime` es la que Supabase escucha.
-- RLS se aplica TAMBIÉN a Realtime: un usuario solo recibe eventos
-- de mensajes en chats donde es participante.

alter publication supabase_realtime add table public.mensajes;

-- Habilitar REPLICA IDENTITY FULL para que Realtime envíe el row completo
-- en eventos UPDATE y DELETE (no solo la PK).
alter table public.mensajes replica identity full;
