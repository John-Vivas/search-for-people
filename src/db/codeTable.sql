-- ============================================================
-- ESTAMOS BUSCANDO
-- Initial Database Schema
-- PostgreSQL / Supabase
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 2. ENUM TYPES
-- ============================================================

do $$
begin

    if not exists (
        select 1 from pg_type where typname = 'user_role'
    ) then
        create type public.user_role as enum (
            'USER',
            'VOLUNTEER',
            'MODERATOR',
            'ADMIN'
        );
    end if;

    if not exists (
        select 1 from pg_type where typname = 'organization_type'
    ) then
        create type public.organization_type as enum (
            'NGO',
            'VOLUNTEER_GROUP',
            'COMMUNITY',
            'PRIVATE',
            'GOVERNMENT',
            'OTHER'
        );
    end if;

    if not exists (
        select 1 from pg_type where typname = 'reporter_type'
    ) then
        create type public.reporter_type as enum (
            'FAMILY',
            'WITNESS',
            'VOLUNTEER',
            'OTHER'
        );
    end if;

    if not exists (
        select 1 from pg_type where typname = 'report_type'
    ) then
        create type public.report_type as enum (
            'MISSING_PERSON',
            'FOUND_PERSON',
            'UNIDENTIFIED_PERSON',
            'LOST_PET',
            'FOUND_PET'
        );
    end if;

    if not exists (
        select 1 from pg_type where typname = 'report_status'
    ) then
        create type public.report_status as enum (
            'PENDING',
            'UNDER_REVIEW',
            'APPROVED',
            'REJECTED',
            'DUPLICATE'
        );
    end if;

    if not exists (
        select 1 from pg_type where typname = 'person_status'
    ) then
        create type public.person_status as enum (
            'MISSING',
            'FOUND',
            'UNIDENTIFIED',
            'IDENTIFIED',
            'TRANSFERRED',
            'REUNITED'
        );
    end if;

    if not exists (
        select 1 from pg_type where typname = 'pet_status'
    ) then
        create type public.pet_status as enum (
            'LOST',
            'FOUND',
            'REUNITED'
        );
    end if;

    if not exists (
        select 1 from pg_type where typname = 'facility_type'
    ) then
        create type public.facility_type as enum (
            'HOSPITAL',
            'CLINIC',
            'SHELTER',
            'EMERGENCY_CENTER',
            'MORGUE',
            'OTHER'
        );
    end if;

    if not exists (
        select 1 from pg_type where typname = 'person_event_type'
    ) then
        create type public.person_event_type as enum (
            'REPORTED_MISSING',
            'FOUND',
            'IDENTITY_CONFIRMED',
            'TRANSFERRED',
            'ARRIVED_AT_FACILITY',
            'LOCATION_UPDATED',
            'REUNITED',
            'STATUS_UPDATED'
        );
    end if;

    if not exists (
        select 1 from pg_type where typname = 'media_type'
    ) then
        create type public.media_type as enum (
            'PERSON_PHOTO',
            'PET_PHOTO',
            'REPORT_ATTACHMENT',
            'DOCUMENT',
            'OTHER'
        );
    end if;

end $$;


-- ============================================================
-- 3. ORGANIZATIONS
-- ============================================================

create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),

    name varchar(150) not null,

    type public.organization_type not null default 'OTHER',

    description text,

    phone varchar(30),

    email varchar(255),

    is_active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- 4. PROFILES
-- ============================================================
-- Extends Supabase auth.users
-- One profile per authenticated user

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    full_name varchar(150),

    phone varchar(30),

    organization_id uuid references public.organizations(id)
        on delete set null,

    role public.user_role not null default 'USER',

    avatar_url text,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- 5. EMERGENCY ZONES
-- ============================================================

create table if not exists public.emergency_zones (
    id uuid primary key default gen_random_uuid(),

    name varchar(100) not null,

    city varchar(100) not null,

    department varchar(100) not null,

    latitude double precision,

    longitude double precision,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint emergency_zones_coordinates_check
        check (
            (
                latitude is null
                and longitude is null
            )
            or
            (
                latitude between -90 and 90
                and longitude between -180 and 180
            )
        )
);


-- ============================================================
-- 6. LOCATIONS
-- ============================================================

create table if not exists public.locations (
    id uuid primary key default gen_random_uuid(),

    zone_id uuid references public.emergency_zones(id)
        on delete set null,

    latitude double precision not null,

    longitude double precision not null,

    address text,

    place_name varchar(200),

    accuracy_meters double precision,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint locations_latitude_check
        check (latitude between -90 and 90),

    constraint locations_longitude_check
        check (longitude between -180 and 180),

    constraint locations_accuracy_check
        check (
            accuracy_meters is null
            or accuracy_meters >= 0
        )
);


-- ============================================================
-- 7. FACILITIES
-- ============================================================

create table if not exists public.facilities (
    id uuid primary key default gen_random_uuid(),

    zone_id uuid references public.emergency_zones(id)
        on delete set null,

    location_id uuid references public.locations(id)
        on delete set null,

    name varchar(200) not null,

    facility_type public.facility_type not null,

    address text,

    phone varchar(30),

    email varchar(255),

    is_active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- 8. REPORTERS
-- ============================================================
-- PRIVATE INFORMATION
-- Should NOT be exposed publicly

create table if not exists public.reporters (
    id uuid primary key default gen_random_uuid(),

    profile_id uuid references public.profiles(id)
        on delete set null,

    reporter_type public.reporter_type not null,

    full_name varchar(150) not null,

    identification_number varchar(50),

    phone varchar(30),

    email varchar(255),

    relationship varchar(100),

    organization_id uuid references public.organizations(id)
        on delete set null,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- 9. PERSONS
-- ============================================================

create table if not exists public.persons (
    id uuid primary key default gen_random_uuid(),

    zone_id uuid references public.emergency_zones(id)
        on delete set null,

    current_location_id uuid references public.locations(id)
        on delete set null,

    current_facility_id uuid references public.facilities(id)
        on delete set null,

    last_seen_location_id uuid references public.locations(id)
        on delete set null,

    full_name varchar(200),

    identifier_code varchar(50),

    date_of_birth date,

    approximate_age integer,

    age_is_approximate boolean not null default false,

    sex varchar(30),

    description text,

    physical_description text,

    clothing_description text,

    distinguishing_features text,

    status public.person_status not null default 'MISSING',

    last_seen_at timestamptz,

    is_verified boolean not null default false,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint persons_age_check
        check (
            approximate_age is null
            or approximate_age between 0 and 120
        ),

    constraint persons_identifier_check
        check (
            identifier_code is null
            or length(trim(identifier_code)) > 0
        )
);


-- ============================================================
-- 10. PETS
-- ============================================================

create table if not exists public.pets (
    id uuid primary key default gen_random_uuid(),

    zone_id uuid references public.emergency_zones(id)
        on delete set null,

    current_location_id uuid references public.locations(id)
        on delete set null,

    last_seen_location_id uuid references public.locations(id)
        on delete set null,

    name varchar(150),

    species varchar(50) not null,

    breed varchar(100),

    color varchar(100),

    sex varchar(30),

    approximate_age integer,

    description text,

    status public.pet_status not null default 'LOST',

    last_seen_at timestamptz,

    is_verified boolean not null default false,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint pets_age_check
        check (
            approximate_age is null
            or approximate_age between 0 and 100
        )
);


-- ============================================================
-- 11. REPORTS
-- ============================================================
-- A report is different from a person/pet.
-- It records who submitted the information.

create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),

    reporter_id uuid not null references public.reporters(id)
        on delete restrict,

    report_type public.report_type not null,

    person_id uuid references public.persons(id)
        on delete cascade,

    pet_id uuid references public.pets(id)
        on delete cascade,

    description text,

    status public.report_status not null default 'PENDING',

    reviewed_by uuid references public.profiles(id)
        on delete set null,

    reviewed_at timestamptz,

    submitted_at timestamptz not null default now(),

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint reports_entity_check
        check (
            (
                report_type in (
                    'MISSING_PERSON',
                    'FOUND_PERSON',
                    'UNIDENTIFIED_PERSON'
                )
                and person_id is not null
                and pet_id is null
            )
            or
            (
                report_type in (
                    'LOST_PET',
                    'FOUND_PET'
                )
                and pet_id is not null
                and person_id is null
            )
        )
);


-- ============================================================
-- 12. PERSON EVENTS
-- ============================================================

create table if not exists public.person_events (
    id uuid primary key default gen_random_uuid(),

    person_id uuid not null references public.persons(id)
        on delete cascade,

    event_type public.person_event_type not null,

    location_id uuid references public.locations(id)
        on delete set null,

    facility_id uuid references public.facilities(id)
        on delete set null,

    description text,

    event_at timestamptz not null default now(),

    created_by uuid references public.profiles(id)
        on delete set null,

    created_at timestamptz not null default now()
);


-- ============================================================
-- 13. REPORT MEDIA
-- ============================================================
-- Metadata for files stored in Supabase Storage

create table if not exists public.report_media (
    id uuid primary key default gen_random_uuid(),

    report_id uuid references public.reports(id)
        on delete cascade,

    person_id uuid references public.persons(id)
        on delete cascade,

    pet_id uuid references public.pets(id)
        on delete cascade,

    storage_bucket varchar(100) not null,

    storage_path text not null,

    media_type public.media_type not null,

    mime_type varchar(100),

    file_size_bytes bigint,

    is_primary boolean not null default false,

    created_at timestamptz not null default now(),

    constraint report_media_entity_check
        check (
            (
                person_id is not null
                and pet_id is null
            )
            or
            (
                person_id is null
                and pet_id is not null
            )
            or
            (
                person_id is null
                and pet_id is null
                and report_id is not null
            )
        ),

    constraint report_media_file_size_check
        check (
            file_size_bytes is null
            or file_size_bytes >= 0
        )
);


-- ============================================================
-- 14. ORGANIZATION MEMBERS
-- ============================================================
-- Many-to-many relationship:
-- profiles <-> organizations

create table if not exists public.organization_members (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null references public.organizations(id)
        on delete cascade,

    profile_id uuid not null references public.profiles(id)
        on delete cascade,

    role varchar(100),

    is_active boolean not null default true,

    joined_at timestamptz not null default now(),

    created_at timestamptz not null default now(),

    unique (organization_id, profile_id)
);


-- ============================================================
-- 15. INDEXES
-- ============================================================

-- Profiles
create index if not exists idx_profiles_organization_id
    on public.profiles(organization_id);

create index if not exists idx_profiles_role
    on public.profiles(role);


-- Emergency zones
create index if not exists idx_emergency_zones_city
    on public.emergency_zones(city);

create index if not exists idx_emergency_zones_department
    on public.emergency_zones(department);

create index if not exists idx_emergency_zones_active
    on public.emergency_zones(is_active);


-- Locations
create index if not exists idx_locations_zone_id
    on public.locations(zone_id);

create index if not exists idx_locations_coordinates
    on public.locations(latitude, longitude);


-- Facilities
create index if not exists idx_facilities_zone_id
    on public.facilities(zone_id);

create index if not exists idx_facilities_type
    on public.facilities(facility_type);

create index if not exists idx_facilities_location_id
    on public.facilities(location_id);


-- Reporters
create index if not exists idx_reporters_profile_id
    on public.reporters(profile_id);

create index if not exists idx_reporters_organization_id
    on public.reporters(organization_id);


-- Persons
create index if not exists idx_persons_zone_id
    on public.persons(zone_id);

create index if not exists idx_persons_status
    on public.persons(status);

create index if not exists idx_persons_current_location
    on public.persons(current_location_id);

create index if not exists idx_persons_current_facility
    on public.persons(current_facility_id);

create index if not exists idx_persons_last_seen
    on public.persons(last_seen_at);

create index if not exists idx_persons_created_at
    on public.persons(created_at);

create index if not exists idx_persons_updated_at
    on public.persons(updated_at);


-- Pets
create index if not exists idx_pets_zone_id
    on public.pets(zone_id);

create index if not exists idx_pets_status
    on public.pets(status);

create index if not exists idx_pets_current_location
    on public.pets(current_location_id);

create index if not exists idx_pets_created_at
    on public.pets(created_at);


-- Reports
create index if not exists idx_reports_reporter_id
    on public.reports(reporter_id);

create index if not exists idx_reports_report_type
    on public.reports(report_type);

create index if not exists idx_reports_status
    on public.reports(status);

create index if not exists idx_reports_person_id
    on public.reports(person_id);

create index if not exists idx_reports_pet_id
    on public.reports(pet_id);

create index if not exists idx_reports_created_at
    on public.reports(created_at);


-- Person events
create index if not exists idx_person_events_person_id
    on public.person_events(person_id);

create index if not exists idx_person_events_event_type
    on public.person_events(event_type);

create index if not exists idx_person_events_event_at
    on public.person_events(event_at);

create index if not exists idx_person_events_location_id
    on public.person_events(location_id);

create index if not exists idx_person_events_facility_id
    on public.person_events(facility_id);


-- Media
create index if not exists idx_report_media_report_id
    on public.report_media(report_id);

create index if not exists idx_report_media_person_id
    on public.report_media(person_id);

create index if not exists idx_report_media_pet_id
    on public.report_media(pet_id);


-- Organization members
create index if not exists idx_organization_members_profile
    on public.organization_members(profile_id);

create index if not exists idx_organization_members_organization
    on public.organization_members(organization_id);


-- ============================================================
-- 16. UNIQUE INDEXES
-- ============================================================

create unique index if not exists idx_persons_identifier_code_unique
    on public.persons(identifier_code)
    where identifier_code is not null;


-- ============================================================
-- 17. UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- ============================================================
-- 18. UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists organizations_updated_at
    on public.organizations;

create trigger organizations_updated_at
before update on public.organizations
for each row
execute function public.update_updated_at();


drop trigger if exists profiles_updated_at
    on public.profiles;

create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at();


drop trigger if exists emergency_zones_updated_at
    on public.emergency_zones;

create trigger emergency_zones_updated_at
before update on public.emergency_zones
for each row
execute function public.update_updated_at();


drop trigger if exists locations_updated_at
    on public.locations;

create trigger locations_updated_at
before update on public.locations
for each row
execute function public.update_updated_at();


drop trigger if exists facilities_updated_at
    on public.facilities;

create trigger facilities_updated_at
before update on public.facilities
for each row
execute function public.update_updated_at();


drop trigger if exists reporters_updated_at
    on public.reporters;

create trigger reporters_updated_at
before update on public.reporters
for each row
execute function public.update_updated_at();


drop trigger if exists persons_updated_at
    on public.persons;

create trigger persons_updated_at
before update on public.persons
for each row
execute function public.update_updated_at();


drop trigger if exists pets_updated_at
    on public.pets;

create trigger pets_updated_at
before update on public.pets
for each row
execute function public.update_updated_at();


drop trigger if exists reports_updated_at
    on public.reports;

create trigger reports_updated_at
before update on public.reports
for each row
execute function public.update_updated_at();


-- ============================================================
-- 19. INITIAL EMERGENCY ZONES
-- ============================================================

insert into public.emergency_zones (
    name,
    city,
    department,
    latitude,
    longitude
)
values
    (
        'Cali',
        'Cali',
        'Valle del Cauca',
        3.4516,
        -76.5320
    ),
    (
        'Pereira',
        'Pereira',
        'Risaralda',
        4.8143,
        -75.6946
    ),
    (
        'Quibdó',
        'Quibdó',
        'Chocó',
        5.6947,
        -76.6611
    ),
    (
        'Manizales',
        'Manizales',
        'Caldas',
        5.0703,
        -75.5138
    ),
    (
        'Buenaventura',
        'Buenaventura',
        'Valle del Cauca',
        3.8830,
        -77.0197
    ),
    (
        'Armenia',
        'Armenia',
        'Quindío',
        4.5339,
        -75.6811
    )
on conflict do nothing;


-- ============================================================
-- 20. COMMENTS
-- ============================================================

comment on table public.profiles is
'Public application profile associated with Supabase Auth users.';

comment on table public.reporters is
'Private information about the person submitting a report.';

comment on table public.persons is
'People reported as missing, found, unidentified, transferred or reunited.';

comment on table public.pets is
'Lost and found pets.';

comment on table public.reports is
'Submission made by a reporter about a person or pet.';

comment on table public.person_events is
'Historical timeline of events associated with a person.';

comment on table public.report_media is
'Metadata for files stored in Supabase Storage.';

comment on table public.emergency_zones is
'Configurable emergency zones/cities.';


-- ============================================================
-- END
-- ============================================================