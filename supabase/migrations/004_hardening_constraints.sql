-- =============================================================================
-- Migración: Hardening de CHECK constraints y RLS
-- Proyecto: NexoLibre
-- Fecha:    2026-04-17
-- =============================================================================
-- IDEMPOTENTE: seguro de ejecutar múltiples veces.
--
-- Esta migración añade validaciones a nivel de base de datos que actúan
-- como última línea de defensa, independientemente del frontend o la API.
--
-- Principio: "La base de datos es la última puerta. Si Zod falla, si el
-- frontend se manipula, si alguien usa curl directamente, PostgreSQL RECHAZA."
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. MENSAJES: constraints anti-inyección HTML
-- ─────────────────────────────────────────────────────────────────────────────
-- Las constraints existentes (contenido_no_vacio, contenido_longitud) ya
-- cubren vacíos y longitud máxima. Añadimos detección de HTML peligroso.

-- Rechazar etiquetas <script>, <iframe>, <object>, <embed> en el contenido.
-- Esto complementa la validación Zod del frontend con una barrera nativa PG.
alter table public.mensajes
  drop constraint if exists contenido_sin_html_peligroso;

alter table public.mensajes
  add constraint contenido_sin_html_peligroso
    check (
      contenido !~* '<\s*/?\s*(script|iframe|object|embed)\b'
    );

comment on constraint contenido_sin_html_peligroso on public.mensajes is
  'Rechaza nativamente mensajes que contengan etiquetas HTML peligrosas (<script>, <iframe>, <object>, <embed>).';


-- Rechazar atributos de ejecución inline (onerror=, onclick=, onload=, etc.)
alter table public.mensajes
  drop constraint if exists contenido_sin_event_handlers;

alter table public.mensajes
  add constraint contenido_sin_event_handlers
    check (
      contenido !~* '\bon\w+\s*='
    );

comment on constraint contenido_sin_event_handlers on public.mensajes is
  'Rechaza nativamente mensajes con atributos de ejecución JS inline (onerror=, onclick=, etc.).';


-- Rechazar URIs javascript: y data:text/html
alter table public.mensajes
  drop constraint if exists contenido_sin_uri_peligrosa;

alter table public.mensajes
  add constraint contenido_sin_uri_peligrosa
    check (
      contenido !~* '(javascript|data)\s*:'
    );

comment on constraint contenido_sin_uri_peligrosa on public.mensajes is
  'Rechaza nativamente mensajes con URIs peligrosas (javascript:, data:).';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PERFILES: constraints anti-inyección para campos de texto libre
-- ─────────────────────────────────────────────────────────────────────────────

-- nombre_completo: rechazar HTML peligroso
alter table public.perfiles
  drop constraint if exists nombre_completo_sin_html;

alter table public.perfiles
  add constraint nombre_completo_sin_html
    check (
      nombre_completo is null
      or nombre_completo !~* '<\s*/?\s*(script|iframe|object|embed)\b'
    );

-- biografia: rechazar HTML peligroso
alter table public.perfiles
  drop constraint if exists biografia_sin_html;

alter table public.perfiles
  add constraint biografia_sin_html
    check (
      biografia is null
      or biografia !~* '<\s*/?\s*(script|iframe|object|embed)\b'
    );

-- biografia: rechazar URIs peligrosas
alter table public.perfiles
  drop constraint if exists biografia_sin_uri_peligrosa;

alter table public.perfiles
  add constraint biografia_sin_uri_peligrosa
    check (
      biografia is null
      or biografia !~* '(javascript|data)\s*:'
    );


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CHATS: constraints adicionales para nombre de grupo
-- ─────────────────────────────────────────────────────────────────────────────

-- nombre de chat: rechazar HTML peligroso
alter table public.chats
  drop constraint if exists nombre_chat_sin_html;

alter table public.chats
  add constraint nombre_chat_sin_html
    check (
      nombre is null
      or nombre !~* '<\s*/?\s*(script|iframe|object|embed)\b'
    );


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. MENSAJES RLS: añadir política restrictiva que valide contenido no vacío
-- ─────────────────────────────────────────────────────────────────────────────
-- Refuerza la constraint CHECK a nivel de RLS para que el error sea más
-- claro y no exponga detalles internos de la DB.

drop policy if exists "mensajes_insert_contenido_valido" on public.mensajes;

create policy "mensajes_insert_contenido_valido"
  on public.mensajes
  as restrictive
  for insert
  to authenticated
  with check (
    -- Contenido no puede ser null, vacío o solo whitespace
    contenido is not null
    and char_length(trim(contenido)) > 0
    and char_length(contenido) <= 5000
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PERFILES RLS: restringir campos que el usuario puede actualizar
-- ─────────────────────────────────────────────────────────────────────────────
-- Refuerza que el usuario no pueda modificar campos sensibles como
-- creado_en o id, aunque ya están protegidos por GRANT UPDATE (columnas).

drop policy if exists "perfiles_update_campos_seguros" on public.perfiles;

create policy "perfiles_update_campos_seguros"
  on public.perfiles
  as restrictive
  for update
  to authenticated
  with check (
    -- Solo el propietario puede actualizar
    (select auth.uid()) = id
    -- Verificar que nombre_usuario no sea vacío si se proporciona
    and (
      nombre_usuario is null
      or char_length(trim(nombre_usuario)) >= 3
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Revocar permisos de anon en TODAS las tablas del sistema
-- ─────────────────────────────────────────────────────────────────────────────
-- Defensa en profundidad: aunque RLS bloquea anon, revocar permisos
-- explícitamente previene errores de configuración futuros.

revoke all on public.perfiles from anon;
revoke all on public.chats from anon;
revoke all on public.participantes_chat from anon;
revoke all on public.mensajes from anon;

-- Revocar acceso al esquema privado (doble seguridad)
revoke all on schema privado from anon;
revoke all on schema privado from authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Auditoría: verificar que RLS está FORZADO en todas las tablas
-- ─────────────────────────────────────────────────────────────────────────────
-- FORCE asegura que RLS aplica incluso para el owner de la tabla.

alter table public.perfiles force row level security;
alter table public.chats force row level security;
alter table public.participantes_chat force row level security;
alter table public.mensajes force row level security;
