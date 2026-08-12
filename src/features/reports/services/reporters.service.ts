import { getSupabaseClient } from '../../../lib/supabase';
import { isMockMode } from '../../../lib/dataSource';
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
      const { data, error } = await supabase
        .from('reporters')
        .insert(payload)
        .select(REPORTER_INSERT_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo registrar al reportante');
      return ok({ id: (data as { id: string }).id });
    } catch (error) {
      return fail(error, 'No se pudo registrar al reportante');
    }
  },
};
