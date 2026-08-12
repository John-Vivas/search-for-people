-- ============================================================
-- Phase 6 — Public read policy + sample pets (fictional data)
-- Requires Phase 4 zones + optional Phase 5 locations
-- ============================================================

alter table public.pets enable row level security;

drop policy if exists pets_public_read on public.pets;

create policy pets_public_read
    on public.pets
    for select
    to anon, authenticated
    using (true);

-- Fictional pets — NOT real animals
insert into public.pets (
    id,
    zone_id,
    last_seen_location_id,
    name,
    species,
    breed,
    color,
    sex,
    approximate_age,
    description,
    status,
    last_seen_at,
    is_verified
)
values
    (
        '44444444-4444-4444-8444-444444444401',
        '11111111-1111-4111-8111-111111111304',
        '22222222-2222-4222-8222-222222222301',
        'Ejemplo Canino A',
        'Perro',
        'Mestizo',
        'Café con blanco',
        'Macho',
        3,
        'Perdido cerca del mercado del centro de Quibdó. Lleva collar rojo.',
        'LOST',
        now() - interval '4 hours',
        true
    ),
    (
        '44444444-4444-4444-8444-444444444402',
        '11111111-1111-4111-8111-111111111301',
        '22222222-2222-4222-8222-222222222302',
        'Ejemplo Felino B',
        'Gato',
        'Doméstico',
        'Negro',
        'Hembra',
        2,
        'Encontrada en San Antonio, Cali. Muy sociable.',
        'FOUND',
        now() - interval '12 hours',
        false
    ),
    (
        '44444444-4444-4444-8444-444444444403',
        '11111111-1111-4111-8111-111111111305',
        null,
        'Ejemplo Canino C',
        'Perro',
        'Labrador',
        'Dorado',
        'Macho',
        5,
        'Reportado perdido en Condoto, Chocó.',
        'LOST',
        now() - interval '1 day',
        false
    )
on conflict (id) do update set
    zone_id = excluded.zone_id,
    last_seen_location_id = excluded.last_seen_location_id,
    name = excluded.name,
    species = excluded.species,
    breed = excluded.breed,
    color = excluded.color,
    sex = excluded.sex,
    approximate_age = excluded.approximate_age,
    description = excluded.description,
    status = excluded.status,
    last_seen_at = excluded.last_seen_at,
    is_verified = excluded.is_verified,
    updated_at = now();
