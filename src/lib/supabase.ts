import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/** True when both public env vars are present */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Singleton Supabase client for the browser.
 * Uses only the anon key — never the service role key.
 *
 * Note: Typed selects use explicit domain casts in services until
 * `supabase gen types typescript` is wired in (Phase 2+).
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu entorno local.'
    );
  }
  return supabase;
}

export const supabaseConfig = {
  url: supabaseUrl,
  anonKeyConfigured: Boolean(supabaseAnonKey),
} as const;
