-- ============================================================
-- ESTAMOS BUSCANDO — Migration 20250813190000
-- Agrega las columnas de jerarquía faltantes a emergency_zones.
-- El cliente pide EMERGENCY_ZONE_COLUMNS_HIERARCHICAL (code, type,
-- parent_id, country_code, description); sin ellas la consulta
-- devolvía 400 (column ... does not exist) y caía al fallback plano.
-- Idempotente. Ejecutar en: Supabase Dashboard → SQL Editor.
-- ============================================================

-- 1. Enum de tipo de zona
do $$
begin
    if not exists (select 1 from pg_type where typname = 'zone_type') then
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

-- 2. Columnas de jerarquía
alter table public.emergency_zones
    add column if not exists type public.zone_type,
    add column if not exists parent_id uuid references public.emergency_zones(id)
        on delete set null,
    add column if not exists country_code char(2) default 'CO',
    add column if not exists description text,
    add column if not exists code varchar(50);

-- 3. Los nodos país/departamento pueden no tener city/department
alter table public.emergency_zones
    alter column city drop not null,
    alter column department drop not null;

-- 4. Índices
create unique index if not exists idx_emergency_zones_code
    on public.emergency_zones(code)
    where code is not null;

create index if not exists idx_emergency_zones_parent_id
    on public.emergency_zones(parent_id);

create index if not exists idx_emergency_zones_type
    on public.emergency_zones(type);

-- 5. Lectura pública de zonas activas
alter table public.emergency_zones enable row level security;

drop policy if exists emergency_zones_public_read on public.emergency_zones;
create policy emergency_zones_public_read
    on public.emergency_zones
    for select
    to anon, authenticated
    using (is_active = true);
