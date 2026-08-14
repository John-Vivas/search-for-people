-- ============================================================================
-- Endurece set_case_status: ahora exige el PIN de moderación.
--
-- El PIN NO se guarda en el repo: vive en una tabla privada (app_config) que
-- solo pueden leer las funciones SECURITY DEFINER. Así, aunque alguien llame la
-- API directo, sin el PIN correcto la operación se rechaza ("No autorizado").
--
-- ⚠️ Tras correr esto hay que guardar el secreto (ver el INSERT al final,
--    que se ejecuta aparte con tu clave real).
-- ============================================================================

-- Config interna (clave/valor). RLS activo y SIN políticas => inaccesible para
-- anon/authenticated; solo las funciones SECURITY DEFINER (owner) la leen.
create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;

-- Reemplaza la versión de 3 parámetros por una que exige el PIN.
drop function if exists public.set_case_status(uuid, text, text);

create or replace function public.set_case_status(
  p_id uuid,
  p_kind text,
  p_status text,
  p_pin text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  select value into v_secret from public.app_config where key = 'moderation_secret';
  if v_secret is null or p_pin is distinct from v_secret then
    raise exception 'No autorizado';
  end if;

  if p_kind = 'person' then
    update public.persons
      set status = p_status::public.person_status, updated_at = now()
    where id = p_id;
  elsif p_kind = 'pet' then
    update public.pets
      set status = p_status::public.pet_status, updated_at = now()
    where id = p_id;
  else
    raise exception 'Tipo de caso inválido: %', p_kind;
  end if;
end;
$$;

grant execute on function public.set_case_status(uuid, text, text, text) to anon, authenticated;

-- ⚠️ CORRER APARTE (no en el repo) con tu clave real — debe coincidir con
-- VITE_ADMIN_PIN del front:
--
--   insert into public.app_config (key, value)
--   values ('moderation_secret', 'TU_CLAVE')
--   on conflict (key) do update set value = excluded.value, updated_at = now();
