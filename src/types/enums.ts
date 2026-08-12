/** PostgreSQL enum types — mirror of public schema enums */

export type UserRole = 'USER' | 'VOLUNTEER' | 'MODERATOR' | 'ADMIN';

export type OrganizationType =
  | 'NGO'
  | 'VOLUNTEER_GROUP'
  | 'COMMUNITY'
  | 'PRIVATE'
  | 'GOVERNMENT'
  | 'OTHER';

export type ReporterType = 'FAMILY' | 'WITNESS' | 'VOLUNTEER' | 'OTHER';

export type ReportType =
  | 'MISSING_PERSON'
  | 'FOUND_PERSON'
  | 'UNIDENTIFIED_PERSON'
  | 'LOST_PET'
  | 'FOUND_PET';

export type ReportStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DUPLICATE';

export type PersonStatus =
  | 'MISSING'
  | 'FOUND'
  | 'UNIDENTIFIED'
  | 'IDENTIFIED'
  | 'TRANSFERRED'
  | 'REUNITED';

export type PetStatus = 'LOST' | 'FOUND' | 'REUNITED';

export type FacilityType =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'SHELTER'
  | 'EMERGENCY_CENTER'
  | 'MORGUE'
  | 'OTHER';

export type PersonEventType =
  | 'REPORTED_MISSING'
  | 'FOUND'
  | 'IDENTITY_CONFIRMED'
  | 'TRANSFERRED'
  | 'ARRIVED_AT_FACILITY'
  | 'LOCATION_UPDATED'
  | 'REUNITED'
  | 'STATUS_UPDATED';

export type MediaType =
  | 'PERSON_PHOTO'
  | 'PET_PHOTO'
  | 'REPORT_ATTACHMENT'
  | 'DOCUMENT'
  | 'OTHER';
