import { PersonItem, ItemType } from '@/src/features/persons/types/person';
import { INITIAL_ITEMS } from '@/src/data/mock/mockPersons';
import { isMockMode } from '@/src/lib/dataSource';
import { ok, fail, mockApiCall, ServiceResponse } from '@/src/services/api/errors';
import { loadEnrichmentContext } from '@/src/lib/enrichmentContext';
import { personsService } from '@/src/features/persons/services/persons.service';
import { petService } from '@/src/features/pets/services/petService';
import { zonesService } from '@/src/features/map/services/zones.service';
import {
  itemTypeToStatuses,
  mapPersonToItem,
  mapPersonsToItems,
  resolveZoneIdByCityName,
  zonePublicToInfo,
  type PersonMappableRow,
} from '@/src/features/persons/mappers/person.mapper';

function getMockPersonsOnly(): PersonItem[] {
  const saved = localStorage.getItem('estamos_buscando_items');
  const items: PersonItem[] = saved ? JSON.parse(saved) : INITIAL_ITEMS;
  return items.filter((i) => i.type !== 'mascota');
}

async function mapRecordsToItems(rows: PersonMappableRow[]): Promise<PersonItem[]> {
  const ctx = await loadEnrichmentContext();
  return mapPersonsToItems(rows, ctx);
}

async function mapRecordToItem(row: PersonMappableRow): Promise<PersonItem> {
  const ctx = await loadEnrichmentContext();
  return mapPersonToItem(row, ctx);
}

export const personService = {
  /** Persons only — pets via petService (merged in usePersons) */
  async getPersons(): Promise<ServiceResponse<PersonItem[]>> {
    if (isMockMode()) {
      return mockApiCall(getMockPersonsOnly());
    }

    const res = await personsService.searchPersons({ limit: 100 });
    if (res.error || !res.data) {
      return fail(res.error, 'No se pudieron cargar las personas');
    }

    return ok(await mapRecordsToItems(res.data));
  },

  async getPersonById(id: string): Promise<ServiceResponse<PersonItem | null>> {
    if (isMockMode()) {
      const item = getMockPersonsOnly().find((p) => p.id === id) ?? null;
      return mockApiCall(item);
    }

    const res = await personsService.getPersonById(id);
    if (res.error) return fail(res.error, 'No se pudo cargar la persona');
    if (!res.data) return ok(null);
    return ok(await mapRecordToItem(res.data));
  },

  async searchPersons(
    query?: string,
    type?: string,
    zone?: string
  ): Promise<ServiceResponse<PersonItem[]>> {
    if (type === 'mascota') {
      return petService.searchPets(query, zone);
    }

    if (isMockMode()) {
      let items = getMockPersonsOnly();

      if (type && type !== 'todos') {
        items = items.filter((item) => item.type === type);
      }

      if (zone && zone !== 'todas') {
        items = items.filter((item) => item.city === zone);
      }

      if (query?.trim()) {
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
    }

    const zonesRes = await zonesService.getEmergencyZones(true);
    const zones = (zonesRes.data ?? []).map(zonePublicToInfo);

    const filters: Parameters<typeof personsService.searchPersons>[0] = {
      limit: 100,
    };

    if (query?.trim()) filters.query = query.trim();
    if (type && type !== 'todos') {
      const statuses = itemTypeToStatuses(type);
      if (statuses) filters.status = statuses;
    }
    if (zone && zone !== 'todas') {
      const zoneId = resolveZoneIdByCityName(zone, zones);
      if (zoneId) filters.zoneId = zoneId;
    }

    const res = await personsService.searchPersons(filters);
    if (res.error || !res.data) {
      return fail(res.error, 'No se pudieron buscar personas');
    }

    return ok(await mapRecordsToItems(res.data));
  },

  /** Combined catalog: persons + pets (Supabase) or full mock list */
  async getCatalogItems(): Promise<ServiceResponse<PersonItem[]>> {
    if (isMockMode()) {
      const saved = localStorage.getItem('estamos_buscando_items');
      const items: PersonItem[] = saved ? JSON.parse(saved) : INITIAL_ITEMS;
      return mockApiCall(items);
    }

    const [personsRes, petsRes] = await Promise.all([
      this.getPersons(),
      petService.getPets(),
    ]);

    if (personsRes.error && petsRes.error) {
      return fail(personsRes.error, 'No se pudo cargar la información');
    }

    const merged = [...(personsRes.data ?? []), ...(petsRes.data ?? [])].sort(
      (a, b) => {
        const parse = (s: string) => {
          if (s.startsWith('Hace')) return Date.now();
          return new Date(s).getTime() || 0;
        };
        return parse(b.updatedAt) - parse(a.updatedAt);
      }
    );

    return ok(merged);
  },

  async getCatalogItemById(id: string): Promise<ServiceResponse<PersonItem | null>> {
    if (isMockMode()) {
      const saved = localStorage.getItem('estamos_buscando_items');
      const items: PersonItem[] = saved ? JSON.parse(saved) : INITIAL_ITEMS;
      return mockApiCall(items.find((i) => i.id === id) ?? null);
    }

    const personRes = await this.getPersonById(id);
    if (personRes.data) return ok(personRes.data);

    return petService.getPetById(id);
  },

  savePersonsToStorage(items: PersonItem[]): void {
    if (!isMockMode()) return;
    localStorage.setItem('estamos_buscando_items', JSON.stringify(items));
  },

  countByType(items: PersonItem[], type: ItemType): number {
    return items.filter((i) => i.type === type).length;
  },
};
