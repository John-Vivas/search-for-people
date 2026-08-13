import type { PetStatus } from '@/src/features/pets/types/pet.db';
import type { PersonItem } from '@/src/features/persons/types/person';
import type {
  PersonEnrichmentContext,
  ZoneInfo,
} from '@/src/features/persons/mappers/person.mapper';

/** DB pet row fields used by the mapper */
export interface PetMappableRow {
  id: string;
  zone_id: string | null;
  name: string | null;
  species: string;
  breed: string | null;
  color: string | null;
  sex: string | null;
  approximate_age: number | null;
  status: PetStatus;
  last_seen_at: string | null;
  is_verified: boolean;
  updated_at: string;
  current_location_id: string | null;
  last_seen_location_id: string | null;
  description?: string | null;
  primary_photo_url?: string | null;
}

const PLACEHOLDER_PHOTO =
  'https://placehold.co/400x400/e1e3e4/735802?text=Mascota';

function formatAge(approximateAge: number | null): string {
  if (approximateAge == null) return 'Edad no registrada';
  return `${approximateAge} años aprox.`;
}

function formatDisplayDate(iso: string | null): string {
  if (!iso) return 'Fecha no registrada';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatRelativeUpdatedAt(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Actualizado ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
    return formatDisplayDate(iso);
  } catch {
    return iso;
  }
}

function resolveDisplayName(row: PetMappableRow): string {
  if (row.name?.trim()) return row.name.trim();
  const species = row.species?.trim() || 'Mascota';
  const breed = row.breed?.trim();
  return breed ? `${species} (${breed})` : species;
}

function resolveCode(row: PetMappableRow): string {
  return `#PET-${row.id.slice(0, 8).toUpperCase()}`;
}

function resolveCity(zone: ZoneInfo | undefined): string {
  if (!zone) return 'Zona no registrada';
  return zone.city ?? zone.name;
}

function resolveLocationText(
  row: PetMappableRow,
  ctx: PersonEnrichmentContext
): string {
  const locId = row.last_seen_location_id ?? row.current_location_id;
  if (locId) {
    const loc = ctx.locationsById.get(locId);
    if (loc) return loc.place_name ?? loc.address ?? 'Ubicación registrada';
  }
  const zone = row.zone_id ? ctx.zonesById.get(row.zone_id) : undefined;
  return zone?.name ?? 'Ubicación no registrada';
}

function resolveCoordinates(
  row: PetMappableRow,
  ctx: PersonEnrichmentContext
): [number, number] {
  const locId = row.last_seen_location_id ?? row.current_location_id;
  if (locId) {
    const loc = ctx.locationsById.get(locId);
    if (loc) return [loc.latitude, loc.longitude];
  }
  const zone = row.zone_id ? ctx.zonesById.get(row.zone_id) : undefined;
  if (zone?.latitude != null && zone?.longitude != null) {
    return [zone.latitude, zone.longitude];
  }
  return [4.5709, -74.2973];
}

function mapSex(sex: string | null): string | undefined {
  if (!sex) return undefined;
  const normalized = sex.toLowerCase();
  if (normalized === 'm' || normalized === 'male' || normalized === 'macho') return 'Macho';
  if (normalized === 'f' || normalized === 'female' || normalized === 'hembra') return 'Hembra';
  return sex;
}

export function petStatusLabel(status: PetStatus): string {
  switch (status) {
    case 'LOST':
      return 'Perdida';
    case 'FOUND':
      return 'Encontrada';
    case 'REUNITED':
      return 'Reunida';
    default:
      return status;
  }
}

export function mapPetToItem(
  row: PetMappableRow,
  ctx: PersonEnrichmentContext
): PersonItem {
  const zone = row.zone_id ? ctx.zonesById.get(row.zone_id) : undefined;
  const details = [
    row.species,
    row.breed,
    row.color,
    row.description,
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    id: row.id,
    code: resolveCode(row),
    type: 'mascota',
    name: resolveDisplayName(row),
    age: formatAge(row.approximate_age),
    gender: mapSex(row.sex),
    photo: row.primary_photo_url?.trim() ? row.primary_photo_url : PLACEHOLDER_PHOTO,
    location: resolveLocationText(row, ctx),
    city: resolveCity(zone),
    coordinates: resolveCoordinates(row, ctx),
    updatedAt: formatRelativeUpdatedAt(row.updated_at),
    lastSeenDate: formatDisplayDate(row.last_seen_at ?? row.updated_at),
    verified: row.is_verified,
    description: row.description ?? undefined,
    additionalDetails: details || undefined,
    distinctiveFeatures: row.color ? `Color: ${row.color}` : undefined,
  };
}

export function mapPetsToItems(
  rows: PetMappableRow[],
  ctx: PersonEnrichmentContext
): PersonItem[] {
  return rows.map((row) => mapPetToItem(row, ctx));
}

/** UI filter → pet statuses */
export function petFilterToStatuses(filter?: string): PetStatus[] | undefined {
  switch (filter) {
    case 'perdida':
    case 'perdidas':
      return ['LOST'];
    case 'encontrada':
    case 'encontradas':
      return ['FOUND'];
    case 'reunida':
      return ['REUNITED'];
    default:
      return undefined;
  }
}
