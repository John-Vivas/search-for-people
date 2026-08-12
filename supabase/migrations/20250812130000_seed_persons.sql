-- ============================================================
-- Phase 5 — Public read policy + sample persons (fictional data)
-- Requires Phase 4 zones seed (stable zone UUIDs)
-- ============================================================

-- Public read for approved community person records
alter table public.persons enable row level security;

drop policy if exists persons_public_read on public.persons;

create policy persons_public_read
    on public.persons
    for select
    to anon, authenticated
    using (true);

-- Sample locations (fictional)
insert into public.locations (id, zone_id, latitude, longitude, address, place_name)
values
    (
        '22222222-2222-4222-8222-222222222301',
        '11111111-1111-4111-8111-111111111304',
        5.6947,
        -76.6611,
        'Centro, Quibdó',
        'Mercado del Centro — Quibdó'
    ),
    (
        '22222222-2222-4222-8222-222222222302',
        '11111111-1111-4111-8111-111111111301',
        3.4516,
        -76.5320,
        'San Antonio, Cali',
        'Barrio San Antonio — Cali'
    ),
    (
        '22222222-2222-4222-8222-222222222303',
        '11111111-1111-4111-8111-111111111304',
        5.6955,
        -76.6600,
        'Hospital San Francisco de Asís, Quibdó',
        'Hospital San Francisco — Quibdó'
    )
on conflict (id) do update set
    zone_id = excluded.zone_id,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    address = excluded.address,
    place_name = excluded.place_name,
    updated_at = now();

alter table public.locations enable row level security;

drop policy if exists locations_public_read on public.locations;

create policy locations_public_read
    on public.locations
    for select
    to anon, authenticated
    using (true);

-- Fictional persons — NOT real missing-person data
insert into public.persons (
    id,
    zone_id,
    last_seen_location_id,
    full_name,
    identifier_code,
    approximate_age,
    age_is_approximate,
    sex,
    description,
    physical_description,
    clothing_description,
    distinguishing_features,
    status,
    last_seen_at,
    is_verified
)
values
    (
        '33333333-3333-4333-8333-333333333301',
        '11111111-1111-4111-8111-111111111304',
        '22222222-2222-4222-8222-222222222301',
        'Ejemplo Persona A',
        'EB-QDO-001',
        34,
        true,
        'Masculino',
        'Visto por última vez cerca del mercado del centro.',
        'Estatura media, contextura delgada.',
        'Camisa blanca, pantalón oscuro.',
        null,
        'MISSING',
        now() - interval '6 hours',
        true
    ),
    (
        '33333333-3333-4333-8333-333333333302',
        '11111111-1111-4111-8111-111111111301',
        '22222222-2222-4222-8222-222222222302',
        'Ejemplo Persona B',
        'EB-CALI-002',
        58,
        true,
        'Femenino',
        'Localizada en zona de San Antonio, recibiendo apoyo comunitario.',
        'Estatura baja, cabello corto.',
        'Buso gris, falda azul.',
        null,
        'FOUND',
        now() - interval '1 day',
        true
    ),
    (
        '33333333-3333-4333-8333-333333333303',
        '11111111-1111-4111-8111-111111111304',
        '22222222-2222-4222-8222-222222222303',
        null,
        'NN-QDO-003',
        35,
        true,
        'Masculino',
        'Persona sin identificar ingresada a centro de atención.',
        'Complexión atlética.',
        'Pantalón jean, camiseta verde.',
        'Tatuaje pequeño en antebrazo derecho (símbolo de ancla).',
        'UNIDENTIFIED',
        now() - interval '3 hours',
        false
    ),
    (
        '33333333-3333-4333-8333-333333333304',
        '11111111-1111-4111-8111-111111111305',
        null,
        'Ejemplo Persona C',
        'EB-CON-004',
        22,
        true,
        'Femenino',
        'Reportada desaparecida en municipio de Condoto, Chocó.',
        null,
        'Sudadera negra, pantalón deportivo.',
        null,
        'MISSING',
        now() - interval '2 days',
        false
    )
on conflict (id) do update set
    zone_id = excluded.zone_id,
    last_seen_location_id = excluded.last_seen_location_id,
    full_name = excluded.full_name,
    identifier_code = excluded.identifier_code,
    approximate_age = excluded.approximate_age,
    age_is_approximate = excluded.age_is_approximate,
    sex = excluded.sex,
    description = excluded.description,
    physical_description = excluded.physical_description,
    clothing_description = excluded.clothing_description,
    distinguishing_features = excluded.distinguishing_features,
    status = excluded.status,
    last_seen_at = excluded.last_seen_at,
    is_verified = excluded.is_verified,
    updated_at = now();
