import { getSupabaseClient } from '@/src/lib/supabase';
import { ok, fail, ServiceResponse } from '@/src/services/api/errors';
import type {
  AidRequest,
  AidStatus,
  CreateAidRequestInput,
} from '@/src/features/aid/types/aid';

const AID_COLUMNS =
  'id, resource_type, resource_label, quantity, unit, urgency, status, description, requester_org, requester_contact, provider_org, eta_minutes, zone_id, latitude, longitude, address, place_name, created_at, committed_at, delivered_at, updated_at';

export const aidRequestsService = {
  async list(): Promise<ServiceResponse<AidRequest[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('aid_requests')
        .select(AID_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) return fail(error, 'No se pudieron cargar las solicitudes de ayuda');
      return ok((data ?? []) as AidRequest[]);
    } catch (error) {
      return fail(error, 'No se pudieron cargar las solicitudes de ayuda');
    }
  },

  async create(input: CreateAidRequestInput): Promise<ServiceResponse<AidRequest>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('create_aid_request', {
        p_resource_type: input.resourceType,
        p_quantity: input.quantity ?? null,
        p_unit: input.unit ?? null,
        p_urgency: input.urgency ?? 3,
        p_resource_label: input.resourceLabel ?? null,
        p_description: input.description ?? null,
        p_requester_org: input.requesterOrg ?? null,
        p_requester_contact: input.requesterContact ?? null,
        p_zone_id: input.zoneId ?? null,
        p_latitude: input.latitude ?? null,
        p_longitude: input.longitude ?? null,
        p_address: input.address ?? null,
        p_place_name: input.placeName ?? null,
      });

      if (error) return fail(error, 'No se pudo crear la solicitud');
      return ok(data as AidRequest);
    } catch (error) {
      return fail(error, 'No se pudo crear la solicitud');
    }
  },

  async commit(
    id: string,
    providerOrg: string,
    etaMinutes: number | null
  ): Promise<ServiceResponse<AidRequest>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('commit_aid_request', {
        p_id: id,
        p_provider_org: providerOrg,
        p_eta_minutes: etaMinutes,
      });

      if (error) return fail(error, 'No se pudo comprometer la solicitud');
      return ok(data as AidRequest);
    } catch (error) {
      return fail(error, 'No se pudo comprometer la solicitud');
    }
  },

  async advance(id: string, status: AidStatus): Promise<ServiceResponse<AidRequest>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('advance_aid_request', {
        p_id: id,
        p_status: status,
      });

      if (error) return fail(error, 'No se pudo actualizar el estado');
      return ok(data as AidRequest);
    } catch (error) {
      return fail(error, 'No se pudo actualizar el estado');
    }
  },
};
