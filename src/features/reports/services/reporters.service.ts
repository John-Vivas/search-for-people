import { getSupabaseClient } from '../../../lib/supabase';
import { isMockMode } from '../../../lib/dataSource';
import { isPostgrestRlsError } from '../../../lib/postgrestErrors';
import { ok, fail, ServiceResponse } from '../../../services/api/errors';
import type { ReporterType } from '../types/report.db';

export interface ReporterInsertPayload {
  reporter_type: ReporterType;
  full_name: string;
  identification_number?: string | null;
  phone?: string | null;
  email?: string | null;
  relationship?: string | null;
}

const REPORTER_INSERT_COLUMNS = 'id, reporter_type, full_name' as const;

export const reportersService = {
  /**
   * Insert private reporter record.
   * NEVER expose returned row in public UI components.
   */
  async createReporter(
    payload: ReporterInsertPayload
  ): Promise<ServiceResponse<{ id: string }>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Reporter creation requires Supabase');
    }

    try {
      const supabase = getSupabaseClient();

      // Execute secure RPC function (create_reporter_record)
      // Never perform direct POST /reporters or .select() from public client
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'create_reporter_record',
        {
          p_reporter_type: payload.reporter_type,
          p_full_name: payload.full_name,
          p_identification_number: payload.identification_number ?? null,
          p_phone: payload.phone ?? null,
          p_email: payload.email ?? null,
          p_relationship: payload.relationship ?? null,
          p_organization_id: null,
        }
      );

      if (rpcError) {
        console.error('[createReporter RPC error]', rpcError);
        const message =
          rpcError.code === 'PGRST202' || rpcError.message?.includes('Could not find the function')
            ? 'La función de registro no se encuentra en Supabase. Aplique la migración SQL 20250813130000_create_reporter_record_rpc.sql en el Editor SQL de Supabase.'
            : 'No se pudo registrar la información del reportante. Intente de nuevo.';
        return fail(rpcError, message);
      }

      if (!rpcData) {
        return fail(new Error('No reporter ID returned'), 'No se obtuvo el identificador del reportante.');
      }

      return ok({ id: rpcData as string });
    } catch (error) {
      return fail(error, 'No se pudo registrar al reportante');
    }
  },
};
