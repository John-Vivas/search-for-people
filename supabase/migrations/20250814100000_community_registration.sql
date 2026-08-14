-- ============================================================================
-- Registro comunitario: zonas + centros (de atención y de acopio)
--
-- Permite que la gente registre, desde el mapa:
--   1. Zonas (departamento / ciudad / municipio) -> emergency_zones
--   2. Centros de atención (hospital, clínica, refugio...) -> facilities
--   3. Centros de acopio (recolección de ayuda) -> facilities con un nuevo
--      facility_type 'COLLECTION_POINT' (así comparten tabla y capa del mapa).
--
-- Los inserts van por RPC SECURITY DEFINER con deduplicación, para no depender
-- de políticas de INSERT abiertas y evitar duplicados. Las zonas/centros
-- creados por la comunidad quedan con code = null (los oficiales llevan código).
-- ============================================================================

-- 1) Nuevo tipo de centro: punto de acopio (recolección de ayuda)
alter type public.facility_type add value if not exists 'COLLECTION_POINT';

-- 2) RPC: registrar una zona comunitaria (idempotente por nombre + padre).
--    Los departamentos del árbol son sintéticos (id tipo "dept-...", no UUID),
--    así que se resuelve el departamento POR NOMBRE (find-or-create) cuando no
--    llega un parent_id UUID real. Así se mantiene la jerarquía sin romper el cast.
drop function if exists public.create_community_zone(
  text, public.zone_type, uuid, double precision, double precision
);

create or replace function public.create_community_zone(
  p_name text,
  p_type public.zone_type default 'CITY',
  p_parent_id uuid default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_department text default null
) returns public.emergency_zones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_dept text := nullif(trim(coalesce(p_department, '')), '');
  v_parent uuid := p_parent_id;
  v_zone public.emergency_zones;
  v_dept_zone public.emergency_zones;
begin
  if v_name = '' then
    raise exception 'El nombre de la zona no puede estar vacío';
  end if;

  -- Sin parent UUID pero con nombre de departamento → buscar/crear el depto.
  if v_parent is null and v_dept is not null then
    select * into v_dept_zone
    from public.emergency_zones
    where type = 'DEPARTMENT' and lower(name) = lower(v_dept) and is_active = true
    limit 1;

    if not found then
      insert into public.emergency_zones (name, type, country_code, is_active, department)
      values (v_dept, 'DEPARTMENT', 'CO', true, v_dept)
      returning * into v_dept_zone;
    end if;

    v_parent := v_dept_zone.id;
  end if;

  -- Dedup: misma zona (nombre normalizado) bajo el mismo padre y activa
  select * into v_zone
  from public.emergency_zones
  where lower(name) = lower(v_name)
    and coalesce(parent_id::text, '') = coalesce(v_parent::text, '')
    and is_active = true
  limit 1;

  if found then
    return v_zone;  -- ya existe: no duplicar, devolver la existente
  end if;

  insert into public.emergency_zones (
    name, type, parent_id, latitude, longitude, country_code, is_active,
    city, department
  )
  values (
    v_name, p_type, v_parent, p_latitude, p_longitude, 'CO', true,
    case when p_type in ('CITY', 'MUNICIPALITY', 'DISTRICT') then v_name else null end,
    v_dept
  )
  returning * into v_zone;

  return v_zone;
end;
$$;

-- 3) RPC: registrar un centro (atención o acopio), creando su ubicación si hay
--    coordenadas. Idempotente por nombre + zona.
create or replace function public.create_community_facility(
  p_name text,
  p_facility_type public.facility_type,
  p_zone_id uuid default null,
  p_address text default null,
  p_latitude double precision default null,
  p_longitude double precision default null
) returns public.facilities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_location_id uuid := null;
  v_facility public.facilities;
begin
  if v_name = '' then
    raise exception 'El nombre del centro no puede estar vacío';
  end if;

  -- Dedup por nombre + zona
  select * into v_facility
  from public.facilities
  where lower(name) = lower(v_name)
    and coalesce(zone_id::text, '') = coalesce(p_zone_id::text, '')
    and is_active = true
  limit 1;

  if found then
    return v_facility;
  end if;

  -- Punto exacto (opcional) en la tabla locations
  if p_latitude is not null and p_longitude is not null then
    insert into public.locations (zone_id, address, latitude, longitude)
    values (p_zone_id, nullif(trim(coalesce(p_address, '')), ''), p_latitude, p_longitude)
    returning id into v_location_id;
  end if;

  insert into public.facilities (
    zone_id, location_id, name, facility_type, address, is_active
  )
  values (
    p_zone_id, v_location_id, v_name, p_facility_type,
    nullif(trim(coalesce(p_address, '')), ''), true
  )
  returning * into v_facility;

  return v_facility;
end;
$$;

-- 4) Permisos: cualquiera (anónimo o autenticado) puede registrar
grant execute on function public.create_community_zone(
  text, public.zone_type, uuid, double precision, double precision
) to anon, authenticated;

grant execute on function public.create_community_facility(
  text, public.facility_type, uuid, text, double precision, double precision
) to anon, authenticated;
