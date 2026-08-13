import { ReportForm, AdminReportItem, SightingReport } from '@/src/features/reports/types/report';
import { PersonItem, ItemType } from '@/src/features/persons/types/person';
import { mapRoleUIToType } from '@/src/features/reports/types/reporter';
import { generateCode } from '@/src/lib/utils';
import { isMockMode } from '@/src/lib/dataSource';
import { getSupabaseClient } from '@/src/lib/supabase';
import { ok, fail, mockApiCall, ServiceResponse } from '@/src/services/api/errors';
import { reportersService } from '@/src/features/reports/services/reporters.service';
import { reportsService } from '@/src/features/reports/services/reports.service';
import { personsService } from '@/src/features/persons/services/persons.service';
import { petsService } from '@/src/features/pets/services/pets.service';
import { zonesService } from '@/src/features/map/services/zones.service';
import {
  adminStatusToReportStatus,
  itemTypeToPersonStatus,
  itemTypeToPetStatus,
  itemTypeToReportType,
  mapAdminQueueRowToAdminReportItem,
  type AdminReportQueueRow,
} from '@/src/features/reports/mappers/report.mapper';
import {
  resolveZoneIdByCityName,
  zonePublicToInfo,
  type ZoneInfo,
} from '@/src/features/persons/mappers/person.mapper';
import { geocodeAddress } from '@/src/services/geocoding/geocoding.service';

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

/**
 * Resolve the city's emergency zone (id + coordinates). Prefers an explicit
 * zone id (from the city <select>); falls back to matching a city name against
 * the seeded zones. Returns the full ZoneInfo so the caller can use the city
 * coordinates as a geocoding fallback.
 */
async function resolveCityZone(form: ReportForm): Promise<ZoneInfo | null> {
  const zonesRes = await zonesService.getEmergencyZones(true);
  const zones = (zonesRes.data ?? []).map(zonePublicToInfo);

  if (form.locationCityZoneId) {
    return zones.find((z) => z.id === form.locationCityZoneId) ?? null;
  }

  const cityCandidate =
    form.locationCity?.trim() ||
    form.locationZone.split(',').pop()?.trim() ||
    form.locationZone.trim();
  const id = resolveZoneIdByCityName(cityCandidate, zones);
  return id ? zones.find((z) => z.id === id) ?? null : null;
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
  subjectCity?: string;
  subjectCityZoneId?: string | null;
  subjectNeighborhood?: string;
  subjectAddress?: string;
  subjectSpecies?: string;
  subjectBreed?: string;
  subjectColor?: string;
  /** Legacy single free-text location; still accepted as fallback */
  subjectZone?: string;
  subjectDate: string;
  subjectObs: string;
  photoPreview: string;
}): ReportForm {
  const composedZone =
    [input.subjectAddress, input.subjectNeighborhood, input.subjectCity]
      .map((p) => p?.trim())
      .filter(Boolean)
      .join(', ') || (input.subjectZone ?? '');

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
    locationZone: composedZone,
    locationCity: input.subjectCity,
    locationCityZoneId: input.subjectCityZoneId ?? null,
    locationNeighborhood: input.subjectNeighborhood,
    locationAddress: input.subjectAddress,
    petSpecies: input.subjectSpecies,
    petBreed: input.subjectBreed,
    petColor: input.subjectColor,
    eventDate: input.subjectDate,
    observations: input.subjectObs,
    photoUrl: input.photoPreview,
  };
}

export interface DuplicateMatch {
  id: string;
  title: string;
  subtitle: string;
}

const PERSON_STATUS_LABEL: Record<string, string> = {
  MISSING: 'Desaparecido',
  FOUND: 'Encontrado',
  IDENTIFIED: 'Identificado',
  UNIDENTIFIED: 'NN',
  TRANSFERRED: 'Trasladado',
  REUNITED: 'Reunido',
};

/**
 * Busca registros existentes parecidos (mismo nombre en la misma ciudad) para
 * avisar de posibles duplicados antes de crear. No bloquea: solo informa.
 */
async function findSimilarRecords(form: ReportForm): Promise<DuplicateMatch[]> {
  if (isMockMode()) return [];
  const name = form.subjectName?.trim();
  if (!name || name.length < 3) return [];
  const zoneId = form.locationCityZoneId ?? undefined;

  try {
    if (form.itemType === 'mascota') {
      const res = await petsService.searchPets({ query: name, zoneId, limit: 5 });
      return (res.data ?? []).map((p) => ({
        id: p.id,
        title: p.name ?? 'Mascota',
        subtitle: [p.species, p.breed, p.color].filter(Boolean).join(' · ') || 'Mascota',
      }));
    }

    const res = await personsService.searchPersons({ query: name, zoneId, limit: 5 });
    return (res.data ?? []).map((p) => ({
      id: p.id,
      title: p.full_name ?? 'Sin nombre',
      subtitle: [
        PERSON_STATUS_LABEL[p.status] ?? p.status,
        p.approximate_age != null ? `${p.approximate_age} años` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }));
  } catch {
    return [];
  }
}

export const reportService = {
  buildReportFormFromFlow,
  findSimilarRecords,

  async createReport(form: ReportForm): Promise<ServiceResponse<ReportSubmissionResult>> {
    if (isMockMode()) {
      return mockApiCall(buildMockSubmission(form));
    }

    try {
      console.log('[REPORT FLOW] step 1: Zone + location resolution');
      const cityZone = await resolveCityZone(form);
      const zoneId = cityZone?.id ?? null;

      // Best-effort geocoding of the specific address; fall back to the city
      // coordinates so the map always has at least a city-level point.
      const geo = await geocodeAddress({
        address: form.locationAddress,
        neighborhood: form.locationNeighborhood,
        city: form.locationCity,
      });
      const latitude = geo?.latitude ?? cityZone?.latitude ?? null;
      const longitude = geo?.longitude ?? cityZone?.longitude ?? null;
      const addressText = form.locationAddress?.trim() || form.locationZone || null;
      const placeName = form.locationNeighborhood?.trim() || null;

      const reportType = itemTypeToReportType(form.itemType);
      const approximateAge = parseApproximateAge(form.subjectAge);
      const lastSeenAt = form.eventDate
        ? new Date(form.eventDate).toISOString()
        : new Date().toISOString();
      console.log('[REPORT FLOW] step 1: success');

      const identifierCode =
        form.itemType === 'nn'
          ? `NN-${Date.now().toString().slice(-6)}`
          : `REP-${Date.now().toString().slice(-6)}`;

      console.log('[REPORT FLOW] step 2: RPC submit_community_report');
      const supabase = getSupabaseClient();
      const { data: rpcRows, error: rpcError } = await supabase.rpc('submit_community_report', {
        p_reporter_type: mapRoleUIToType(form.reporterRole),
        p_reporter_full_name: form.reporterName,
        p_reporter_identification: form.reporterDocumentId || null,
        p_reporter_phone: form.reporterPhone || null,
        p_reporter_email: form.reporterEmail || null,
        p_reporter_relationship: form.reporterRelationship || null,
        p_report_type: reportType,
        p_subject_name: form.itemType === 'nn' ? null : form.subjectName || null,
        p_identifier_code: identifierCode,
        p_approximate_age: approximateAge,
        p_sex: form.subjectGender || null,
        p_description: form.observations || null,
        p_last_seen_at: lastSeenAt,
        p_zone_id: zoneId,
        p_pet_species:
          form.itemType === 'mascota' ? form.petSpecies?.trim() || 'Mascota' : null,
        p_pet_breed: form.itemType === 'mascota' ? form.petBreed?.trim() || null : null,
        p_pet_color: form.itemType === 'mascota' ? form.petColor?.trim() || null : null,
        p_photo_url: form.photoUrl || null,
        p_latitude: latitude,
        p_longitude: longitude,
        p_address: addressText,
        p_place_name: placeName,
      });

      if (rpcError) {
        console.error('[REPORT FLOW] step 2: error', {
          code: rpcError.code,
          message: rpcError.message,
        });
        const msg =
          rpcError.code === 'PGRST202'
            ? 'La función de reporte no se encuentra en Supabase. Ejecute 20250813140000_submit_community_report_rpc.sql en el SQL Editor de Supabase.'
            : rpcError.message || 'Error al ejecutar RPC submit_community_report';
        return fail(rpcError, msg);
      }
      console.log('[REPORT FLOW] step 2: success');

      const rpcResult = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
      const reportId = rpcResult?.report_id || `rep-${Date.now()}`;
      const personId = rpcResult?.person_id || null;
      const petId = rpcResult?.pet_id || null;
      const submittedAt = rpcResult?.submitted_at || new Date().toISOString();

      console.log('[REPORT FLOW] step 3: Admin DTO construction');
      const fallbackRow: AdminReportQueueRow = {
        report_id: reportId,
        report_type: reportType,
        report_status: 'PENDING',
        report_description: form.observations || null,
        submitted_at: submittedAt,
        reviewed_at: null,
        person_id: personId,
        pet_id: petId,
        reporter_id: rpcResult?.reporter_id || `rep-${Date.now()}`,
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

      console.log('[REPORT FLOW] step 3: success');

      return ok({
        adminReport: mapAdminQueueRowToAdminReportItem(fallbackRow),
        publishToPublicCatalog: false,
      });
    } catch (error) {
      console.error('[REPORT FLOW] error', {
        message: error instanceof Error ? error.message : String(error),
      });
      const errorMsg = error instanceof Error ? error.message : 'No se pudo completar el envío del reporte';
      return fail(error, errorMsg);
    }
  },

  async submitSighting(sighting: SightingReport): Promise<ServiceResponse<boolean>> {
    console.info('[reportService] Avistamiento registrado (pendiente de integración):', sighting.id);
    return mockApiCall(true);
  },

  adminStatusToReportStatus,
};
