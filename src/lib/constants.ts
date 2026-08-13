/** Application-wide constants */

export const APP_NAME = 'Estamos Buscando';

/** Data source for gradual mock → Supabase migration */
export type DataSourceMode = 'mock' | 'supabase';

/** Default pagination */
export const DEFAULT_PAGE_SIZE = 24;

/** Public list projection for persons — never include private reporter fields */
export const PERSON_PUBLIC_COLUMNS =
  'id, zone_id, full_name, identifier_code, approximate_age, age_is_approximate, sex, status, last_seen_at, is_verified, updated_at, current_location_id, current_facility_id, last_seen_location_id, primary_photo_url' as const;

export const PERSON_DETAIL_COLUMNS =
  `${PERSON_PUBLIC_COLUMNS}, description, physical_description, clothing_description, distinguishing_features` as const;

export const PET_PUBLIC_COLUMNS =
  'id, zone_id, name, species, breed, color, sex, approximate_age, status, last_seen_at, is_verified, updated_at, current_location_id, last_seen_location_id, primary_photo_url' as const;

export const PET_DETAIL_COLUMNS = `${PET_PUBLIC_COLUMNS}, description` as const;

export const EMERGENCY_ZONE_COLUMNS_FLAT =
  'id, name, city, department, latitude, longitude, is_active' as const;

export const EMERGENCY_ZONE_COLUMNS_HIERARCHICAL =
  'id, code, name, type, parent_id, city, department, country_code, latitude, longitude, description, is_active' as const;

/** Prefer hierarchical; services fall back to flat if columns missing */
export const EMERGENCY_ZONE_COLUMNS = EMERGENCY_ZONE_COLUMNS_HIERARCHICAL;

export const FACILITY_PUBLIC_COLUMNS =
  'id, zone_id, location_id, name, facility_type, address, is_active' as const;

export const LOCATION_COLUMNS =
  'id, zone_id, latitude, longitude, address, place_name, accuracy_meters' as const;
