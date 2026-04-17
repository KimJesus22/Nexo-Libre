-- =============================================================================
-- Migración: Bucket de Storage para avatares de usuario
-- Proyecto: NexoLibre
-- Fecha:    2026-04-17
-- =============================================================================
-- IDEMPOTENTE: seguro de ejecutar múltiples veces.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Crear bucket público para avatares
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatares',
  'avatares',
  true,
  2097152,  -- 2MB máximo
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Políticas RLS para avatares
-- ─────────────────────────────────────────────────────────────────────────────

-- SELECT: cualquier usuario autenticado puede ver avatares (bucket público)
drop policy if exists "avatares_select_publico" on storage.objects;
create policy "avatares_select_publico"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'avatares');

-- INSERT: cada usuario solo puede subir a su propia carpeta (userId/*)
drop policy if exists "avatares_insert_propietario" on storage.objects;
create policy "avatares_insert_propietario"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatares'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- UPDATE: cada usuario solo puede actualizar sus propios avatares
drop policy if exists "avatares_update_propietario" on storage.objects;
create policy "avatares_update_propietario"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatares'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- DELETE: cada usuario solo puede eliminar sus propios avatares
drop policy if exists "avatares_delete_propietario" on storage.objects;
create policy "avatares_delete_propietario"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatares'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
