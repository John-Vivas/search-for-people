import type {
  FacilityType,
  MediaType,
  OrganizationType,
  PersonEventType,
  PersonStatus,
  PetStatus,
  ReportStatus,
  ReportType,
  ReporterType,
  UserRole,
} from './enums';

export interface OrganizationRow {
  id: string;
  name: string;
  type: OrganizationType;
  description: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  organization_id: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmergencyZoneRow {
  id: string;
  name: string;
  city: string;
  department: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationRow {
  id: string;
  zone_id: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  place_name: string | null;
  accuracy_meters: number | null;
  created_at: string;
  updated_at: string;
}

export interface FacilityRow {
  id: string;
  zone_id: string | null;
  location_id: string | null;
  name: string;
  facility_type: FacilityType;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** PRIVATE — never expose in public UI */
export interface ReporterRow {
  id: string;
  profile_id: string | null;
  reporter_type: ReporterType;
  full_name: string;
  identification_number: string | null;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonRow {
  id: string;
  zone_id: string | null;
  current_location_id: string | null;
  current_facility_id: string | null;
  last_seen_location_id: string | null;
  full_name: string | null;
  identifier_code: string | null;
  date_of_birth: string | null;
  approximate_age: number | null;
  age_is_approximate: boolean;
  sex: string | null;
  description: string | null;
  physical_description: string | null;
  clothing_description: string | null;
  distinguishing_features: string | null;
  status: PersonStatus;
  last_seen_at: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PetRow {
  id: string;
  zone_id: string | null;
  current_location_id: string | null;
  last_seen_location_id: string | null;
  name: string | null;
  species: string;
  breed: string | null;
  color: string | null;
  sex: string | null;
  approximate_age: number | null;
  description: string | null;
  status: PetStatus;
  last_seen_at: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportRow {
  id: string;
  reporter_id: string;
  report_type: ReportType;
  person_id: string | null;
  pet_id: string | null;
  description: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface PersonEventRow {
  id: string;
  person_id: string;
  event_type: PersonEventType;
  location_id: string | null;
  facility_id: string | null;
  description: string | null;
  event_at: string;
  created_by: string | null;
  created_at: string;
}

export interface ReportMediaRow {
  id: string;
  report_id: string | null;
  person_id: string | null;
  pet_id: string | null;
  storage_bucket: string;
  storage_path: string;
  media_type: MediaType;
  mime_type: string | null;
  file_size_bytes: number | null;
  is_primary: boolean;
  created_at: string;
}

export interface OrganizationMemberRow {
  id: string;
  organization_id: string;
  profile_id: string;
  role: string | null;
  is_active: boolean;
  joined_at: string;
  created_at: string;
}

/** Helper for Supabase typed client table definitions */
type TableDef<Row> = {
  Row: Row;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

/** Supabase Database type for typed client */
export interface Database {
  public: {
    Tables: {
      organizations: TableDef<OrganizationRow>;
      profiles: TableDef<ProfileRow>;
      emergency_zones: TableDef<EmergencyZoneRow>;
      locations: TableDef<LocationRow>;
      facilities: TableDef<FacilityRow>;
      reporters: TableDef<ReporterRow>;
      persons: TableDef<PersonRow>;
      pets: TableDef<PetRow>;
      reports: TableDef<ReportRow>;
      person_events: TableDef<PersonEventRow>;
      report_media: TableDef<ReportMediaRow>;
      organization_members: TableDef<OrganizationMemberRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      organization_type: OrganizationType;
      reporter_type: ReporterType;
      report_type: ReportType;
      report_status: ReportStatus;
      person_status: PersonStatus;
      pet_status: PetStatus;
      facility_type: FacilityType;
      person_event_type: PersonEventType;
      media_type: MediaType;
    };
    CompositeTypes: Record<string, never>;
  };
}
