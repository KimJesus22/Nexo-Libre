-- =============================================================================
-- Migración: Fix RLS MFA permissions
-- Proyecto: NexoLibre
-- Fecha:    2026-04-17
-- =============================================================================
-- IDEMPOTENTE: seguro de ejecutar múltiples veces.
--
-- El RLS de public.perfiles fallaba con "permission denied for table mfa_factors"
-- porque el rol authenticated no tiene permisos SELECT en auth.mfa_factors.
-- Se delega la verificación a una función SECURITY DEFINER en el esquema privado.
-- =============================================================================

-- 1. Crear función SECURITY DEFINER para chequear factores MFA
create or replace function privado.tiene_mfa_verificado(p_user_id uuid)
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

-- 2. Eliminar la política anterior
drop policy if exists "perfiles_requiere_2fa_si_activado" on public.perfiles;

-- 3. Crear la nueva política utilizando la función
create policy "perfiles_requiere_2fa_si_activado"
  on public.perfiles
  as restrictive
  to authenticated
  using (
    -- Si NO tiene MFA verificado, pasa directamente
    not privado.tiene_mfa_verificado((select auth.uid()))
    or
    -- Si TIENE MFA verificado, requiere aal2
    array[(select auth.jwt()->>'aal')] <@ array['aal2']
  );
