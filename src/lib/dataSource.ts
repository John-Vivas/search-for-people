import { isSupabaseConfigured } from './supabase';
import type { DataSourceMode } from './constants';

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
