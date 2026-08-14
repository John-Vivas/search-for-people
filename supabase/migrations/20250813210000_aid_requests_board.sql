-- ============================================================
-- ESTAMOS BUSCANDO — Migration 20250813210000
-- Tablero de solicitudes de ayuda (aid requests) en tiempo real.
-- Cada solicitud tiene tipo de recurso, cantidad, urgencia y un
-- ciclo de vida: Abierta → Comprometida → En ruta → Entregada
-- (o Cancelada). Permisos abiertos (anon) via RPCs SECURITY DEFINER.
-- Realtime habilitado para actualizaciones en vivo.
-- Ejecutar en: Supabase Dashboard → SQL Editor.
-- ============================================================

-- ── 1. Enums ──
do $$
begin
    if not exists (select 1 from pg_type where typname = 'aid_resource_type') then
        create type public.aid_resource_type as enum (
            'FOOD', 'WATER', 'SHELTER', 'MEDICAL', 'CLOTHING',
            'HYGIENE', 'VOLUNTEERS', 'TOOLS', 'OTHER'
        );
    end if;
    if not exists (select 1 from pg_type where typname = 'aid_status') then
        create type public.aid_status as enum (
            'OPEN', 'COMMITTED', 'EN_ROUTE', 'DELIVERED', 'CANCELLED'
        );
    end if;
end $$;

-- ── 2. Tabla ──
create table if not exists public.aid_requests (
    id uuid primary key default gen_random_uuid(),

    resource_type public.aid_resource_type not null,
    resource_label varchar(100),           -- etiqueta libre (p.ej. "Colchonetas")
    quantity numeric,
    unit varchar(40),                       -- "raciones", "litros", "unidades"
    urgency smallint not null default 3,
    status public.aid_status not null default 'OPEN',
    description text,

    requester_org varchar(150),             -- quién solicita (JAC, universidad…)
    requester_contact varchar(60),
    provider_org varchar(150),              -- quién se compromete a entregar
    eta_minutes integer,

    zone_id uuid references public.emergency_zones(id) on delete set null,
    latitude double precision,
    longitude double precision,
    address text,
    place_name varchar(150),

    created_at timestamptz not null default now(),
    committed_at timestamptz,
    delivered_at timestamptz,
    updated_at timestamptz not null default now(),

    constraint aid_requests_urgency_check check (urgency between 1 and 5),
    constraint aid_requests_eta_check check (eta_minutes is null or eta_minutes >= 0),
    constraint aid_requests_lat_check check (latitude is null or latitude between -90 and 90),
    constraint aid_requests_lng_check check (longitude is null or longitude between -180 and 180)
);

create index if not exists idx_aid_requests_status on public.aid_requests(status);
create index if not exists idx_aid_requests_resource_type on public.aid_requests(resource_type);
create index if not exists idx_aid_requests_zone_id on public.aid_requests(zone_id);
create index if not exists idx_aid_requests_created_at on public.aid_requests(created_at desc);

-- ── 3. RLS: lectura pública; escritura sólo via RPC (SECURITY DEFINER) ──
alter table public.aid_requests enable row level security;

drop policy if exists aid_requests_public_select on public.aid_requests;
create policy aid_requests_public_select
    on public.aid_requests
    for select
    to anon, authenticated
    using (true);

-- ── 4. RPC: crear solicitud ──
create or replace function public.create_aid_request(
    p_resource_type public.aid_resource_type,
    p_quantity numeric default null,
    p_unit varchar(40) default null,
    p_urgency smallint default 3,
    p_resource_label varchar(100) default null,
    p_description text default null,
    p_requester_org varchar(150) default null,
    p_requester_contact varchar(60) default null,
    p_zone_id uuid default null,
    p_latitude double precision default null,
    p_longitude double precision default null,
    p_address text default null,
    p_place_name varchar(150) default null
)
returns public.aid_requests
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.aid_requests;
begin
    insert into public.aid_requests (
        resource_type, resource_label, quantity, unit, urgency, description,
        requester_org, requester_contact, zone_id, latitude, longitude,
        address, place_name, status
    ) values (
        p_resource_type, p_resource_label, p_quantity, p_unit,
        greatest(1, least(5, coalesce(p_urgency, 3))), p_description,
        p_requester_org, p_requester_contact, p_zone_id, p_latitude, p_longitude,
        p_address, p_place_name, 'OPEN'
    )
    returning * into v_row;
    return v_row;
end;
$$;

-- ── 5. RPC: comprometerse (OPEN → COMMITTED) ──
create or replace function public.commit_aid_request(
    p_id uuid,
    p_provider_org varchar(150),
    p_eta_minutes integer default null
)
returns public.aid_requests
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.aid_requests;
begin
    update public.aid_requests
    set provider_org = p_provider_org,
        eta_minutes = p_eta_minutes,
        status = 'COMMITTED',
        committed_at = now(),
        updated_at = now()
    where id = p_id
      and status = 'OPEN'
    returning * into v_row;

    if v_row.id is null then
        raise exception 'La solicitud no existe o ya no está abierta';
    end if;
    return v_row;
end;
$$;

-- ── 6. RPC: avanzar estado (EN_ROUTE / DELIVERED / CANCELLED) ──
create or replace function public.advance_aid_request(
    p_id uuid,
    p_status public.aid_status
)
returns public.aid_requests
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.aid_requests;
begin
    if p_status not in ('EN_ROUTE', 'DELIVERED', 'CANCELLED') then
        raise exception 'Transición no permitida: %', p_status;
    end if;

    update public.aid_requests
    set status = p_status,
        delivered_at = case when p_status = 'DELIVERED' then now() else delivered_at end,
        updated_at = now()
    where id = p_id
    returning * into v_row;

    if v_row.id is null then
        raise exception 'La solicitud no existe';
    end if;
    return v_row;
end;
$$;

revoke all on function public.create_aid_request(
    public.aid_resource_type, numeric, varchar, smallint, varchar, text,
    varchar, varchar, uuid, double precision, double precision, text, varchar
) from public;
grant execute on function public.create_aid_request(
    public.aid_resource_type, numeric, varchar, smallint, varchar, text,
    varchar, varchar, uuid, double precision, double precision, text, varchar
) to anon, authenticated;

revoke all on function public.commit_aid_request(uuid, varchar, integer) from public;
grant execute on function public.commit_aid_request(uuid, varchar, integer) to anon, authenticated;

revoke all on function public.advance_aid_request(uuid, public.aid_status) from public;
grant execute on function public.advance_aid_request(uuid, public.aid_status) to anon, authenticated;

-- ── 7. Realtime: publicar cambios de la tabla ──
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'aid_requests'
    ) then
        alter publication supabase_realtime add table public.aid_requests;
    end if;
exception when undefined_object then
    -- La publicación supabase_realtime no existe en este proyecto; se ignora.
    null;
end $$;
