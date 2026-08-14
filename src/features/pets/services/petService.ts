import { PersonItem } from '@/src/features/persons/types/person';
import { INITIAL_ITEMS } from '@/src/data/mock/mockPersons';
import { isMockMode } from '@/src/lib/dataSource';
import { ok, fail, mockApiCall, ServiceResponse } from '@/src/services/api/errors';
import { loadEnrichmentContext } from '@/src/lib/enrichmentContext';
import { loadCatalogRecords } from '@/src/lib/catalogRows';
import { petsService } from '@/src/features/pets/services/pets.service';
import { zonesService } from '@/src/features/map/services/zones.service';
import {
  mapPetToItem,
  mapPetsToItems,
  type PetMappableRow,
} from '@/src/features/pets/mappers/pet.mapper';
import {
  resolveZoneIdByCityName,
  zonePublicToInfo,
} from '@/src/features/persons/mappers/person.mapper';

function getMockPets(): PersonItem[] {
  const saved = localStorage.getItem('estamos_buscando_items');
  const items: PersonItem[] = saved ? JSON.parse(saved) : INITIAL_ITEMS;
  return items.filter((i) => i.type === 'mascota');
}

async function mapRecordsToItems(rows: PetMappableRow[]): Promise<PersonItem[]> {
  const ctx = await loadEnrichmentContext();
  return mapPetsToItems(rows, ctx);
}

async function mapRecordToItem(row: PetMappableRow): Promise<PersonItem> {
  const ctx = await loadEnrichmentContext();
  return mapPetToItem(row, ctx);
}

export const petService = {
  async getPets(): Promise<ServiceResponse<PersonItem[]>> {
    if (isMockMode()) {
      return mockApiCall(getMockPets());
    }

    // Filas compartidas con el mapa (una sola consulta).
    const { pets } = await loadCatalogRecords();
    return ok(await mapRecordsToItems(pets));
  },

  async getPetById(id: string): Promise<ServiceResponse<PersonItem | null>> {
    if (isMockMode()) {
      const pet = getMockPets().find((p) => p.id === id) ?? null;
      return mockApiCall(pet);
    }

    const res = await petsService.getPetById(id);
    if (res.error) return fail(res.error, 'No se pudo cargar la mascota');
    if (!res.data) return ok(null);
    return ok(await mapRecordToItem(res.data));
  },

  async searchPets(
    query?: string,
    zone?: string,
    statusFilter?: string
  ): Promise<ServiceResponse<PersonItem[]>> {
    if (isMockMode()) {
      let pets = getMockPets();

      if (zone && zone !== 'todas') {
        pets = pets.filter((p) => p.city === zone);
      }

      if (query?.trim()) {
        const q = query.toLowerCase();
        pets = pets.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q) ||
            (p.additionalDetails || '').toLowerCase().includes(q)
        );
      }

      return mockApiCall(pets);
    }

    const zonesRes = await zonesService.getEmergencyZones(true);
    const zones = (zonesRes.data ?? []).map(zonePublicToInfo);

    const filters: Parameters<typeof petsService.searchPets>[0] = { limit: 100 };
    if (query?.trim()) filters.query = query.trim();
    if (zone && zone !== 'todas') {
      const zoneId = resolveZoneIdByCityName(zone, zones);
      if (zoneId) filters.zoneId = zoneId;
    }

    const res = await petsService.searchPets(filters);
    if (res.error || !res.data) {
      return fail(res.error, 'No se pudieron buscar mascotas');
    }

    return ok(await mapRecordsToItems(res.data));
  },
};
