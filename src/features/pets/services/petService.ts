import { PersonItem } from '../../persons/types/person';
import { personService } from '../../persons/services/personService';
import { SupabaseResponse } from '../../../services/api/supabase';

export const petService = {
  /**
   * Fetch pet items.
   * Prepared for Supabase query: `supabase.from('persons').select('*').eq('type', 'mascota')`
   */
  async getPets(): Promise<SupabaseResponse<PersonItem[]>> {
    const response = await personService.getPersons();
    const pets = response.data?.filter((i) => i.type === 'mascota') || [];
    return { data: pets, error: null };
  }
};
