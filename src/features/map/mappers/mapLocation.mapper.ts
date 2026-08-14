import type { PersonEnrichmentContext } from '@/src/features/persons/mappers/person.mapper';
import type {
  PersonLocation,
  PetLocation,
  PersonMapStatus,
} from '@/src/features/map/types/map.types';
import type { PersonRecord } from '@/src/features/persons/services/persons.service';
import type { PetRecord } from '@/src/features/pets/services/pets.service';
import { toTitleCase } from '@/src/lib/formatText';

/**
 * Convierte las filas reales de personas/mascotas en puntos del mapa.
 *
 * El mapa venía con `loadLocations` en `[]` (stub "Fase 10"), por eso todas las
 * zonas contaban 0 sin importar cuántos reportes hubiera. Estas funciones
 * resuelven coordenadas y zona desde el mismo contexto de enriquecimiento que
 * usa el catálogo, y asignan `zoneId = row.zone_id` (UUID de emergency_zones)
 * para que el conteo por zona coincida con lo que ve la gente en el home.
 */

interface Geolocatable {
  zone_id: string | null;
  current_location_id: string | null;
  last_seen_location_id: string | null;
}

// `primary_photo_url` existe en la BD y en el SELECT, pero no está en el Pick
// de PersonPublic/PetPublic. Lo ampliamos aquí (opcional) sin tocar tipos globales.
type PersonMapRow = PersonRecord & { primary_photo_url?: string | null };
type PetMapRow = PetRecord & { primary_photo_url?: string | null };

/** Punto preciso de la ubicación registrada; si no, el centroide de la zona. */
function resolveCoords(
  row: Geolocatable,
  ctx: PersonEnrichmentContext
): [number, number] | null {
  const locId = row.last_seen_location_id ?? row.current_location_id;
  if (locId) {
    const loc = ctx.locationsById.get(locId);
    if (loc) return [loc.latitude, loc.longitude];
  }
  if (row.zone_id) {
    const zone = ctx.zonesById.get(row.zone_id);
    if (zone?.latitude != null && zone?.longitude != null) {
      return [zone.latitude, zone.longitude];
    }
  }
  return null;
}

function resolveZoneName(zoneId: string | null, ctx: PersonEnrichmentContext): string {
  if (!zoneId) return '';
  const zone = ctx.zonesById.get(zoneId);
  return zone ? toTitleCase(zone.city ?? zone.name) : '';
}

function personStatusToMap(status: string): PersonMapStatus {
  if (status === 'MISSING') return 'MISSING';
  if (status === 'UNIDENTIFIED') return 'UNIDENTIFIED';
  return 'FOUND';
}

/** Persona → punto del mapa. Devuelve null si no hay coordenadas resolubles. */
export function personRecordToMapLocation(
  row: PersonMapRow,
  ctx: PersonEnrichmentContext
): PersonLocation | null {
  const coords = resolveCoords(row, ctx);
  if (!coords) return null;

  return {
    type: 'PERSON',
    id: `person-${row.id}`,
    personId: row.id,
    zoneId: row.zone_id ?? '',
    zoneName: resolveZoneName(row.zone_id, ctx),
    latitude: coords[0],
    longitude: coords[1],
    status: personStatusToMap(row.status),
    name: toTitleCase(row.full_name) || 'Sin nombre',
    photo: row.primary_photo_url ?? undefined,
    lastSeenDate: row.last_seen_at ?? row.updated_at,
    updatedAt: row.updated_at,
  };
}

/** Mascota → punto del mapa. Devuelve null si no hay coordenadas resolubles. */
export function petRecordToMapLocation(
  row: PetMapRow,
  ctx: PersonEnrichmentContext
): PetLocation | null {
  const coords = resolveCoords(row, ctx);
  if (!coords) return null;

  return {
    type: 'PET',
    id: `pet-${row.id}`,
    petId: row.id,
    zoneId: row.zone_id ?? '',
    zoneName: resolveZoneName(row.zone_id, ctx),
    latitude: coords[0],
    longitude: coords[1],
    name: toTitleCase(row.name) || 'Mascota',
    photo: row.primary_photo_url ?? undefined,
    lastSeenDate: row.last_seen_at ?? row.updated_at,
    updatedAt: row.updated_at,
  };
}
