import { getSupabaseClient } from '@/src/lib/supabase';
import { isMockMode } from '@/src/lib/dataSource';
import { FACILITY_PUBLIC_COLUMNS, DEFAULT_PAGE_SIZE } from '@/src/lib/constants';
import { ok, fail, mockApiCall, ServiceResponse } from '@/src/services/api/errors';
import type {
  FacilityInsert,
  FacilityPublic,
  FacilitySearchFilters,
  FacilityType,
} from '@/src/features/map/types/zone.db';

export const facilitiesService = {
  /** Registro comunitario de un centro (atención o acopio) vía RPC. */
  async createCommunityFacility(input: {
    name: string;
    facilityType: FacilityType;
    zoneId?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<ServiceResponse<FacilityPublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Registro disponible con Supabase');
    }
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('create_community_facility', {
        p_name: input.name,
        p_facility_type: input.facilityType,
        p_zone_id: input.zoneId ?? null,
        p_address: input.address ?? null,
        p_latitude: input.latitude ?? null,
        p_longitude: input.longitude ?? null,
      });
      if (error) return fail(error, 'No se pudo registrar el centro');
      return ok(data as FacilityPublic);
    } catch (error) {
      return fail(error, 'No se pudo registrar el centro');
    }
  },

  async getFacilities(
    filters: FacilitySearchFilters = {}
  ): Promise<ServiceResponse<FacilityPublic[]>> {
    const {
      zoneId,
      facilityType,
      isActive = true,
      limit = DEFAULT_PAGE_SIZE,
      offset = 0,
    } = filters;

    if (isMockMode()) {
      return mockApiCall([]);
    }

    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('facilities')
        .select(FACILITY_PUBLIC_COLUMNS)
        .range(offset, offset + limit - 1);

      if (zoneId) query = query.eq('zone_id', zoneId);
      if (facilityType) query = query.eq('facility_type', facilityType);
      if (isActive !== undefined) query = query.eq('is_active', isActive);

      const { data, error, count } = await query;
      if (error) return fail(error, 'No se pudieron cargar los centros de atención');
      return ok((data ?? []) as FacilityPublic[], count ?? undefined);
    } catch (error) {
      return fail(error, 'No se pudieron cargar los centros de atención');
    }
  },

  async getFacilityById(id: string): Promise<ServiceResponse<FacilityPublic | null>> {
    if (isMockMode()) {
      return mockApiCall(null);
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('facilities')
        .select(FACILITY_PUBLIC_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error) return fail(error, 'No se pudo cargar el centro de atención');
      return ok(data as FacilityPublic | null);
    } catch (error) {
      return fail(error, 'No se pudo cargar el centro de atención');
    }
  },

  async createFacility(payload: FacilityInsert): Promise<ServiceResponse<FacilityPublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Creación de centros disponible con Supabase');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('facilities')
        .insert(payload)
        .select(FACILITY_PUBLIC_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo crear el centro de atención');
      return ok(data as FacilityPublic);
    } catch (error) {
      return fail(error, 'No se pudo crear el centro de atención');
    }
  },
};
