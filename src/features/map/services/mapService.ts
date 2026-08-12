import {
  EmergencyZone,
  MapFilter,
  MapLocation,
  PersonMapStatus,
  MapLocationType,
} from '../types/map.types';
import { EMERGENCY_ZONE_TREE } from '../../../data/mock/emergencyZones';
import { MOCK_MAP_LOCATIONS } from '../../../data/mock/mapLocations.mock';
import { isMockMode } from '../../../lib/dataSource';
import { mockApiCall, ok, fail, ServiceResponse } from '../../../services/api/errors';
import { zonesService } from './zones.service';
import { locationMatchesZoneFilter } from '../utils/zoneTree';
import { resolveZoneId as mapLegacyZoneId } from '../utils/zoneMappers';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

async function loadZones(): Promise<ServiceResponse<EmergencyZone[]>> {
  if (isMockMode()) {
    await delay();
    return ok(EMERGENCY_ZONE_TREE);
  }

  const res = await zonesService.getEmergencyZoneTree();
  if (res.error || !res.data) {
    return fail(res.error, 'No se pudieron cargar las zonas del mapa');
  }
  return ok(res.data);
}

async function loadLocations(zones: EmergencyZone[]): Promise<MapLocation[]> {
  if (isMockMode()) {
    await delay();
    return MOCK_MAP_LOCATIONS;
  }

  // Locations desde Supabase — Fase 10; mientras tanto vacío
  return [];
}

/** Remapea zoneId legacy (slug) a UUID cuando hay datos en Supabase */
function remapLocationsToZoneIds(
  locations: MapLocation[],
  codeToId: Map<string, string>
): MapLocation[] {
  if (codeToId.size === 0) return locations;

  return locations.map((loc) => ({
    ...loc,
    zoneId: mapLegacyZoneId(loc.zoneId, codeToId),
  }));
}

export const mapService = {
  async getEmergencyZones(): Promise<ServiceResponse<EmergencyZone[]>> {
    return loadZones();
  },

  async getMapLocations(): Promise<ServiceResponse<MapLocation[]>> {
    const zonesRes = await loadZones();
    if (zonesRes.error || !zonesRes.data) {
      return fail(zonesRes.error, 'No se pudieron cargar ubicaciones del mapa');
    }
    const locations = await loadLocations(zonesRes.data);
    return ok(locations);
  },

  async getLocationsByZone(zoneId: string): Promise<ServiceResponse<MapLocation[]>> {
    const zonesRes = await loadZones();
    if (zonesRes.error || !zonesRes.data) {
      return fail(zonesRes.error, 'No se pudieron cargar ubicaciones');
    }

    let locations = await loadLocations(zonesRes.data);
    if (!isMockMode()) {
      const codeMapRes = await zonesService.getZoneCodeMap();
      if (codeMapRes.data) {
        locations = remapLocationsToZoneIds(locations, codeMapRes.data);
        zoneId = mapLegacyZoneId(zoneId, codeMapRes.data);
      }
    }

    const data = locations.filter((l) =>
      locationMatchesZoneFilter(l, zoneId, 'ALL', zonesRes.data!)
    );
    return ok(data);
  },

  async getLocationsByDepartment(
    departmentId: string
  ): Promise<ServiceResponse<MapLocation[]>> {
    const zonesRes = await loadZones();
    if (zonesRes.error || !zonesRes.data) {
      return fail(zonesRes.error, 'No se pudieron cargar ubicaciones');
    }

    let locations = await loadLocations(zonesRes.data);
    if (!isMockMode()) {
      const codeMapRes = await zonesService.getZoneCodeMap();
      if (codeMapRes.data) {
        locations = remapLocationsToZoneIds(locations, codeMapRes.data);
        departmentId = mapLegacyZoneId(departmentId, codeMapRes.data);
      }
    }

    const data = locations.filter((l) =>
      locationMatchesZoneFilter(l, 'ALL', departmentId, zonesRes.data!)
    );
    return ok(data);
  },

  async getLocationsByStatus(
    status: PersonMapStatus
  ): Promise<ServiceResponse<MapLocation[]>> {
    const res = await this.getMapLocations();
    if (res.error || !res.data) return res;
    const data = res.data.filter((l) => l.type === 'PERSON' && l.status === status);
    return ok(data);
  },

  async getLocationsByType(
    type: MapLocationType
  ): Promise<ServiceResponse<MapLocation[]>> {
    const res = await this.getMapLocations();
    if (res.error || !res.data) return res;
    const data = res.data.filter((l) => l.type === type);
    return ok(data);
  },

  async getMapData(): Promise<
    ServiceResponse<{ zones: EmergencyZone[]; locations: MapLocation[] }>
  > {
    const zonesRes = await loadZones();
    if (zonesRes.error || !zonesRes.data) {
      return fail(zonesRes.error, 'No se pudieron cargar los datos del mapa');
    }

    const locations = await loadLocations(zonesRes.data);
    return ok({ zones: zonesRes.data, locations });
  },
};

export function filterMapLocations(
  locations: MapLocation[],
  filters: MapFilter,
  zones: EmergencyZone[] = EMERGENCY_ZONE_TREE
): MapLocation[] {
  return locations.filter((loc) => {
    if (
      !locationMatchesZoneFilter(
        loc,
        filters.zoneId,
        filters.departmentId,
        zones
      )
    ) {
      return false;
    }

    if (filters.type !== 'ALL' && loc.type !== filters.type) return false;

    if (filters.status !== 'ALL') {
      if (loc.type !== 'PERSON') return false;
      if (loc.status !== filters.status) return false;
    }

    return true;
  });
}
