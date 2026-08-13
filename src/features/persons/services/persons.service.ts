import { getSupabaseClient } from '@/src/lib/supabase';
import { isMockMode } from '@/src/lib/dataSource';
import {
  PERSON_PUBLIC_COLUMNS,
  PERSON_DETAIL_COLUMNS,
  DEFAULT_PAGE_SIZE,
} from '@/src/lib/constants';
import { ok, fail, mockApiCall, ServiceResponse } from '@/src/services/api/errors';
import type {
  PersonPublic,
  PersonInsert,
  PersonSearchFilters,
  PersonStatus,
  PersonUpdate,
} from '@/src/features/persons/types/person.db';

/** Person row with optional detail fields for UI mapping */
export type PersonRecord = PersonPublic & {
  description?: string | null;
  physical_description?: string | null;
  clothing_description?: string | null;
  distinguishing_features?: string | null;
};

export const personsService = {
  async getPersons(
    filters: PersonSearchFilters = {}
  ): Promise<ServiceResponse<PersonRecord[]>> {
    if (isMockMode()) {
      return mockApiCall([]);
    }
    return this.searchPersons(filters);
  },

  async getPersonById(id: string): Promise<ServiceResponse<PersonRecord | null>> {
    if (isMockMode()) {
      return mockApiCall(null);
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('persons')
        .select(PERSON_DETAIL_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error) return fail(error, 'No se pudo cargar la persona');
      return ok(data as PersonRecord | null);
    } catch (error) {
      return fail(error, 'No se pudo cargar la persona');
    }
  },

  async getMissingPersons(
    filters: Omit<PersonSearchFilters, 'status'> = {}
  ): Promise<ServiceResponse<PersonRecord[]>> {
    return this.searchPersons({ ...filters, status: 'MISSING' });
  },

  async getFoundPersons(
    filters: Omit<PersonSearchFilters, 'status'> = {}
  ): Promise<ServiceResponse<PersonRecord[]>> {
    return this.searchPersons({
      ...filters,
      status: ['FOUND', 'IDENTIFIED', 'TRANSFERRED', 'REUNITED'],
    });
  },

  async getUnidentifiedPersons(
    filters: Omit<PersonSearchFilters, 'status'> = {}
  ): Promise<ServiceResponse<PersonRecord[]>> {
    return this.searchPersons({ ...filters, status: 'UNIDENTIFIED' });
  },

  async searchPersons(
    filters: PersonSearchFilters = {}
  ): Promise<ServiceResponse<PersonRecord[]>> {
    const {
      query,
      status,
      zoneId,
      lastSeenAfter,
      lastSeenBefore,
      isVerified,
      limit = DEFAULT_PAGE_SIZE,
      offset = 0,
    } = filters;

    if (isMockMode()) {
      return mockApiCall([]);
    }

    try {
      const supabase = getSupabaseClient();
      let dbQuery = supabase
        .from('persons')
        .select(PERSON_DETAIL_COLUMNS)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        dbQuery = dbQuery.in('status', statuses);
      }

      if (zoneId) dbQuery = dbQuery.eq('zone_id', zoneId);
      if (isVerified !== undefined) dbQuery = dbQuery.eq('is_verified', isVerified);
      if (lastSeenAfter) dbQuery = dbQuery.gte('last_seen_at', lastSeenAfter);
      if (lastSeenBefore) dbQuery = dbQuery.lte('last_seen_at', lastSeenBefore);

      if (query?.trim()) {
        const q = query.trim();
        dbQuery = dbQuery.or(
          `full_name.ilike.%${q}%,identifier_code.ilike.%${q}%,description.ilike.%${q}%,distinguishing_features.ilike.%${q}%`
        );
      }

      const { data, error, count } = await dbQuery;
      if (error) return fail(error, 'No se pudieron buscar personas');
      return ok((data ?? []) as PersonRecord[], count ?? undefined);
    } catch (error) {
      return fail(error, 'No se pudieron buscar personas');
    }
  },

  async createPerson(payload: PersonInsert): Promise<ServiceResponse<PersonPublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Creación de personas disponible con Supabase');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('persons')
        .insert(payload)
        .select(PERSON_PUBLIC_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo crear el registro');
      return ok(data as PersonPublic);
    } catch (error) {
      return fail(error, 'No se pudo crear el registro');
    }
  },

  async updatePerson(id: string, payload: PersonUpdate): Promise<ServiceResponse<PersonPublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Actualización disponible con Supabase');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('persons')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(PERSON_PUBLIC_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo actualizar el registro');
      return ok(data as PersonPublic);
    } catch (error) {
      return fail(error, 'No se pudo actualizar el registro');
    }
  },
};

export type { PersonStatus };
