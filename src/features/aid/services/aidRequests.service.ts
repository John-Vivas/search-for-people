import { getSupabaseClient } from '@/src/lib/supabase';
import { apiClient } from '@/src/services/api/httpClient';
import { ok, fail, ServiceResponse } from '@/src/services/api/errors';
import type {
  AidRequest,
  AidRequestPhones,
  CommitAidRequestInput,
  CreateAidRequestInput,
} from '@/src/features/aid/types/aid';

const AID_COLUMNS =
  'id, resource_type, resource_label, quantity, unit, urgency, status, description, requester_name, provider_name, eta_minutes, zone_id, latitude, longitude, address, place_name, created_at, committed_at, delivered_at, updated_at';

/**
 * Reads go straight to Supabase (public, RLS-readable — no login needed,
 * matches the board being public). Every write goes through the Express
 * backend instead: it requires a phone-session login and is the only place
 * that ever touches phone numbers, so they never leak through an anon
 * Supabase policy. See src/features/phone-auth for the login flow.
 */
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

  /** Requires login. Silently returns an empty list (via the 401) when logged out. */
  listPhones(): Promise<ServiceResponse<AidRequestPhones[]>> {
    return apiClient.get('/aid-requests/phones');
  },

  /**
   * Requires login. The response includes `deliveryCode` exactly once — the
   * backend never stores it in plaintext, so the UI must show it to the
   * requester now; they'll need to give it to whoever delivers the aid.
   */
  create(input: CreateAidRequestInput): Promise<ServiceResponse<AidRequest & { deliveryCode: string }>> {
    return apiClient.post('/aid-requests', input);
  },

  /** Requires login. */
  commit(id: string, input: CommitAidRequestInput): Promise<ServiceResponse<AidRequest>> {
    return apiClient.post(`/aid-requests/${id}/commit`, input);
  },

  /** Requires login as the provider who committed. */
  markEnRoute(id: string): Promise<ServiceResponse<AidRequest>> {
    return apiClient.post(`/aid-requests/${id}/en-route`);
  },

  /** Requires login as the provider who committed, plus the code the requester gave them. */
  deliver(id: string, deliveryCode: string): Promise<ServiceResponse<AidRequest>> {
    return apiClient.post(`/aid-requests/${id}/deliver`, { deliveryCode });
  },

  /** Requires login as the requester. */
  cancel(id: string): Promise<ServiceResponse<AidRequest>> {
    return apiClient.post(`/aid-requests/${id}/cancel`);
  },

  /** Requires login as the provider who committed; reopens the request for someone else. */
  withdraw(id: string): Promise<ServiceResponse<AidRequest>> {
    return apiClient.post(`/aid-requests/${id}/withdraw`);
  },
};
