-- ============================================================================
-- Cambiar el estado de un caso (persona o mascota) desde el panel de moderación.
-- Ej: marcar una persona MISSING -> FOUND/REUNITED, o una mascota LOST -> FOUND.
--
-- Va por RPC SECURITY DEFINER porque las escrituras a persons/pets están
-- restringidas por RLS. El cast a los enums valida el estado (falla si no existe).
-- ============================================================================

create or replace function public.set_case_status(
  p_id uuid,
  p_kind text,     -- 'person' | 'pet'
  p_status text    -- person_status o pet_status según el tipo
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind = 'person' then
    update public.persons
      set status = p_status::public.person_status,
          updated_at = now()
    where id = p_id;
  elsif p_kind = 'pet' then
    update public.pets
      set status = p_status::public.pet_status,
          updated_at = now()
    where id = p_id;
  else
    raise exception 'Tipo de caso inválido: %', p_kind;
  end if;
end;
$$;

grant execute on function public.set_case_status(uuid, text, text) to anon, authenticated;
