import { PersonItem, ItemType } from '../types/person';
import { INITIAL_ITEMS } from '../../../data/mock/mockPersons';
import { mockApiCall, SupabaseResponse } from '../../../services/api/supabase';

export const personService = {
  /**
   * Fetch all persons & pets items.
   * Prepared to connect to Supabase: `supabase.from('persons').select('*')`
   */
  async getPersons(): Promise<SupabaseResponse<PersonItem[]>> {
    const saved = localStorage.getItem('estamos_buscando_items');
    const items: PersonItem[] = saved ? JSON.parse(saved) : INITIAL_ITEMS;
    return mockApiCall(items);
  },

  /**
   * Fetch single item by ID.
   * Prepared for Supabase: `supabase.from('persons').select('*').eq('id', id).single()`
   */
  async getPersonById(id: string): Promise<SupabaseResponse<PersonItem | null>> {
    const response = await this.getPersons();
    const item = response.data?.find((p) => p.id === id) || null;
    return mockApiCall(item);
  },

  /**
   * Search and filter items.
   * Prepared for Supabase query filters
   */
  async searchPersons(
    query?: string,
    type?: string,
    zone?: string
  ): Promise<SupabaseResponse<PersonItem[]>> {
    const response = await this.getPersons();
    let items = response.data || [];

    if (type && type !== 'todos') {
      items = items.filter((item) => item.type === type);
    }

    if (zone && zone !== 'todas') {
      items = items.filter((item) => item.city === zone);
    }

    if (query && query.trim()) {
      const q = query.toLowerCase();
      items = items.filter((item) => {
        return (
          item.name.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          (item.additionalDetails || '').toLowerCase().includes(q) ||
          (item.tattoo || '').toLowerCase().includes(q)
        );
      });
    }

    return mockApiCall(items);
  },

  /**
   * Save items list (local storage sync, prepared for Supabase insert/update)
   */
  savePersonsToStorage(items: PersonItem[]): void {
    localStorage.setItem('estamos_buscando_items', JSON.stringify(items));
  }
};
