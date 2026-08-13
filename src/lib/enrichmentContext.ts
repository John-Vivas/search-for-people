import { zonesService } from '@/src/features/map/services/zones.service';
import { locationsService } from '@/src/features/map/services/locations.service';
import {
  buildEnrichmentContext,
  zonePublicToInfo,
  type LocationInfo,
  type PersonEnrichmentContext,
} from '@/src/features/persons/mappers/person.mapper';

/** Shared zone/location lookup for persons and pets mappers */
export async function loadEnrichmentContext(): Promise<PersonEnrichmentContext> {
  const [zonesRes, locationsRes] = await Promise.all([
    zonesService.getEmergencyZones(true),
    locationsService.getLocations({ limit: 200 }),
  ]);

  const zones = (zonesRes.data ?? []).map(zonePublicToInfo);
  const locations: LocationInfo[] = (locationsRes.data ?? []).map((loc) => ({
    id: loc.id,
    address: loc.address,
    place_name: loc.place_name,
    latitude: loc.latitude,
    longitude: loc.longitude,
  }));

  return buildEnrichmentContext(zones, locations);
}
