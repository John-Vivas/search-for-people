import {
  EmergencyZone,
  MapFilter,
  MapLocation,
  PersonMapStatus,
  MapLocationType,
} from '../types/map.types';
import { EMERGENCY_ZONES } from '../../../data/mock/emergencyZones';
import { MOCK_MAP_LOCATIONS } from '../../../data/mock/mapLocations.mock';
import { SupabaseResponse } from '../../../services/api/supabase';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export const mapService = {
  async getEmergencyZones(): Promise<SupabaseResponse<EmergencyZone[]>> {
    await delay();
    return { data: EMERGENCY_ZONES, error: null };
  },

  async getMapLocations(): Promise<SupabaseResponse<MapLocation[]>> {
    await delay();
    return { data: MOCK_MAP_LOCATIONS, error: null };
  },

  async getLocationsByZone(zoneId: string): Promise<SupabaseResponse<MapLocation[]>> {
    await delay();
    const data = MOCK_MAP_LOCATIONS.filter((l) => l.zoneId === zoneId);
    return { data, error: null };
  },

  async getLocationsByStatus(
    status: PersonMapStatus
  ): Promise<SupabaseResponse<MapLocation[]>> {
    await delay();
    const data = MOCK_MAP_LOCATIONS.filter(
      (l) => l.type === 'PERSON' && l.status === status
    );
    return { data, error: null };
  },

  async getLocationsByType(
    type: MapLocationType
  ): Promise<SupabaseResponse<MapLocation[]>> {
    await delay();
    const data = MOCK_MAP_LOCATIONS.filter((l) => l.type === type);
    return { data, error: null };
  },

  /** Carga completa para la vista del mapa */
  async getMapData(): Promise<
    SupabaseResponse<{ zones: EmergencyZone[]; locations: MapLocation[] }>
  > {
    await delay();
    return {
      data: { zones: EMERGENCY_ZONES, locations: MOCK_MAP_LOCATIONS },
      error: null,
    };
  },
};

export function filterMapLocations(
  locations: MapLocation[],
  filters: MapFilter
): MapLocation[] {
  return locations.filter((loc) => {
    if (filters.zoneId !== 'ALL' && loc.zoneId !== filters.zoneId) return false;

    if (filters.type !== 'ALL' && loc.type !== filters.type) return false;

    if (filters.status !== 'ALL') {
      if (loc.type !== 'PERSON') return false;
      if (loc.status !== filters.status) return false;
    }

    return true;
  });
}
