-- ============================================================
-- Seed — Colombia geographic hierarchy (MVP zones)
-- Stable UUIDs + code slugs for mock ↔ Supabase mapping
-- ============================================================

insert into public.emergency_zones (
    id, code, name, type, parent_id, country_code,
    city, department, latitude, longitude, is_active
)
values
    -- Country
    (
        '11111111-1111-4111-8111-111111111101',
        'colombia',
        'Colombia',
        'COUNTRY',
        null,
        'CO',
        null,
        null,
        null,
        null,
        true
    ),

    -- Departments
    (
        '11111111-1111-4111-8111-111111111201',
        'dept-valle',
        'Valle del Cauca',
        'DEPARTMENT',
        '11111111-1111-4111-8111-111111111101',
        'CO',
        null,
        'Valle del Cauca',
        null,
        null,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111202',
        'dept-risaralda',
        'Risaralda',
        'DEPARTMENT',
        '11111111-1111-4111-8111-111111111101',
        'CO',
        null,
        'Risaralda',
        null,
        null,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111203',
        'dept-choco',
        'Chocó',
        'DEPARTMENT',
        '11111111-1111-4111-8111-111111111101',
        'CO',
        null,
        'Chocó',
        null,
        null,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111204',
        'dept-caldas',
        'Caldas',
        'DEPARTMENT',
        '11111111-1111-4111-8111-111111111101',
        'CO',
        null,
        'Caldas',
        null,
        null,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111205',
        'dept-quindio',
        'Quindío',
        'DEPARTMENT',
        '11111111-1111-4111-8111-111111111101',
        'CO',
        null,
        'Quindío',
        null,
        null,
        true
    ),

    -- Valle del Cauca
    (
        '11111111-1111-4111-8111-111111111301',
        'zone-cali',
        'Cali',
        'CITY',
        '11111111-1111-4111-8111-111111111201',
        'CO',
        'Cali',
        'Valle del Cauca',
        3.4516,
        -76.5320,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111302',
        'zone-buenaventura',
        'Buenaventura',
        'DISTRICT',
        '11111111-1111-4111-8111-111111111201',
        'CO',
        'Buenaventura',
        'Valle del Cauca',
        3.8801,
        -77.0318,
        true
    ),

    -- Risaralda
    (
        '11111111-1111-4111-8111-111111111303',
        'zone-pereira',
        'Pereira',
        'CITY',
        '11111111-1111-4111-8111-111111111202',
        'CO',
        'Pereira',
        'Risaralda',
        4.8133,
        -75.6961,
        true
    ),

    -- Chocó — Quibdó es municipio, NO el departamento
    (
        '11111111-1111-4111-8111-111111111304',
        'zone-quibdo',
        'Quibdó',
        'CITY',
        '11111111-1111-4111-8111-111111111203',
        'CO',
        'Quibdó',
        'Chocó',
        5.6947,
        -76.6611,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111305',
        'zone-condoto',
        'Condoto',
        'MUNICIPALITY',
        '11111111-1111-4111-8111-111111111203',
        'CO',
        'Condoto',
        'Chocó',
        5.0933,
        -76.6528,
        true
    ),

    -- Caldas
    (
        '11111111-1111-4111-8111-111111111306',
        'zone-manizales',
        'Manizales',
        'CITY',
        '11111111-1111-4111-8111-111111111204',
        'CO',
        'Manizales',
        'Caldas',
        5.0703,
        -75.5138,
        true
    ),

    -- Quindío
    (
        '11111111-1111-4111-8111-111111111307',
        'zone-armenia',
        'Armenia',
        'CITY',
        '11111111-1111-4111-8111-111111111205',
        'CO',
        'Armenia',
        'Quindío',
        4.5339,
        -75.6811,
        true
    )
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
