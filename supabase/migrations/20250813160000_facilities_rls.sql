-- ============================================================
-- Fix: facilities is public reference data (hospitals, shelters)
-- but had no RLS strategy at all. Bring it in line with
-- emergency_zones / persons / pets / locations.
-- ============================================================

alter table public.facilities enable row level security;

drop policy if exists facilities_public_read on public.facilities;

create policy facilities_public_read
    on public.facilities
    for select
    to anon, authenticated
    using (is_active = true);
