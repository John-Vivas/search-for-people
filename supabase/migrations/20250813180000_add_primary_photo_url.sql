-- ============================================================
-- ESTAMOS BUSCANDO — Migration 20250813180000
-- Persiste la foto principal (URL de Cloudinary) en persons/pets
-- y la guarda desde el RPC submit_community_report.
-- Antes: la imagen se subía a Cloudinary pero su URL se perdía,
-- por eso las tarjetas siempre mostraban el placeholder "Sin foto".
-- Ejecutar en: Supabase Dashboard → SQL Editor.
-- ============================================================

-- ── 1. Columna de foto principal ──
alter table public.persons
    add column if not exists primary_photo_url text;

alter table public.pets
    add column if not exists primary_photo_url text;

-- ── 2. RPC actualizado con p_photo_url ──
-- Se elimina la firma anterior para evitar overloads ambiguos en PostgREST.
drop function if exists public.submit_community_report(
    public.reporter_type, varchar, varchar, varchar, varchar, varchar,
    public.report_type, varchar, varchar, integer, varchar, text,
    timestamptz, uuid, varchar, varchar, varchar
);

create or replace function public.submit_community_report(
    p_reporter_type public.reporter_type,
    p_reporter_full_name varchar(150),
    p_reporter_identification varchar(50) default null,
    p_reporter_phone varchar(30) default null,
    p_reporter_email varchar(255) default null,
    p_reporter_relationship varchar(100) default null,
    p_report_type public.report_type default 'MISSING_PERSON',
    p_subject_name varchar(200) default null,
    p_identifier_code varchar(50) default null,
    p_approximate_age integer default null,
    p_sex varchar(30) default null,
    p_description text default null,
    p_last_seen_at timestamptz default null,
    p_zone_id uuid default null,
    p_pet_species varchar(50) default null,
    p_pet_breed varchar(100) default null,
    p_pet_color varchar(100) default null,
    p_photo_url text default null
)
returns table (
    report_id uuid,
    reporter_id uuid,
    person_id uuid,
    pet_id uuid,
    submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_reporter_id uuid;
    v_person_id uuid := null;
    v_pet_id uuid := null;
    v_report_id uuid;
    v_person_status public.person_status;
    v_pet_status public.pet_status;
    v_submitted_at timestamptz := now();
begin
    -- 1. Insert Reporter Record
    insert into public.reporters (
        reporter_type,
        full_name,
        identification_number,
        phone,
        email,
        relationship
    ) values (
        p_reporter_type,
        p_reporter_full_name,
        p_reporter_identification,
        p_reporter_phone,
        p_reporter_email,
        p_reporter_relationship
    )
    returning id into v_reporter_id;

    -- 2. Handle Pet vs Person Creation
    if p_report_type in ('LOST_PET', 'FOUND_PET') then
        if p_report_type = 'FOUND_PET' then
            v_pet_status := 'FOUND';
        else
            v_pet_status := 'LOST';
        end if;

        insert into public.pets (
            zone_id,
            name,
            species,
            breed,
            color,
            sex,
            approximate_age,
            description,
            status,
            last_seen_at,
            is_verified,
            primary_photo_url
        ) values (
            p_zone_id,
            p_subject_name,
            coalesce(p_pet_species, 'Mascota'),
            p_pet_breed,
            p_pet_color,
            p_sex,
            p_approximate_age,
            p_description,
            v_pet_status,
            coalesce(p_last_seen_at, now()),
            false,
            p_photo_url
        )
        returning id into v_pet_id;
    else
        if p_report_type = 'FOUND_PERSON' then
            v_person_status := 'FOUND';
        elsif p_report_type = 'UNIDENTIFIED_PERSON' then
            v_person_status := 'UNIDENTIFIED';
        else
            v_person_status := 'MISSING';
        end if;

        insert into public.persons (
            zone_id,
            full_name,
            identifier_code,
            approximate_age,
            age_is_approximate,
            sex,
            description,
            status,
            last_seen_at,
            is_verified,
            primary_photo_url
        ) values (
            p_zone_id,
            case when v_person_status = 'UNIDENTIFIED' then null else p_subject_name end,
            p_identifier_code,
            p_approximate_age,
            true,
            p_sex,
            p_description,
            v_person_status,
            coalesce(p_last_seen_at, now()),
            false,
            p_photo_url
        )
        returning id into v_person_id;
    end if;

    -- 3. Create Pending Report Record
    insert into public.reports (
        reporter_id,
        report_type,
        person_id,
        pet_id,
        description,
        status,
        submitted_at
    ) values (
        v_reporter_id,
        p_report_type,
        v_person_id,
        v_pet_id,
        p_description,
        'PENDING',
        v_submitted_at
    )
    returning id into v_report_id;

    -- 4. Return summary
    return query select
        v_report_id,
        v_reporter_id,
        v_person_id,
        v_pet_id,
        v_submitted_at;
end;
$$;

revoke all on function public.submit_community_report(
    public.reporter_type, varchar, varchar, varchar, varchar, varchar,
    public.report_type, varchar, varchar, integer, varchar, text,
    timestamptz, uuid, varchar, varchar, varchar, text
) from public;

grant execute on function public.submit_community_report(
    public.reporter_type, varchar, varchar, varchar, varchar, varchar,
    public.report_type, varchar, varchar, integer, varchar, text,
    timestamptz, uuid, varchar, varchar, varchar, text
) to anon, authenticated;
