-- ============================================================
-- Phase 7 — Reports submission + admin queue (RLS + RPC)
-- Enables public report INSERT; reporter PII via admin RPC only
-- ============================================================

-- ── Community submission (anon INSERT) ──
drop policy if exists reporters_anon_insert on public.reporters;
create policy reporters_anon_insert
    on public.reporters
    for insert
    to anon, authenticated
    with check (true);

drop policy if exists persons_anon_insert on public.persons;
create policy persons_anon_insert
    on public.persons
    for insert
    to anon, authenticated
    with check (true);

drop policy if exists pets_anon_insert on public.pets;
create policy pets_anon_insert
    on public.pets
    for insert
    to anon, authenticated
    with check (true);

drop policy if exists reports_anon_insert on public.reports;
create policy reports_anon_insert
    on public.reports
    for insert
    to anon, authenticated
    with check (status = 'PENDING');

-- Reports metadata (no reporter PII) — readable for admin UI
alter table public.reports enable row level security;

drop policy if exists reports_public_select on public.reports;
create policy reports_public_select
    on public.reports
    for select
    to anon, authenticated
    using (true);

-- Reporters remain private — no anon SELECT policy

-- ── Admin moderation RPC (joins private reporter data) ──
-- NOTE: Until Auth (Phase 8), this is callable with the anon key.
-- Protect /admin in production with authentication.

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

-- Approve / reject (moderation) — anon until Auth phase
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
