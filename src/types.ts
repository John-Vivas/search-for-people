// Re-export modular types for root backwards compatibility
export * from '@/src/features/persons/types/person';
export * from '@/src/features/reports/types/reporter';
export * from '@/src/features/reports/types/report';
export * from '@/src/features/pets/types/pet';
export * from '@/src/features/admin/types/admin';

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
} from '@/src/types/enums';

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
} from '@/src/types/database';
