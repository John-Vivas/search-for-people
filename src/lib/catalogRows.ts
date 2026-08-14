import { personsService, type PersonRecord } from '@/src/features/persons/services/persons.service';
import { petsService, type PetRecord } from '@/src/features/pets/services/pets.service';

/**
 * Caché compartida de las filas crudas de personas + mascotas.
 *
 * Antes el catálogo (home/búsqueda) y el mapa las pedían por separado → doble
 * consulta a Supabase. Ahora ambos leen de acá: una sola carga, reutilizada.
 * TTL corto + dedupe de llamadas concurrentes. Se invalida al crear un reporte
 * o cambiar el estado de un caso.
 */
export interface CatalogRecords {
  persons: PersonRecord[];
  pets: PetRecord[];
}

const TTL_MS = 60 * 1000;
const LIMIT = 1000;

let cache: { data: CatalogRecords; at: number } | null = null;
let inflight: Promise<CatalogRecords> | null = null;

async function fetchRecords(): Promise<CatalogRecords> {
  const [personsRes, petsRes] = await Promise.all([
    personsService.getPersons({ limit: LIMIT }),
    petsService.getPets({ limit: LIMIT }),
  ]);
  return {
    persons: personsRes.data ?? [],
    pets: petsRes.data ?? [],
  };
}

export async function loadCatalogRecords(force = false): Promise<CatalogRecords> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) {
    return cache.data;
  }
  if (!force && inflight) return inflight;

  inflight = fetchRecords()
    .then((data) => {
      cache = { data, at: Date.now() };
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Descarta la caché (tras crear un reporte o cambiar el estado de un caso). */
export function invalidateCatalogRecords(): void {
  cache = null;
  inflight = null;
}
