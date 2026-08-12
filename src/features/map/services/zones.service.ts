import { getSupabaseClient } from '../../../lib/supabase';
import { isMockMode } from '../../../lib/dataSource';
import {
  EMERGENCY_ZONE_COLUMNS,
} from '../../../lib/constants';
import { ok, fail, mockApiCall, ServiceResponse } from '../../../services/api/errors';
import { EMERGENCY_ZONES } from '../../../data/mock/emergencyZones';
import type { EmergencyZone, EmergencyZonePublic } from '../types/zone.db';

function toDbZone(mock: (typeof EMERGENCY_ZONES)[number]): EmergencyZone {
  return {
    id: mock.id,
    name: mock.name,
    city: mock.name,
    department: mock.department,
    latitude: mock.latitude,
    longitude: mock.longitude,
    is_active: mock.active,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const zonesService = {
  async getEmergencyZones(activeOnly = true): Promise<ServiceResponse<EmergencyZonePublic[]>> {
    if (isMockMode()) {
      const zones = EMERGENCY_ZONES.map(toDbZone).map(
        ({ id, name, city, department, latitude, longitude, is_active }) => ({
          id,
          name,
          city,
          department,
          latitude,
          longitude,
          is_active,
        })
      );
      return mockApiCall(activeOnly ? zones.filter((z) => z.is_active) : zones);
    }

    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('emergency_zones')
        .select(EMERGENCY_ZONE_COLUMNS)
        .order('name', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) return fail(error, 'No se pudieron cargar las zonas de emergencia');
      return ok(data ?? []);
    } catch (error) {
      return fail(error, 'No se pudieron cargar las zonas de emergencia');
    }
  },

  async getEmergencyZoneById(id: string): Promise<ServiceResponse<EmergencyZone | null>> {
    if (isMockMode()) {
      const found = EMERGENCY_ZONES.find((z) => z.id === id);
      return mockApiCall(found ? toDbZone(found) : null);
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('emergency_zones')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) return fail(error, 'No se pudo cargar la zona');
      return ok(data);
    } catch (error) {
      return fail(error, 'No se pudo cargar la zona');
    }
  },

  async getEmergencyZoneByName(name: string): Promise<ServiceResponse<EmergencyZone | null>> {
    if (isMockMode()) {
      const found = EMERGENCY_ZONES.find(
        (z) => z.name.toLowerCase() === name.toLowerCase()
      );
      return mockApiCall(found ? toDbZone(found) : null);
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('emergency_zones')
        .select('*')
        .ilike('name', name)
        .maybeSingle();

      if (error) return fail(error, 'No se pudo cargar la zona');
      return ok(data);
    } catch (error) {
      return fail(error, 'No se pudo cargar la zona');
    }
  },
};
