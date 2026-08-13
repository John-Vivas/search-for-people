-- ============================================================
-- ESTAMOS BUSCANDO — Migration 20250813130000
-- RPC: CREATE REPORTER RECORD (SECURITY DEFINER)
-- Enables public community report submissions to securely insert
-- private reporter data and return ONLY the generated reporter UUID.
-- ============================================================

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
