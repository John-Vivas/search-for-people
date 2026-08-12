-- ============================================================
-- Estamos Buscando — emergency_zones hierarchical model
-- Phase 4: COUNTRY → DEPARTMENT → CITY | MUNICIPALITY | DISTRICT
-- ============================================================

-- 1. Zone type enum
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


-- 2. Hierarchy columns
alter table public.emergency_zones
    add column if not exists type public.zone_type,
    add column if not exists parent_id uuid references public.emergency_zones(id)
        on delete set null,
    add column if not exists country_code char(2) default 'CO',
    add column if not exists description text,
    add column if not exists code varchar(50);


-- 3. Country/dept nodes may not have city/department text
alter table public.emergency_zones
    alter column city drop not null,
    alter column department drop not null;


-- 4. Indexes
create unique index if not exists idx_emergency_zones_code
    on public.emergency_zones(code)
    where code is not null;

create index if not exists idx_emergency_zones_parent_id
    on public.emergency_zones(parent_id);

create index if not exists idx_emergency_zones_type
    on public.emergency_zones(type);


-- 5. Public read for reference data (active zones)
alter table public.emergency_zones enable row level security;

drop policy if exists emergency_zones_public_read on public.emergency_zones;

create policy emergency_zones_public_read
    on public.emergency_zones
    for select
    to anon, authenticated
    using (is_active = true);
