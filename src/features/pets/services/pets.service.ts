import { getSupabaseClient } from '../../../lib/supabase';
import { isMockMode } from '../../../lib/dataSource';
import { PET_PUBLIC_COLUMNS, DEFAULT_PAGE_SIZE } from '../../../lib/constants';
import { ok, fail, mockApiCall, ServiceResponse } from '../../../services/api/errors';
import type {
  PetPublic,
  PetInsert,
  PetSearchFilters,
  PetUpdate,
} from '../types/pet.db';

export const petsService = {
  async getPets(filters: PetSearchFilters = {}): Promise<ServiceResponse<PetPublic[]>> {
    return this.searchPets(filters);
  },

  async getPetById(id: string): Promise<ServiceResponse<PetPublic | null>> {
    if (isMockMode()) {
      return mockApiCall(null);
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('pets')
        .select(PET_PUBLIC_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error) return fail(error, 'No se pudo cargar la mascota');
      return ok(data as PetPublic | null);
    } catch (error) {
      return fail(error, 'No se pudo cargar la mascota');
    }
  },

  async getLostPets(
    filters: Omit<PetSearchFilters, 'status'> = {}
  ): Promise<ServiceResponse<PetPublic[]>> {
    return this.searchPets({ ...filters, status: 'LOST' });
  },

  async getFoundPets(
    filters: Omit<PetSearchFilters, 'status'> = {}
  ): Promise<ServiceResponse<PetPublic[]>> {
    return this.searchPets({ ...filters, status: 'FOUND' });
  },

  async searchPets(filters: PetSearchFilters = {}): Promise<ServiceResponse<PetPublic[]>> {
    const { query, status, zoneId, species, limit = DEFAULT_PAGE_SIZE, offset = 0 } = filters;

    if (isMockMode()) {
      return mockApiCall([]);
    }

    try {
      const supabase = getSupabaseClient();
      let dbQuery = supabase
        .from('pets')
        .select(PET_PUBLIC_COLUMNS)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        dbQuery = dbQuery.in('status', statuses);
      }

      if (zoneId) dbQuery = dbQuery.eq('zone_id', zoneId);
      if (species) dbQuery = dbQuery.ilike('species', species);

      if (query?.trim()) {
        const q = `%${query.trim()}%`;
        dbQuery = dbQuery.or(`name.ilike.${q},breed.ilike.${q},description.ilike.${q}`);
      }

      const { data, error, count } = await dbQuery;
      if (error) return fail(error, 'No se pudieron buscar mascotas');
      return ok((data ?? []) as PetPublic[], count ?? undefined);
    } catch (error) {
      return fail(error, 'No se pudieron buscar mascotas');
    }
  },

  async createPet(payload: PetInsert): Promise<ServiceResponse<PetPublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Creación de mascotas disponible con Supabase');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('pets')
        .insert(payload)
        .select(PET_PUBLIC_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo crear el registro de mascota');
      return ok(data as PetPublic);
    } catch (error) {
      return fail(error, 'No se pudo crear el registro de mascota');
    }
  },

  async updatePet(id: string, payload: PetUpdate): Promise<ServiceResponse<PetPublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Actualización disponible con Supabase');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('pets')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(PET_PUBLIC_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo actualizar la mascota');
      return ok(data as PetPublic);
    } catch (error) {
      return fail(error, 'No se pudo actualizar la mascota');
    }
  },
};
