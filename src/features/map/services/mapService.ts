import {
  EmergencyZone,
  MapFilter,
  MapLocation,
  PersonMapStatus,
  MapLocationType,
} from '@/src/features/map/types/map.types';
import { EMERGENCY_ZONE_TREE } from '@/src/data/mock/emergencyZones';
import { MOCK_MAP_LOCATIONS } from '@/src/data/mock/mapLocations.mock';
import { isMockMode } from '@/src/lib/dataSource';
import { mockApiCall, ok, fail, ServiceResponse } from '@/src/services/api/errors';
import { zonesService } from '@/src/features/map/services/zones.service';
import { locationMatchesZoneFilter } from '@/src/features/map/utils/zoneTree';
import { resolveZoneId as mapLegacyZoneId } from '@/src/features/map/utils/zoneMappers';
import { facilitiesService } from '@/src/features/map/services/facilities.service';
import { loadCatalogRecords } from '@/src/lib/catalogRows';
import { loadEnrichmentContext } from '@/src/lib/enrichmentContext';
import {
  personRecordToMapLocation,
  petRecordToMapLocation,
  facilityRecordToMapLocation,
} from '@/src/features/map/mappers/mapLocation.mapper';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

type MapData = { zones: EmergencyZone[]; locations: MapLocation[] };
const MAP_TTL_MS = 60 * 1000; // caché corta: evita refetch en re-renders / re-navegación
let mapDataCache: { data: MapData; at: number } | null = null;
let mapDataInflight: Promise<ServiceResponse<MapData>> | null = null;

/** Descarta la caché del mapa (p. ej. tras registrar una zona/centro). */
export function invalidateMapData(): void {
  mapDataCache = null;
  mapDataInflight = null;
}

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

async function loadLocations(_zones: EmergencyZone[]): Promise<MapLocation[]> {
  if (isMockMode()) {
    await delay();
    return MOCK_MAP_LOCATIONS;
  }

  // Datos reales: personas + mascotas → puntos del mapa. Comparte el contexto
  // de enriquecimiento (zonas + ubicaciones) con el catálogo (cacheado).
  // Personas + mascotas: filas compartidas con el catálogo (sin doble consulta).
  const [ctx, records, facilitiesRes] = await Promise.all([
    loadEnrichmentContext(),
    loadCatalogRecords(),
    facilitiesService.getFacilities({ limit: 1000 }),
  ]);

  const persons = records.persons
    .map((row) => personRecordToMapLocation(row, ctx))
    .filter((l): l is Exclude<typeof l, null> => l !== null);

  const pets = records.pets
    .map((row) => petRecordToMapLocation(row, ctx))
    .filter((l): l is Exclude<typeof l, null> => l !== null);

  const facilities = (facilitiesRes.data ?? [])
    .map((row) => facilityRecordToMapLocation(row, ctx))
    .filter((l): l is Exclude<typeof l, null> => l !== null);

  return [...persons, ...pets, ...facilities];
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

  async getMapData(): Promise<ServiceResponse<MapData>> {
    if (isMockMode()) {
      const zonesRes = await loadZones();
      if (zonesRes.error || !zonesRes.data) {
        return fail(zonesRes.error, 'No se pudieron cargar los datos del mapa');
      }
      const locations = await loadLocations(zonesRes.data);
      return ok({ zones: zonesRes.data, locations });
    }

    // Caché corta + dedupe: re-renders o navegar y volver no vuelven a pegarle
    // a Supabase. Se invalida al registrar (invalidateMapData).
    if (mapDataCache && Date.now() - mapDataCache.at < MAP_TTL_MS) {
      return ok(mapDataCache.data);
    }
    if (mapDataInflight) return mapDataInflight;

    mapDataInflight = (async (): Promise<ServiceResponse<MapData>> => {
      const zonesRes = await loadZones();
      if (zonesRes.error || !zonesRes.data) {
        return fail(zonesRes.error, 'No se pudieron cargar los datos del mapa');
      }
      const locations = await loadLocations(zonesRes.data);
      const data: MapData = { zones: zonesRes.data, locations };
      mapDataCache = { data, at: Date.now() };
      return ok(data);
    })().finally(() => {
      mapDataInflight = null;
    });

    return mapDataInflight;
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
