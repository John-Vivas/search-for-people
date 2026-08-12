/** Application-wide constants */

export const APP_NAME = 'Estamos Buscando';

/** Data source for gradual mock → Supabase migration */
export type DataSourceMode = 'mock' | 'supabase';

export const QUERY_STALE_TIME = {
  /** Lists that change infrequently (zones, facilities) */
  STATIC: 5 * 60 * 1000,
  /** Person/pet/report lists */
  LIST: 60 * 1000,
  /** Detail views */
  DETAIL: 30 * 1000,
} as const;

/** TanStack Query key roots — used in hooks (Phase 3+) */
export const QUERY_KEYS = {
  emergencyZones: ['emergency-zones'] as const,
  locations: ['locations'] as const,
  facilities: ['facilities'] as const,
  persons: ['persons'] as const,
  person: (id: string) => ['persons', id] as const,
  pets: ['pets'] as const,
  pet: (id: string) => ['pets', id] as const,
  reports: ['reports'] as const,
  report: (id: string) => ['reports', id] as const,
  personEvents: (personId: string) => ['person-events', personId] as const,
  mapData: ['map-data'] as const,
} as const;

/** Default pagination */
export const DEFAULT_PAGE_SIZE = 24;

/** Public list projection for persons — never include private reporter fields */
export const PERSON_PUBLIC_COLUMNS =
  'id, zone_id, full_name, identifier_code, approximate_age, age_is_approximate, sex, status, last_seen_at, is_verified, updated_at, current_location_id, current_facility_id, last_seen_location_id' as const;

export const PET_PUBLIC_COLUMNS =
  'id, zone_id, name, species, breed, color, sex, approximate_age, status, last_seen_at, is_verified, updated_at, current_location_id, last_seen_location_id' as const;

export const EMERGENCY_ZONE_COLUMNS =
  'id, name, city, department, latitude, longitude, is_active' as const;

export const FACILITY_PUBLIC_COLUMNS =
  'id, zone_id, location_id, name, facility_type, address, is_active' as const;

export const LOCATION_COLUMNS =
  'id, zone_id, latitude, longitude, address, place_name, accuracy_meters' as const;
