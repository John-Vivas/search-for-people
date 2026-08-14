import { zonesService } from '@/src/features/map/services/zones.service';
import { locationsService } from '@/src/features/map/services/locations.service';
import {
  buildEnrichmentContext,
  zonePublicToInfo,
  type LocationInfo,
  type PersonEnrichmentContext,
} from '@/src/features/persons/mappers/person.mapper';

/**
 * The enrichment context (zones + locations) changes rarely but was fetched on
 * every persons/pets mapping — meaning a single catalog load hit Supabase for
 * zones + locations several times, and every detail view re-fetched it. Under
 * load that multiplied fast.
 *
 * This caches the result (short TTL) and de-duplicates concurrent calls, so a
 * catalog load does ONE zones+locations fetch that persons, pets and detail
 * views all reuse. Call `invalidateEnrichmentContext()` after creating data
 * that adds a location/zone so the next load picks it up.
 */
const TTL_MS = 5 * 60 * 1000;

let cache: { ctx: PersonEnrichmentContext; at: number } | null = null;
let inflight: Promise<PersonEnrichmentContext> | null = null;

async function fetchContext(): Promise<PersonEnrichmentContext> {
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

/** Shared zone/location lookup for persons and pets mappers (cached + deduped). */
export async function loadEnrichmentContext(
  force = false
): Promise<PersonEnrichmentContext> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) {
    return cache.ctx;
  }
  // De-dupe concurrent callers (e.g. persons + pets loading in parallel).
  if (!force && inflight) return inflight;

  inflight = fetchContext()
    .then((ctx) => {
      cache = { ctx, at: Date.now() };
      return ctx;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Drop the cache so the next load re-fetches (e.g. after a new report). */
export function invalidateEnrichmentContext(): void {
  cache = null;
  inflight = null;
}
