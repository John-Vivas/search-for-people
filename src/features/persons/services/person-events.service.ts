/**
 * Person events service — Phase 6
 * Append-only event history for persons.
 */
import { getSupabaseClient } from '@/src/lib/supabase';
import { isMockMode } from '@/src/lib/dataSource';
import { ok, fail, mockApiCall, ServiceResponse } from '@/src/services/api/errors';
import type { PersonEventRow } from '@/src/types/database';
import type { PersonEventType } from '@/src/types/enums';

export type PersonEvent = PersonEventRow;

export type PersonEventInsert = Omit<PersonEvent, 'id' | 'created_at'> & {
  id?: string;
};

const EVENT_COLUMNS =
  'id, person_id, event_type, location_id, facility_id, description, event_at, created_by, created_at' as const;

export const personEventsService = {
  async getPersonEvents(personId: string): Promise<ServiceResponse<PersonEvent[]>> {
    if (isMockMode()) {
      return mockApiCall([]);
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('person_events')
        .select(EVENT_COLUMNS)
        .eq('person_id', personId)
        .order('event_at', { ascending: true });

      if (error) return fail(error, 'No se pudo cargar el historial');
      return ok(data ?? []);
    } catch (error) {
      return fail(error, 'No se pudo cargar el historial');
    }
  },

  async createPersonEvent(payload: PersonEventInsert): Promise<ServiceResponse<PersonEvent>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Eventos disponibles con Supabase');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('person_events')
        .insert(payload)
        .select(EVENT_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo registrar el evento');
      return ok(data);
    } catch (error) {
      return fail(error, 'No se pudo registrar el evento');
    }
  },
};

export type { PersonEventType };
