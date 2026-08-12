export type {
  PersonStatus,
  PetStatus,
  ReportStatus,
  ReportType,
  FacilityType,
  PersonEventType,
  MediaType,
  ReporterType,
  UserRole,
} from '../../../types/enums';

export type {
  PersonRow,
  PetRow,
  ReportRow,
  EmergencyZoneRow,
  LocationRow,
  FacilityRow,
  PersonEventRow,
  ReportMediaRow,
  ProfileRow,
  ReporterRow,
  OrganizationRow,
} from '../../../types/database';

/** Domain alias — maps to persons table */
export type Person = import('../../../types/database').PersonRow;

/** Fields safe for public list/detail views */
export type PersonPublic = Pick<
  Person,
  | 'id'
  | 'zone_id'
  | 'full_name'
  | 'identifier_code'
  | 'approximate_age'
  | 'age_is_approximate'
  | 'sex'
  | 'status'
  | 'last_seen_at'
  | 'is_verified'
  | 'updated_at'
  | 'current_location_id'
  | 'current_facility_id'
  | 'last_seen_location_id'
>;

export type PersonInsert = Omit<
  Person,
  'id' | 'created_at' | 'updated_at' | 'is_verified' | 'age_is_approximate'
> & {
  id?: string;
  is_verified?: boolean;
  age_is_approximate?: boolean;
};

export type PersonUpdate = Partial<Omit<Person, 'id' | 'created_at'>>;

export interface PersonSearchFilters {
  query?: string;
  status?: Person['status'] | Person['status'][];
  zoneId?: string;
  lastSeenAfter?: string;
  lastSeenBefore?: string;
  isVerified?: boolean;
  limit?: number;
  offset?: number;
}
