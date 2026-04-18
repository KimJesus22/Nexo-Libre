-- Tabla para llevar el control de Rate Limiting por IP y Acción
create table if not exists public.rate_limits (
  action_key text not null,
  ip text not null,
  requests int default 1,
  reset_at timestamp with time zone not null,
  primary key (action_key, ip)
);

-- Habilitar RLS para que no sea accesible desde el cliente
alter table public.rate_limits enable row level security;

-- Función de seguridad (SECURITY DEFINER) para que las Server Actions puedan llamar a esto
-- y verificar/incrementar el rate limit atómicamente, sin necesidad de tener acceso directo a la tabla.
create or replace function public.check_rate_limit(
  p_action_key text,
  p_ip text,
  p_max_requests int,
  p_window_minutes int
) returns boolean
language plpgsql
security definer
as $$
declare
  v_current_requests int;
  v_reset_at timestamp with time zone;
begin
  -- Limpieza asíncrona pasiva: eliminar registros viejos para no engordar la tabla (10% de las veces para no afectar performance siempre)
  if random() < 0.1 then
    delete from public.rate_limits where reset_at < now();
  end if;

  -- Seleccionar estado actual
  select requests, reset_at into v_current_requests, v_reset_at
  from public.rate_limits
  where action_key = p_action_key and ip = p_ip;

  -- Si no existe, crear y permitir
  if not found then
    insert into public.rate_limits (action_key, ip, requests, reset_at)
    values (p_action_key, p_ip, 1, now() + (p_window_minutes || ' minutes')::interval);
    return true;
  end if;

  -- Si ya pasó el tiempo de reset, reiniciar contador
  if v_reset_at < now() then
    update public.rate_limits
    set requests = 1, reset_at = now() + (p_window_minutes || ' minutes')::interval
    where action_key = p_action_key and ip = p_ip;
    return true;
  end if;

  -- Si está dentro del periodo y no ha excedido el límite, incrementar
  if v_current_requests < p_max_requests then
    update public.rate_limits
    set requests = requests + 1
    where action_key = p_action_key and ip = p_ip;
    return true;
  end if;

  -- Ha excedido el límite
  return false;
end;
$$;
