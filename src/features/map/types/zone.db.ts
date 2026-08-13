export type { FacilityType } from '@/src/types/enums';
export type {
  EmergencyZoneRow,
  LocationRow,
  FacilityRow,
} from '@/src/types/database';

/** Domain aliases */
export type EmergencyZone = import('@/src/types/database').EmergencyZoneRow;
export type Location = import('@/src/types/database').LocationRow;
export type Facility = import('@/src/types/database').FacilityRow;

export type EmergencyZonePublic = Pick<
  EmergencyZone,
  | 'id'
  | 'name'
  | 'type'
  | 'parent_id'
  | 'code'
  | 'city'
  | 'department'
  | 'country_code'
  | 'latitude'
  | 'longitude'
  | 'description'
  | 'is_active'
>;

export type LocationPublic = Pick<
  Location,
  'id' | 'zone_id' | 'latitude' | 'longitude' | 'address' | 'place_name' | 'accuracy_meters'
>;

export type FacilityPublic = Pick<
  Facility,
  'id' | 'zone_id' | 'location_id' | 'name' | 'facility_type' | 'address' | 'is_active'
>;

export type LocationInsert = Omit<Location, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type LocationUpdate = Partial<Omit<Location, 'id' | 'created_at'>>;

export type FacilityInsert = Omit<Facility, 'id' | 'created_at' | 'updated_at' | 'is_active'> & {
  id?: string;
  is_active?: boolean;
};

export interface FacilitySearchFilters {
  zoneId?: string;
  facilityType?: Facility['facility_type'];
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface LocationSearchFilters {
  zoneId?: string;
  limit?: number;
  offset?: number;
}
