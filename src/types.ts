// Re-export modular types for root backwards compatibility
export * from './features/persons/types/person';
export * from './features/reports/types/reporter';
export * from './features/reports/types/report';
export * from './features/pets/types/pet';
export * from './features/admin/types/admin';

// Supabase / database domain types (Phase 1+)
export type {
  UserRole,
  OrganizationType,
  ReportType,
  ReportStatus,
  PersonStatus,
  PetStatus,
  FacilityType,
  PersonEventType,
  MediaType,
} from './types/enums';

export type {
  OrganizationRow,
  ProfileRow,
  EmergencyZoneRow,
  LocationRow,
  FacilityRow,
  ReporterRow,
  PersonRow,
  PetRow,
  ReportRow,
  PersonEventRow,
  ReportMediaRow,
  OrganizationMemberRow,
  Database,
} from './types/database';
