-- ============================================================
-- ESTAMOS BUSCANDO — Migration 20250813220000
-- Confirmación de entrega de dos lados para el tablero de ayuda.
-- El proveedor marca "Entregada" → estado DELIVERED_PENDING
-- (esperando confirmación); el solicitante confirma → DELIVERED.
-- Si no la recibió, vuelve a EN_ROUTE.
-- Ejecutar en: Supabase Dashboard → SQL Editor.
-- ============================================================

-- ── 1. Nuevo estado intermedio ──
alter type public.aid_status add value if not exists 'DELIVERED_PENDING' before 'DELIVERED';

-- ── 2. Marca de cuándo el proveedor reportó la entrega ──
alter table public.aid_requests
    add column if not exists delivery_reported_at timestamptz;

-- ── 3. advance_aid_request acepta el nuevo estado ──
-- Se comparan estados con ::text para no incrustar el literal de enum
-- recién creado dentro de la función (evita "unsafe use of new value").
create or replace function public.advance_aid_request(
    p_id uuid,
    p_status public.aid_status
)
returns public.aid_requests
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.aid_requests;
begin
    if p_status::text not in ('EN_ROUTE', 'DELIVERED_PENDING', 'DELIVERED', 'CANCELLED') then
        raise exception 'Transición no permitida: %', p_status;
    end if;

    update public.aid_requests
    set status = p_status,
        delivery_reported_at = case
            when p_status::text = 'DELIVERED_PENDING' then now()
            else delivery_reported_at
        end,
        delivered_at = case
            when p_status::text = 'DELIVERED' then now()
            else delivered_at
        end,
        updated_at = now()
    where id = p_id
    returning * into v_row;

    if v_row.id is null then
        raise exception 'La solicitud no existe';
    end if;
    return v_row;
end;
$$;
