import { getSupabaseClient } from '@/src/lib/supabase';
import { isMockMode } from '@/src/lib/dataSource';
import { ok, fail, ServiceResponse } from '@/src/services/api/errors';
import { invalidateEnrichmentContext } from '@/src/lib/enrichmentContext';

export type CaseKind = 'person' | 'pet';

/**
 * Cambia el estado de un caso (persona o mascota) vía RPC set_case_status.
 * Se usa desde el panel de moderación para marcar "Encontrado" / "Reunido".
 */
export async function setCaseStatus(input: {
  id: string;
  kind: CaseKind;
  status: string;
}): Promise<ServiceResponse<null>> {
  if (isMockMode()) {
    return fail(new Error('Mock mode'), 'Disponible con Supabase');
  }
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('set_case_status', {
      p_id: input.id,
      p_kind: input.kind,
      p_status: input.status,
    });
    if (error) return fail(error, 'No se pudo actualizar el estado del caso');
    invalidateEnrichmentContext();
    return ok(null);
  } catch (error) {
    return fail(error, 'No se pudo actualizar el estado del caso');
  }
}
