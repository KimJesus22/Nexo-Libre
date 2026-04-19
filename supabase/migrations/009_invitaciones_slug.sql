-- Añadir columna slug a invitaciones
alter table public.invitaciones add column if not exists slug text unique;

-- Modificar funcion consumir_invitacion para aceptar token o slug
create or replace function privado.consumir_invitacion(p_token_or_slug text)
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
    where (token = p_token_or_slug or slug = p_token_or_slug)
      and not usado
      and caduca_en > now()
    returning creador_id into v_creador_id;

  return v_creador_id;
end;
$$;

-- Modificar RPC usar_invitacion para relajar la validacion
create or replace function public.usar_invitacion(p_token text)
returns json
language plpgsql
security invoker
as $$
declare
  v_creador_id uuid;
begin
  -- Validar que no este vacio o sea muy corto (acepta slug o token)
  if p_token is null or char_length(p_token) < 3 then
    return json_build_object('ok', false, 'error', 'Enlace inválido.');
  end if;

  -- Consumir invitación (atómico)
  v_creador_id := privado.consumir_invitacion(p_token);

  if v_creador_id is null then
    return json_build_object('ok', false, 'error', 'Invitación expirada, ya utilizada o no encontrada.');
  end if;

  return json_build_object('ok', true, 'creador_id', v_creador_id);
end;
$$;
