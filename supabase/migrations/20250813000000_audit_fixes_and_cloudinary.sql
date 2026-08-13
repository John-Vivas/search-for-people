-- ============================================================
-- Estamos Buscando — Migration 20250813000000
-- 1. Emergency zones hierarchy columns
-- 2. Cloudinary fields for report_media
-- 3. Secure reporter creation RPC (RLS compliant)
-- ============================================================

-- ── 1. Zone type enum & Emergency zones hierarchy columns ──
do $$
begin
    if not exists (
        select 1 from pg_type where typname = 'zone_type'
    ) then
        create type public.zone_type as enum (
            'COUNTRY',
            'DEPARTMENT',
            'CITY',
            'MUNICIPALITY',
            'DISTRICT',
            'EMERGENCY_ZONE'
        );
    end if;
end $$;

alter table public.emergency_zones
    add column if not exists type public.zone_type,
    add column if not exists parent_id uuid references public.emergency_zones(id)
        on delete set null,
    add column if not exists country_code char(2) default 'CO',
    add column if not exists description text,
    add column if not exists code varchar(50);

alter table public.emergency_zones
    alter column city drop not null,
    alter column department drop not null;

create unique index if not exists idx_emergency_zones_code
    on public.emergency_zones(code)
    where code is not null;

create index if not exists idx_emergency_zones_parent_id
    on public.emergency_zones(parent_id);

create index if not exists idx_emergency_zones_type
    on public.emergency_zones(type);

alter table public.emergency_zones enable row level security;

drop policy if exists emergency_zones_public_read on public.emergency_zones;

create policy emergency_zones_public_read
    on public.emergency_zones
    for select
    to anon, authenticated
    using (is_active = true);


-- ── 2. Add Cloudinary fields to report_media ──
alter table public.report_media
    add column if not exists cloudinary_url text,
    add column if not exists cloudinary_public_id text,
    add column if not exists image_url text;

create index if not exists idx_report_media_cloudinary_public_id
    on public.report_media(cloudinary_public_id);

alter table public.report_media enable row level security;

drop policy if exists report_media_public_select on public.report_media;

create policy report_media_public_select
    on public.report_media
    for select
    to anon, authenticated
    using (true);

drop policy if exists report_media_anon_insert on public.report_media;

create policy report_media_anon_insert
    on public.report_media
    for insert
    to anon, authenticated
    with check (true);


-- ── 3. Secure Reporter Creation RPC ──
-- Allows anonymous community report submissions to insert private reporter info
-- and return only the generated UUID, without exposing public SELECT on reporters.

create or replace function public.create_reporter_record(
    p_reporter_type public.reporter_type,
    p_full_name varchar(150),
    p_identification_number varchar(50) default null,
    p_phone varchar(30) default null,
    p_email varchar(255) default null,
    p_relationship varchar(100) default null,
    p_organization_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_reporter_id uuid;
begin
    insert into public.reporters (
        reporter_type,
        full_name,
        identification_number,
        phone,
        email,
        relationship,
        organization_id
    ) values (
        p_reporter_type,
        p_full_name,
        p_identification_number,
        p_phone,
        p_email,
        p_relationship,
        p_organization_id
    )
    returning id into v_reporter_id;

    return v_reporter_id;
end;
$$;

revoke all on function public.create_reporter_record(
    public.reporter_type, varchar, varchar, varchar, varchar, varchar, uuid
) from public;

grant execute on function public.create_reporter_record(
    public.reporter_type, varchar, varchar, varchar, varchar, varchar, uuid
) to anon, authenticated;
