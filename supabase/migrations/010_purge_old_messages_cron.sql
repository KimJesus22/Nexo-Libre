-- =============================================================================
-- Migración: Programar purga automática de mensajes antiguos (pg_cron + pg_net)
-- Proyecto: NexoLibre
-- Fecha:    2026-05-03
-- =============================================================================
-- IDEMPOTENTE: seguro de ejecutar múltiples veces.
--
-- Arquitectura:
--   1. Habilita la extensión pg_net (HTTP desde Postgres)
--   2. Almacena la URL del proyecto y el service_role_key en Vault
--   3. Programa un cron job que invoca la Edge Function purge-old-messages
--      cada día a medianoche (00:00 UTC)
--
-- Seguridad:
--   - Las credenciales se almacenan cifradas en Supabase Vault
--   - La Edge Function usa service_role_key para bypass de RLS
--   - El cron job solo ejecuta dentro de la base de datos (no expuesto)
--
-- Requisitos previos:
--   - Edge Function `purge-old-messages` desplegada
--   - Extensión pg_cron habilitada (ver migración 006_autodestruccion.sql)
--   - Sustituir los placeholders antes de ejecutar:
--       • YOUR_PROJECT_URL    → https://tu-proyecto.supabase.co
--       • YOUR_SERVICE_ROLE_KEY → clave service_role del proyecto
-- =============================================================================


-- 1. Habilitar pg_net (peticiones HTTP desde Postgres)
-- En Supabase esta extensión está disponible pero debe activarse explícitamente.
create extension if not exists pg_net with schema extensions;


-- 2. Almacenar credenciales en Vault (cifradas en reposo)
-- ⚠️ IMPORTANTE: Reemplazar los placeholders antes de ejecutar.
-- Si ya existen secretos con estos nombres, se actualizarán.

-- Primero borrar los secretos si ya existen (idempotencia)
delete from vault.secrets where name = 'project_url';
delete from vault.secrets where name = 'service_role_key';

select vault.create_secret(
  'YOUR_PROJECT_URL',  -- ← Reemplazar con https://tu-proyecto.supabase.co
  'project_url'
);

select vault.create_secret(
  'YOUR_SERVICE_ROLE_KEY',  -- ← Reemplazar con tu clave service_role
  'service_role_key'
);


-- 3. Desactivar el job anterior si existe (idempotencia)
select cron.unschedule('purge_old_messages_daily')
where exists (
  select 1 from cron.job where jobname = 'purge_old_messages_daily'
);


-- 4. Programar la invocación diaria a medianoche UTC
-- Cron expression: '0 0 * * *' = minuto 0, hora 0, todos los días
select cron.schedule(
  'purge_old_messages_daily',
  '0 0 * * *',
  $$
    select net.http_post(
      url    := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
                || '/functions/v1/purge-old-messages',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer '
          || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body   := jsonb_build_object(
        'triggered_by', 'pg_cron',
        'scheduled_at', now()::text
      )
    ) as request_id;
  $$
);


-- 5. Verificación: listar el job creado
-- select * from cron.job where jobname = 'purge_old_messages_daily';
