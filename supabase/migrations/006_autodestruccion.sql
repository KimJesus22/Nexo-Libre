-- =============================================================================
-- Migración: Mensajes efímeros y autodestrucción (pg_cron)
-- Proyecto: NexoLibre
-- Fecha:    2026-04-17
-- =============================================================================
-- IDEMPOTENTE: seguro de ejecutar múltiples veces.
--
-- 1. Añadir columna `expira_en` a `mensajes`
-- 2. Crear extensión `pg_cron` si no existe
-- 3. Programar un cron job para limpiar mensajes expirados cada minuto
-- =============================================================================

-- 1. Añadir columna a mensajes
alter table public.mensajes
  add column if not exists expira_en timestamptz;

-- 2. Habilitar extensión pg_cron
-- Nota: En Supabase, la extensión pg_cron ya suele estar disponible por defecto.
create extension if not exists pg_cron with schema extensions;

-- 3. Crear el job de limpieza (ejecutar cada minuto)
-- Primero borramos el job si existe para que sea idempotente
select cron.unschedule('autodestruccion_mensajes')
where exists (
  select 1 from cron.job where jobname = 'autodestruccion_mensajes'
);

-- Programar eliminación física de mensajes que superaron su tiempo de vida
select cron.schedule(
  'autodestruccion_mensajes',
  '* * * * *', -- Cada minuto
  $$
    delete from public.mensajes
    where expira_en is not null
      and expira_en <= now();
  $$
);
