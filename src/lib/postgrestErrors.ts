/** PostgREST / PostgreSQL errors surfaced by @supabase/supabase-js */
export type PostgrestLikeError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

/** Column referenced in select/filter does not exist (flat vs hierarchical schema) */
export function isPostgrestMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const pg = error as PostgrestLikeError;
  const message = pg.message?.toLowerCase() ?? '';

  return (
    pg.code === '42703' ||
    pg.code === 'PGRST204' ||
    message.includes('does not exist') ||
    message.includes('column') && message.includes('not found')
  );
}

/** RLS denied the operation — Supabase may return HTTP 401 with code 42501 */
export function isPostgrestRlsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const pg = error as PostgrestLikeError;
  return pg.code === '42501';
}
