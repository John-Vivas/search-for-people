import type { PersonStatus } from '@/src/features/persons/types/person.db';
import type { ItemType, PersonItem } from '@/src/features/persons/types/person';
import { toTitleCase, capitalizeFirst } from '@/src/lib/formatText';

/** Context for mapping DB rows → UI PersonItem (zones + optional locations) */
export interface ZoneInfo {
  id: string;
  name: string;
  city: string | null;
  department: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface LocationInfo {
  id: string;
  address: string | null;
  place_name: string | null;
  latitude: number;
  longitude: number;
}

export interface PersonEnrichmentContext {
  zonesById: Map<string, ZoneInfo>;
  locationsById: Map<string, LocationInfo>;
}

/** DB person row fields used by the mapper (list + detail) */
export interface PersonMappableRow {
  id: string;
  zone_id: string | null;
  full_name: string | null;
  identifier_code: string | null;
  approximate_age: number | null;
  age_is_approximate: boolean;
  sex: string | null;
  status: PersonStatus;
  last_seen_at: string | null;
  is_verified: boolean;
  updated_at: string;
  current_location_id: string | null;
  current_facility_id: string | null;
  last_seen_location_id: string | null;
  description?: string | null;
  physical_description?: string | null;
  clothing_description?: string | null;
  distinguishing_features?: string | null;
  primary_photo_url?: string | null;
}

const PLACEHOLDER_PHOTO =
  'https://placehold.co/400x400/e1e3e4/6d7a77?text=Sin+foto';

export function statusToItemType(status: PersonStatus): ItemType {
  switch (status) {
    case 'MISSING':
      return 'desaparecido';
    case 'UNIDENTIFIED':
      return 'nn';
    case 'FOUND':
    case 'IDENTIFIED':
    case 'TRANSFERRED':
    case 'REUNITED':
      return 'encontrado';
    default:
      return 'desaparecido';
  }
}

export function itemTypeToStatuses(type: string): PersonStatus[] | undefined {
  switch (type) {
    case 'desaparecido':
      return ['MISSING'];
    case 'encontrado':
      return ['FOUND', 'IDENTIFIED', 'TRANSFERRED', 'REUNITED'];
    case 'nn':
      return ['UNIDENTIFIED'];
    default:
      return undefined;
  }
}

function formatAge(approximateAge: number | null, isApproximate: boolean): string {
  if (approximateAge == null) return 'Edad no registrada';
  const suffix = isApproximate ? ' aprox.' : '';
  return `${approximateAge} años${suffix}`;
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
    const date = new Date(iso);
    const now = Date.now();
    const diffMs = now - date.getTime();
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

function resolveDisplayName(row: PersonMappableRow): string {
  if (row.full_name?.trim()) return toTitleCase(row.full_name);
  if (row.status === 'UNIDENTIFIED') {
    const code = row.identifier_code?.trim();
    if (code) return `Sin identificar ${code}`;
    return row.approximate_age != null
      ? `Persona sin identificar, ~${row.approximate_age} años`
      : 'Persona sin identificar';
  }
  return 'Nombre no registrado';
}

function resolveCode(row: PersonMappableRow): string {
  const code = row.identifier_code?.trim();
  if (code) return code.startsWith('#') ? code : `#${code}`;
  return `#${row.id.slice(0, 8).toUpperCase()}`;
}

function resolveCity(zone: ZoneInfo | undefined): string {
  if (!zone) return 'Zona no registrada';
  return toTitleCase(zone.city ?? zone.name);
}

function resolveLocationText(
  row: PersonMappableRow,
  ctx: PersonEnrichmentContext
): string {
  const locId = row.last_seen_location_id ?? row.current_location_id;
  if (locId) {
    const loc = ctx.locationsById.get(locId);
    if (loc) {
      const text = loc.place_name ?? loc.address;
      return text ? toTitleCase(text) : 'Ubicación registrada';
    }
  }
  const zone = row.zone_id ? ctx.zonesById.get(row.zone_id) : undefined;
  if (zone?.name) return toTitleCase(zone.name);
  return 'Ubicación no registrada';
}

function resolveCoordinates(
  row: PersonMappableRow,
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

export function mapPersonToItem(
  row: PersonMappableRow,
  ctx: PersonEnrichmentContext
): PersonItem {
  const zone = row.zone_id ? ctx.zonesById.get(row.zone_id) : undefined;
  const type = statusToItemType(row.status);

  const locId = row.last_seen_location_id ?? row.current_location_id;
  const hasKnownLocation = Boolean(
    (locId && ctx.locationsById.has(locId)) ||
      (zone?.latitude != null && zone?.longitude != null)
  );

  return {
    id: row.id,
    code: resolveCode(row),
    type,
    name: resolveDisplayName(row),
    age: formatAge(row.approximate_age, row.age_is_approximate),
    gender: row.sex ?? undefined,
    photo: row.primary_photo_url?.trim() ? row.primary_photo_url : PLACEHOLDER_PHOTO,
    location: resolveLocationText(row, ctx),
    city: resolveCity(zone),
    coordinates: resolveCoordinates(row, ctx),
    hasKnownLocation,
    updatedAt: formatRelativeUpdatedAt(row.updated_at),
    lastSeenDate: formatDisplayDate(row.last_seen_at ?? row.updated_at),
    verified: row.is_verified,
    description: capitalizeFirst(row.description) || undefined,
    physique: capitalizeFirst(row.physical_description) || undefined,
    clothing: capitalizeFirst(row.clothing_description) || undefined,
    additionalDetails: capitalizeFirst(row.description) || undefined,
    distinctiveFeatures: capitalizeFirst(row.distinguishing_features) || undefined,
    tattoo: capitalizeFirst(row.distinguishing_features) || undefined,
  };
}

export function mapPersonsToItems(
  rows: PersonMappableRow[],
  ctx: PersonEnrichmentContext
): PersonItem[] {
  return rows.map((row) => mapPersonToItem(row, ctx));
}

export function buildEnrichmentContext(
  zones: ZoneInfo[],
  locations: LocationInfo[] = []
): PersonEnrichmentContext {
  return {
    zonesById: new Map(zones.map((z) => [z.id, z])),
    locationsById: new Map(locations.map((l) => [l.id, l])),
  };
}

export function zonePublicToInfo(zone: {
  id: string;
  name: string;
  city: string | null;
  department: string | null;
  latitude: number | null;
  longitude: number | null;
}): ZoneInfo {
  return {
    id: zone.id,
    name: zone.name,
    city: zone.city,
    department: zone.department,
    latitude: zone.latitude,
    longitude: zone.longitude,
  };
}

/** Resolve UI city name filter → zone UUID for Supabase queries */
export function resolveZoneIdByCityName(
  cityName: string,
  zones: ZoneInfo[]
): string | undefined {
  const normalized = cityName.trim().toLowerCase();
  const match = zones.find(
    (z) =>
      z.city?.toLowerCase() === normalized ||
      z.name.toLowerCase() === normalized
  );
  return match?.id;
}
