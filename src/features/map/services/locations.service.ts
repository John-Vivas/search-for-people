import { getSupabaseClient } from '@/src/lib/supabase';
import { isMockMode } from '@/src/lib/dataSource';
import { LOCATION_COLUMNS, DEFAULT_PAGE_SIZE } from '@/src/lib/constants';
import { ok, fail, mockApiCall, ServiceResponse } from '@/src/services/api/errors';
import type { LocationInsert, LocationPublic, LocationSearchFilters, LocationUpdate } from '@/src/features/map/types/zone.db';

export const locationsService = {
  async getLocations(
    filters: LocationSearchFilters = {}
  ): Promise<ServiceResponse<LocationPublic[]>> {
    const { zoneId, limit = DEFAULT_PAGE_SIZE, offset = 0 } = filters;

    if (isMockMode()) {
      return mockApiCall([]);
    }

    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('locations')
        .select(LOCATION_COLUMNS)
        .range(offset, offset + limit - 1);

      if (zoneId) {
        query = query.eq('zone_id', zoneId);
      }

      const { data, error, count } = await query;
      if (error) return fail(error, 'No se pudieron cargar las ubicaciones');
      return ok((data ?? []) as LocationPublic[], count ?? undefined);
    } catch (error) {
      return fail(error, 'No se pudieron cargar las ubicaciones');
    }
  },

  async getLocationById(id: string): Promise<ServiceResponse<LocationPublic | null>> {
    if (isMockMode()) {
      return mockApiCall(null);
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('locations')
        .select(LOCATION_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error) return fail(error, 'No se pudo cargar la ubicación');
      return ok(data as LocationPublic | null);
    } catch (error) {
      return fail(error, 'No se pudo cargar la ubicación');
    }
  },

  async createLocation(payload: LocationInsert): Promise<ServiceResponse<LocationPublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Creación de ubicaciones disponible con Supabase');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('locations')
        .insert(payload)
        .select(LOCATION_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo crear la ubicación');
      return ok(data as LocationPublic);
    } catch (error) {
      return fail(error, 'No se pudo crear la ubicación');
    }
  },

  async updateLocation(
    id: string,
    payload: LocationUpdate
  ): Promise<ServiceResponse<LocationPublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Actualización de ubicaciones disponible con Supabase');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('locations')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(LOCATION_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo actualizar la ubicación');
      return ok(data as LocationPublic);
    } catch (error) {
      return fail(error, 'No se pudo actualizar la ubicación');
    }
  },
};
