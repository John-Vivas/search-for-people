import type { ReportStatus, ReportType } from '../types/report.db';
import type { PersonStatus } from '../../persons/types/person.db';
import type { PetStatus } from '../../pets/types/pet.db';
import type { ItemType } from '../../persons/types/person';
import type { AdminReportItem } from '../types/report';
import { mapTypeToRoleUI } from '../types/reporter';
import type { ReporterType } from '../types/reporter';

/** Row returned by get_admin_report_queue RPC */
export interface AdminReportQueueRow {
  report_id: string;
  report_type: ReportType;
  report_status: ReportStatus;
  report_description: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  person_id: string | null;
  pet_id: string | null;
  reporter_id: string;
  reporter_type: ReporterType;
  reporter_full_name: string;
  reporter_identification: string | null;
  reporter_phone: string | null;
  reporter_email: string | null;
  reporter_relationship: string | null;
  person_full_name: string | null;
  person_identifier_code: string | null;
  person_status: PersonStatus | null;
  person_approximate_age: number | null;
  person_sex: string | null;
  pet_name: string | null;
  pet_species: string | null;
  pet_status: PetStatus | null;
  zone_name: string | null;
  zone_city: string | null;
}

const PLACEHOLDER_PHOTO =
  'https://placehold.co/400x400/e1e3e4/6d7a77?text=Sin+foto';

export function itemTypeToReportType(itemType: ItemType): ReportType {
  switch (itemType) {
    case 'desaparecido':
      return 'MISSING_PERSON';
    case 'encontrado':
      return 'FOUND_PERSON';
    case 'nn':
      return 'UNIDENTIFIED_PERSON';
    case 'mascota':
      return 'LOST_PET';
    default:
      return 'MISSING_PERSON';
  }
}

export function itemTypeToPersonStatus(itemType: ItemType): PersonStatus {
  switch (itemType) {
    case 'desaparecido':
      return 'MISSING';
    case 'encontrado':
      return 'FOUND';
    case 'nn':
      return 'UNIDENTIFIED';
    default:
      return 'MISSING';
  }
}

export function itemTypeToPetStatus(itemType: ItemType): PetStatus {
  return itemType === 'mascota' ? 'LOST' : 'LOST';
}

export function reportStatusToAdminStatus(
  status: ReportStatus
): AdminReportItem['status'] {
  switch (status) {
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'PENDING':
    case 'UNDER_REVIEW':
    case 'DUPLICATE':
    default:
      return 'pending';
  }
}

export function adminStatusToReportStatus(
  status: AdminReportItem['status']
): ReportStatus {
  switch (status) {
    case 'approved':
      return 'APPROVED';
    case 'rejected':
      return 'REJECTED';
    default:
      return 'PENDING';
  }
}

export function reportTypeToItemType(reportType: ReportType): ItemType {
  switch (reportType) {
    case 'MISSING_PERSON':
      return 'desaparecido';
    case 'FOUND_PERSON':
      return 'encontrado';
    case 'UNIDENTIFIED_PERSON':
      return 'nn';
    case 'LOST_PET':
    case 'FOUND_PET':
      return 'mascota';
    default:
      return 'desaparecido';
  }
}

function formatReportDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function mapAdminQueueRowToAdminReportItem(
  row: AdminReportQueueRow
): AdminReportItem {
  const itemType = reportTypeToItemType(row.report_type);
  const isPet = itemType === 'mascota';

  const subjectName = isPet
    ? row.pet_name ?? row.pet_species ?? 'Mascota'
    : row.person_full_name ??
      row.person_identifier_code ??
      'Persona sin identificar';

  const city = row.zone_city ?? row.zone_name ?? 'Zona no registrada';

  return {
    id: row.report_id,
    code: `REP-${row.report_id.slice(0, 8).toUpperCase()}`,
    type: itemType,
    status: reportStatusToAdminStatus(row.report_status),
    reportDate: formatReportDate(row.submitted_at),
    reporterName: row.reporter_full_name,
    reporterRole: mapTypeToRoleUI(row.reporter_type),
    reporterPhone: row.reporter_phone ?? '',
    reporterEmail: row.reporter_email ?? '',
    reporterDocumentType: 'Documento de identidad',
    reporterDocumentId: row.reporter_identification ?? '',
    reporterRelationship: row.reporter_relationship ?? '',
    reporterId: row.reporter_id,
    reporterType: row.reporter_type,
    personName: subjectName,
    personAge: row.person_approximate_age
      ? `${row.person_approximate_age} años aprox.`
      : 'No especificada',
    personLocation: row.zone_name ?? row.report_description ?? 'Por verificar',
    personCity: city,
    personPhoto: PLACEHOLDER_PHOTO,
    notes: row.report_description ?? '',
    assignedReviewer: 'Moderación comunitaria',
  };
}

export function mapAdminQueueRows(rows: AdminReportQueueRow[]): AdminReportItem[] {
  return rows.map(mapAdminQueueRowToAdminReportItem);
}
