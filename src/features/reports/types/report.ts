import { ItemType } from '../../persons/types/person';
import { ReporterRoleUI, ReporterType, ReporterInfo } from './reporter';

export interface ReportForm {
  itemType: ItemType;
  reporterRole: ReporterRoleUI;
  reporterName: string;
  reporterDocumentId: string;
  reporterPhone: string;
  reporterEmail: string;
  reporterRelationship: string;
  subjectName: string;
  subjectAge: string;
  subjectGender: string;
  locationZone: string;
  eventDate: string;
  observations: string;
  photoUrl?: string;
}

export interface AdminReportItem {
  id: string;
  code: string;
  type: ItemType;
  status: 'pending' | 'approved' | 'rejected';
  reportDate: string;
  reporterName: string;
  reporterRole: string;
  reporterPhone: string;
  reporterEmail: string;
  reporterDocumentType: string;
  reporterDocumentId: string;
  reporterRelationship: string;
  reporterId?: string;
  reporterType?: ReporterType;
  personName: string;
  personAge: string;
  personLocation: string;
  personCity: string;
  personPhoto: string;
  notes: string;
  assignedReviewer: string;
}

export interface SightingReport {
  id: string;
  personId: string;
  sightingDate: string;
  sightingTime: string;
  city: string;
  locationDetails: string;
  healthCondition: string;
  witnessContact: string;
  additionalNotes?: string;
  photoUrl?: string;
  createdAt: string;
}
