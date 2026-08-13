import { isSupabaseConfigured } from '@/src/lib/supabase';
import type { DataSourceMode } from '@/src/lib/constants';

/** Returns active data source based on env configuration */
export function getDataSource(): DataSourceMode {
  return isSupabaseConfigured ? 'supabase' : 'mock';
}

export function isMockMode(): boolean {
  return getDataSource() === 'mock';
}

export function isSupabaseMode(): boolean {
  return getDataSource() === 'supabase';
}
