-- ============================================================
-- Estamos Buscando — Phase 4 (manual apply in Supabase SQL Editor)
-- Run this entire file once in:
-- https://supabase.com/dashboard/project/braomlsipoiifqzkybsc/sql
-- ============================================================

-- === Migration: hierarchy columns ===
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

-- === Seed: Colombia hierarchy ===
insert into public.emergency_zones (
    id, code, name, type, parent_id, country_code,
    city, department, latitude, longitude, is_active
)
values
    ('11111111-1111-4111-8111-111111111101', 'colombia', 'Colombia', 'COUNTRY', null, 'CO', null, null, null, null, true),
    ('11111111-1111-4111-8111-111111111201', 'dept-valle', 'Valle del Cauca', 'DEPARTMENT', '11111111-1111-4111-8111-111111111101', 'CO', null, 'Valle del Cauca', null, null, true),
    ('11111111-1111-4111-8111-111111111202', 'dept-risaralda', 'Risaralda', 'DEPARTMENT', '11111111-1111-4111-8111-111111111101', 'CO', null, 'Risaralda', null, null, true),
    ('11111111-1111-4111-8111-111111111203', 'dept-choco', 'Chocó', 'DEPARTMENT', '11111111-1111-4111-8111-111111111101', 'CO', null, 'Chocó', null, null, true),
    ('11111111-1111-4111-8111-111111111204', 'dept-caldas', 'Caldas', 'DEPARTMENT', '11111111-1111-4111-8111-111111111101', 'CO', null, 'Caldas', null, null, true),
    ('11111111-1111-4111-8111-111111111205', 'dept-quindio', 'Quindío', 'DEPARTMENT', '11111111-1111-4111-8111-111111111101', 'CO', null, 'Quindío', null, null, true),
    ('11111111-1111-4111-8111-111111111301', 'zone-cali', 'Cali', 'CITY', '11111111-1111-4111-8111-111111111201', 'CO', 'Cali', 'Valle del Cauca', 3.4516, -76.5320, true),
    ('11111111-1111-4111-8111-111111111302', 'zone-buenaventura', 'Buenaventura', 'DISTRICT', '11111111-1111-4111-8111-111111111201', 'CO', 'Buenaventura', 'Valle del Cauca', 3.8801, -77.0318, true),
    ('11111111-1111-4111-8111-111111111303', 'zone-pereira', 'Pereira', 'CITY', '11111111-1111-4111-8111-111111111202', 'CO', 'Pereira', 'Risaralda', 4.8133, -75.6961, true),
    ('11111111-1111-4111-8111-111111111304', 'zone-quibdo', 'Quibdó', 'CITY', '11111111-1111-4111-8111-111111111203', 'CO', 'Quibdó', 'Chocó', 5.6947, -76.6611, true),
    ('11111111-1111-4111-8111-111111111305', 'zone-condoto', 'Condoto', 'MUNICIPALITY', '11111111-1111-4111-8111-111111111203', 'CO', 'Condoto', 'Chocó', 5.0933, -76.6528, true),
    ('11111111-1111-4111-8111-111111111306', 'zone-manizales', 'Manizales', 'CITY', '11111111-1111-4111-8111-111111111204', 'CO', 'Manizales', 'Caldas', 5.0703, -75.5138, true),
    ('11111111-1111-4111-8111-111111111307', 'zone-armenia', 'Armenia', 'CITY', '11111111-1111-4111-8111-111111111205', 'CO', 'Armenia', 'Quindío', 4.5339, -75.6811, true)
on conflict (id) do update set
    code = excluded.code,
    name = excluded.name,
    type = excluded.type,
    parent_id = excluded.parent_id,
    country_code = excluded.country_code,
    city = excluded.city,
    department = excluded.department,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    is_active = excluded.is_active,
    updated_at = now();
