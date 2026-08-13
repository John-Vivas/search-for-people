-- ============================================================
-- ESTAMOS BUSCANDO — Complete Consolidated SQL Migration
-- File: 20250813000000_complete_supabase_schema_and_fixes.sql
-- Instructions: Run this script in your Supabase SQL Editor.
-- ============================================================

-- ── 1. EMERGENCY ZONES HIERARCHY ──
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
    add column if not exists parent_id uuid references public.emergency_zones(id) on delete set null,
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


-- ── 2. REPORT MEDIA CLOUDINARY FIELDS ──
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


-- ── 3. RLS POLICIES FOR COMMUNITY REPORT SUBMISSIONS ──
alter table public.reporters enable row level security;

drop policy if exists reporters_anon_insert on public.reporters;

create policy reporters_anon_insert
    on public.reporters
    for insert
    to anon, authenticated
    with check (true);

alter table public.persons enable row level security;

drop policy if exists persons_anon_insert on public.persons;

create policy persons_anon_insert
    on public.persons
    for insert
    to anon, authenticated
    with check (true);

drop policy if exists persons_public_select on public.persons;

create policy persons_public_select
    on public.persons
    for select
    to anon, authenticated
    using (true);

alter table public.pets enable row level security;

drop policy if exists pets_anon_insert on public.pets;

create policy pets_anon_insert
    on public.pets
    for insert
    to anon, authenticated
    with check (true);

drop policy if exists pets_public_select on public.pets;

create policy pets_public_select
    on public.pets
    for select
    to anon, authenticated
    using (true);

alter table public.reports enable row level security;

drop policy if exists reports_anon_insert on public.reports;

create policy reports_anon_insert
    on public.reports
    for insert
    to anon, authenticated
    with check (status = 'PENDING');

drop policy if exists reports_public_select on public.reports;

create policy reports_public_select
    on public.reports
    for select
    to anon, authenticated
    using (true);


-- ── 4. SECURE RPC: CREATE REPORTER RECORD (SECURITY DEFINER) ──
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


-- ── 5. ADMIN RPC: GET ADMIN REPORT QUEUE ──
create or replace function public.get_admin_report_queue(p_limit int default 100)
returns table (
    report_id uuid,
    report_type public.report_type,
    report_status public.report_status,
    report_description text,
    submitted_at timestamptz,
    reviewed_at timestamptz,
    person_id uuid,
    pet_id uuid,
    reporter_id uuid,
    reporter_type public.reporter_type,
    reporter_full_name varchar,
    reporter_identification varchar,
    reporter_phone varchar,
    reporter_email varchar,
    reporter_relationship varchar,
    person_full_name varchar,
    person_identifier_code varchar,
    person_status public.person_status,
    person_approximate_age int,
    person_sex varchar,
    pet_name varchar,
    pet_species varchar,
    pet_status public.pet_status,
    zone_name varchar,
    zone_city varchar
)
language sql
security definer
set search_path = public
stable
as $$
    select
        r.id as report_id,
        r.report_type,
        r.status as report_status,
        r.description as report_description,
        r.submitted_at,
        r.reviewed_at,
        r.person_id,
        r.pet_id,
        rep.id as reporter_id,
        rep.reporter_type,
        rep.full_name as reporter_full_name,
        rep.identification_number as reporter_identification,
        rep.phone as reporter_phone,
        rep.email as reporter_email,
        rep.relationship as reporter_relationship,
        p.full_name as person_full_name,
        p.identifier_code as person_identifier_code,
        p.status as person_status,
        p.approximate_age as person_approximate_age,
        p.sex as person_sex,
        pt.name as pet_name,
        pt.species as pet_species,
        pt.status as pet_status,
        ez.name as zone_name,
        ez.city as zone_city
    from public.reports r
    inner join public.reporters rep on rep.id = r.reporter_id
    left join public.persons p on p.id = r.person_id
    left join public.pets pt on pt.id = r.pet_id
    left join public.emergency_zones ez on ez.id = coalesce(p.zone_id, pt.zone_id)
    order by r.submitted_at desc
    limit greatest(p_limit, 1);
$$;

revoke all on function public.get_admin_report_queue(int) from public;
grant execute on function public.get_admin_report_queue(int) to anon, authenticated;


-- ── 6. ADMIN RPC: MODERATE REPORT ──
create or replace function public.moderate_report(
    p_report_id uuid,
    p_status public.report_status,
    p_notes text default null
)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
    updated public.reports;
begin
    if p_status not in ('APPROVED', 'REJECTED', 'UNDER_REVIEW', 'DUPLICATE') then
        raise exception 'Invalid moderation status';
    end if;

    update public.reports
    set
        status = p_status,
        description = coalesce(p_notes, description),
        reviewed_at = now(),
        updated_at = now()
    where id = p_report_id
    returning * into updated;

    if updated.id is null then
        raise exception 'Report not found';
    end if;

    return updated;
end;
$$;

revoke all on function public.moderate_report(uuid, public.report_status, text) from public;
grant execute on function public.moderate_report(uuid, public.report_status, text) to anon, authenticated;
