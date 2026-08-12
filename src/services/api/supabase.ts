/**
 * @deprecated Import from src/lib/supabase.ts or src/services/api/errors.ts
 * Kept for backward compatibility during Supabase migration (Phase 1).
 */
export { isSupabaseConfigured, supabase, supabaseConfig, getSupabaseClient } from '../../lib/supabase';

export type {
  ServiceResponse,
  SupabaseResponse,
  ServiceError,
} from './errors';

export { mockApiCall, ok, fail, toServiceError } from './errors';
