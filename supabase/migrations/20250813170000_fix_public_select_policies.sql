-- ============================================================
-- ESTAMOS BUSCANDO — Fix 20250813170000
-- Restaura las políticas RLS de LECTURA pública (SELECT) que
-- faltaban en el proyecto en vivo. Sin ellas, el rol `anon`
-- (clave del navegador) ve 0 filas en todas las tablas aunque
-- los datos existan, por eso nada se renderiza en el sitio.
-- Ejecutar en: Supabase Dashboard → SQL Editor.
-- ============================================================

-- ── PERSONS: lectura pública ──
alter table public.persons enable row level security;

drop policy if exists persons_public_select on public.persons;
create policy persons_public_select
    on public.persons
    for select
    to anon, authenticated
    using (true);

-- ── PETS: lectura pública ──
alter table public.pets enable row level security;

drop policy if exists pets_public_select on public.pets;
create policy pets_public_select
    on public.pets
    for select
    to anon, authenticated
    using (true);

-- ── REPORTS: lectura pública (metadatos, sin PII del reportante) ──
alter table public.reports enable row level security;

drop policy if exists reports_public_select on public.reports;
create policy reports_public_select
    on public.reports
    for select
    to anon, authenticated
    using (true);

-- ── EMERGENCY ZONES: lectura pública (zonas activas) ──
alter table public.emergency_zones enable row level security;

drop policy if exists emergency_zones_public_read on public.emergency_zones;
create policy emergency_zones_public_read
    on public.emergency_zones
    for select
    to anon, authenticated
    using (is_active = true);

-- ── Verificación rápida (opcional): debe listar las 4 políticas ──
-- select tablename, policyname, cmd
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('persons','pets','reports','emergency_zones')
--   and cmd = 'SELECT';
