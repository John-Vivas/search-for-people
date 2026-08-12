import { ReportForm, AdminReportItem, SightingReport } from '../types/report';
import { PersonItem, ItemType } from '../../persons/types/person';
import { mapRoleUIToType } from '../types/reporter';
import { generateCode } from '../../../lib/utils';
import { isMockMode } from '../../../lib/dataSource';
import { ok, fail, mockApiCall, ServiceResponse } from '../../../services/api/errors';
import { reportersService } from './reporters.service';
import { reportsService } from './reports.service';
import { personsService } from '../../persons/services/persons.service';
import { petsService } from '../../pets/services/pets.service';
import { zonesService } from '../../map/services/zones.service';
import {
  adminStatusToReportStatus,
  itemTypeToPersonStatus,
  itemTypeToPetStatus,
  itemTypeToReportType,
  mapAdminQueueRowToAdminReportItem,
  type AdminReportQueueRow,
} from '../mappers/report.mapper';
import {
  resolveZoneIdByCityName,
  zonePublicToInfo,
} from '../../persons/mappers/person.mapper';

export interface ReportSubmissionResult {
  adminReport: AdminReportItem;
  /** Only true in mock mode — Supabase reports stay pending until moderation */
  publishToPublicCatalog: boolean;
  publicPreview?: PersonItem;
}

function parseApproximateAge(raw: string): number | null {
  const match = raw.match(/\d+/);
  if (!match) return null;
  const n = parseInt(match[0], 10);
  return Number.isFinite(n) ? n : null;
}

async function resolveZoneId(locationZone: string): Promise<string | null> {
  const cityCandidate = locationZone.split(',')[0]?.trim() ?? locationZone.trim();
  const zonesRes = await zonesService.getEmergencyZones(true);
  const zones = (zonesRes.data ?? []).map(zonePublicToInfo);
  return resolveZoneIdByCityName(cityCandidate, zones) ?? null;
}

function buildMockSubmission(form: ReportForm): ReportSubmissionResult {
  const code = generateCode(form.itemType);
  const id = crypto.randomUUID?.() ?? `mock-${Date.now()}`;
  const now = new Date();
  const dateFormatted = `${now.toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' })} - ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;

  const reporterType = mapRoleUIToType(form.reporterRole);
  const city = form.locationZone.split(',')[0]?.trim() || 'Bogotá';

  const publicPreview: PersonItem = {
    id,
    code,
    type: form.itemType,
    name:
      form.subjectName ||
      (form.itemType === 'nn' ? 'Persona Sin Identificar' : 'Por identificar'),
    age: form.subjectAge || 'Edad no especificada',
    gender: form.subjectGender || 'No especificado',
    photo:
      form.photoUrl ||
      'https://placehold.co/400x400/e1e3e4/6d7a77?text=Sin+foto',
    location: form.locationZone || 'Ubicación no especificada',
    city,
    coordinates: [4.6097, -74.0817],
    updatedAt: 'Hace un momento',
    lastSeenDate: form.eventDate || 'Recientemente',
    verified: false,
    additionalDetails: form.observations,
  };

  const adminReport: AdminReportItem = {
    id: `rep-${Date.now()}`,
    code: `REP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    type: form.itemType,
    status: 'pending',
    reportDate: dateFormatted,
    reporterName: form.reporterName,
    reporterRole: `${form.reporterRole} (${form.reporterRelationship})`,
    reporterPhone: form.reporterPhone,
    reporterEmail: form.reporterEmail,
    reporterDocumentType: 'Cédula de Ciudadanía',
    reporterDocumentId: form.reporterDocumentId,
    reporterRelationship: form.reporterRelationship,
    reporterId: `usr-${form.reporterDocumentId || Date.now()}`,
    reporterType,
    personName: form.subjectName,
    personAge: form.subjectAge,
    personLocation: form.locationZone,
    personCity: city,
    personPhoto: publicPreview.photo,
    notes: form.observations,
    assignedReviewer: reporterType === 'VOLUNTEER' ? 'Voluntario Verificado' : 'Admin de Turno',
  };

  return {
    adminReport,
    publishToPublicCatalog: true,
    publicPreview,
  };
}

function buildReportFormFromFlow(input: {
  itemType: ItemType;
  reporterRole: ReportForm['reporterRole'];
  reporterName: string;
  reporterDoc: string;
  reporterPhone: string;
  reporterRel: string;
  subjectName: string;
  subjectAge: string;
  subjectGender: string;
  subjectZone: string;
  subjectDate: string;
  subjectObs: string;
  photoPreview: string;
}): ReportForm {
  return {
    itemType: input.itemType,
    reporterRole: input.reporterRole,
    reporterName: input.reporterName,
    reporterDocumentId: input.reporterDoc,
    reporterPhone: input.reporterPhone,
    reporterEmail: '',
    reporterRelationship: input.reporterRel,
    subjectName: input.subjectName,
    subjectAge: input.subjectAge,
    subjectGender: input.subjectGender,
    locationZone: input.subjectZone,
    eventDate: input.subjectDate,
    observations: input.subjectObs,
    photoUrl: input.photoPreview,
  };
}

export const reportService = {
  buildReportFormFromFlow,

  async createReport(form: ReportForm): Promise<ServiceResponse<ReportSubmissionResult>> {
    if (isMockMode()) {
      return mockApiCall(buildMockSubmission(form));
    }

    try {
      const zoneId = await resolveZoneId(form.locationZone);
      const reportType = itemTypeToReportType(form.itemType);
      const approximateAge = parseApproximateAge(form.subjectAge);
      const lastSeenAt = form.eventDate
        ? new Date(form.eventDate).toISOString()
        : new Date().toISOString();

      const reporterRes = await reportersService.createReporter({
        reporter_type: mapRoleUIToType(form.reporterRole),
        full_name: form.reporterName,
        identification_number: form.reporterDocumentId || null,
        phone: form.reporterPhone || null,
        email: form.reporterEmail || null,
        relationship: form.reporterRelationship || null,
      });

      if (reporterRes.error || !reporterRes.data) {
        return fail(reporterRes.error, 'No se pudo registrar al reportante');
      }

      let personId: string | null = null;
      let petId: string | null = null;

      if (form.itemType === 'mascota') {
        const petRes = await petsService.createPet({
          zone_id: zoneId,
          name: form.subjectName || null,
          species: 'Mascota',
          breed: null,
          color: null,
          sex: form.subjectGender || null,
          approximate_age: approximateAge,
          description: form.observations || null,
          status: itemTypeToPetStatus(form.itemType),
          last_seen_at: lastSeenAt,
          current_location_id: null,
          last_seen_location_id: null,
          is_verified: false,
        });

        if (petRes.error || !petRes.data) {
          return fail(petRes.error, 'No se pudo registrar la mascota');
        }
        petId = petRes.data.id;
      } else {
        const identifierCode =
          form.itemType === 'nn'
            ? `NN-${Date.now().toString().slice(-6)}`
            : `REP-${Date.now().toString().slice(-6)}`;

        const personRes = await personsService.createPerson({
          zone_id: zoneId,
          full_name: form.itemType === 'nn' ? null : form.subjectName || null,
          identifier_code: identifierCode,
          date_of_birth: null,
          approximate_age: approximateAge,
          age_is_approximate: true,
          sex: form.subjectGender || null,
          description: form.observations || null,
          physical_description: null,
          clothing_description: null,
          distinguishing_features: null,
          status: itemTypeToPersonStatus(form.itemType),
          last_seen_at: lastSeenAt,
          current_location_id: null,
          current_facility_id: null,
          last_seen_location_id: null,
          is_verified: false,
        });

        if (personRes.error || !personRes.data) {
          return fail(personRes.error, 'No se pudo registrar a la persona');
        }
        personId = personRes.data.id;
      }

      const reportRes = await reportsService.createReport({
        reporter_id: reporterRes.data.id,
        report_type: reportType,
        person_id: personId,
        pet_id: petId,
        description: form.observations || null,
        status: 'PENDING',
      });

      if (reportRes.error || !reportRes.data) {
        return fail(reportRes.error, 'No se pudo enviar el reporte');
      }

      const queueRes = await reportsService.getAdminReportQueue(1);
      const adminFromQueue = queueRes.data?.find((r) => r.id === reportRes.data!.id);

      if (adminFromQueue) {
        return ok({
          adminReport: adminFromQueue,
          publishToPublicCatalog: false,
        });
      }

      const fallbackRow: AdminReportQueueRow = {
        report_id: reportRes.data.id,
        report_type: reportType,
        report_status: 'PENDING',
        report_description: form.observations || null,
        submitted_at: reportRes.data.submitted_at,
        reviewed_at: null,
        person_id: personId,
        pet_id: petId,
        reporter_id: reporterRes.data.id,
        reporter_type: mapRoleUIToType(form.reporterRole),
        reporter_full_name: form.reporterName,
        reporter_identification: form.reporterDocumentId || null,
        reporter_phone: form.reporterPhone || null,
        reporter_email: form.reporterEmail || null,
        reporter_relationship: form.reporterRelationship || null,
        person_full_name: form.itemType === 'mascota' ? null : form.subjectName || null,
        person_identifier_code: null,
        person_status: form.itemType === 'mascota' ? null : itemTypeToPersonStatus(form.itemType),
        person_approximate_age: approximateAge,
        person_sex: form.subjectGender || null,
        pet_name: form.itemType === 'mascota' ? form.subjectName : null,
        pet_species: form.itemType === 'mascota' ? 'Mascota' : null,
        pet_status: form.itemType === 'mascota' ? itemTypeToPetStatus(form.itemType) : null,
        zone_name: form.locationZone,
        zone_city: form.locationZone.split(',')[0]?.trim() ?? null,
      };

      return ok({
        adminReport: mapAdminQueueRowToAdminReportItem(fallbackRow),
        publishToPublicCatalog: false,
      });
    } catch (error) {
      return fail(error, 'No se pudo completar el envío del reporte');
    }
  },

  async submitSighting(sighting: SightingReport): Promise<ServiceResponse<boolean>> {
    console.info('[reportService] Avistamiento registrado (pendiente de integración):', sighting.id);
    return mockApiCall(true);
  },

  adminStatusToReportStatus,
};
