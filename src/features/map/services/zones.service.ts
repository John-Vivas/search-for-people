import { getSupabaseClient } from '@/src/lib/supabase';
import { isMockMode } from '@/src/lib/dataSource';
import {
  EMERGENCY_ZONE_COLUMNS_FLAT,
  EMERGENCY_ZONE_COLUMNS_HIERARCHICAL,
} from '@/src/lib/constants';
import { ok, fail, mockApiCall, ServiceResponse } from '@/src/services/api/errors';
import { EMERGENCY_ZONE_TREE } from '@/src/data/mock/emergencyZones';
import type { EmergencyZoneNode } from '@/src/types/emergency-zone';
import { isCityLevelZone, isDepartmentZone } from '@/src/types/emergency-zone';
import type { EmergencyZone, EmergencyZonePublic } from '@/src/features/map/types/zone.db';
import { isPostgrestMissingColumnError } from '@/src/lib/postgrestErrors';
import {
  buildCodeToIdMap,
  dbRowToPublic,
  EmergencyZoneDbRow,
  hasHierarchicalSchema,
  rowsToZoneNodes,
  rowToZoneNode,
} from '@/src/features/map/utils/zoneMappers';

type ZoneSchemaMode = 'hierarchical' | 'flat';

/** Avoid repeated 400s when DB uses the flat emergency_zones schema */
let cachedZoneSchema: ZoneSchemaMode | null = null;

function toDbZone(node: EmergencyZoneNode): EmergencyZone {
  const isCity = isCityLevelZone(node);
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    parent_id: node.parentId ?? null,
    code: null,
    city: isCity ? node.name : null,
    department: isDepartmentZone(node)
      ? node.name
      : node.department ?? null,
    country_code: node.countryCode ?? 'CO',
    latitude: node.latitude ?? null,
    longitude: node.longitude ?? null,
    description: node.description ?? null,
    is_active: node.active,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mockNodesToPublic(nodes: EmergencyZoneNode[]): EmergencyZonePublic[] {
  return nodes.map(toDbZone).map((row) => dbRowToPublic(row as EmergencyZoneDbRow));
}

async function fetchHierarchicalZoneRows(
  activeOnly: boolean
): Promise<ServiceResponse<EmergencyZoneDbRow[]>> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('emergency_zones')
    .select(EMERGENCY_ZONE_COLUMNS_HIERARCHICAL)
    .order('name', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    return fail(error, 'No se pudieron cargar las zonas de emergencia');
  }

  return ok((data ?? []) as EmergencyZoneDbRow[]);
}

async function fetchFlatZoneRows(
  activeOnly: boolean
): Promise<ServiceResponse<EmergencyZoneDbRow[]>> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('emergency_zones')
    .select(EMERGENCY_ZONE_COLUMNS_FLAT)
    .order('name', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    return fail(error, 'No se pudieron cargar las zonas de emergencia');
  }

  return ok((data ?? []) as EmergencyZoneDbRow[]);
}

async function fetchZoneRows(
  activeOnly: boolean
): Promise<ServiceResponse<{ rows: EmergencyZoneDbRow[]; hierarchical: boolean }>> {
  // Prefer the hierarchical schema (the current one in prod). Trying it FIRST
  // means the common case costs a single request. Only fall back to the flat
  // query when the hierarchical columns are actually missing (older DB), which
  // we cache so we don't pay the failed hierarchical request again.
  if (cachedZoneSchema !== 'flat') {
    const hierResult = await fetchHierarchicalZoneRows(activeOnly);
    if (!hierResult.error && hierResult.data) {
      cachedZoneSchema = 'hierarchical';
      const rows = hierResult.data;
      return ok({
        rows,
        hierarchical: hasHierarchicalSchema(rows) || rows.some((r) => r.type != null),
      });
    }
    // Missing columns → this DB uses the flat schema; remember it. Any other
    // error is likely transient, so don't downgrade permanently.
    if (isPostgrestMissingColumnError(hierResult.error)) {
      cachedZoneSchema = 'flat';
    } else {
      return fail(hierResult.error, 'No se pudieron cargar las zonas de emergencia');
    }
  }

  const flatResult = await fetchFlatZoneRows(activeOnly);
  if (flatResult.error || !flatResult.data) {
    return fail(flatResult.error, 'No se pudieron cargar las zonas de emergencia');
  }

  return ok({ rows: flatResult.data, hierarchical: false });
}

async function fetchZoneRowById(id: string): Promise<ServiceResponse<EmergencyZone | null>> {
  const supabase = getSupabaseClient();
  // Widened to `string` on purpose: this can be either of two different
  // column literals, and supabase-js's select() type parser only accepts
  // a single literal — a union produces a ParserError type, not a real row.
  const columns: string =
    cachedZoneSchema === 'flat'
      ? EMERGENCY_ZONE_COLUMNS_FLAT
      : EMERGENCY_ZONE_COLUMNS_HIERARCHICAL;

  const { data, error } = await supabase
    .from('emergency_zones')
    .select(columns)
    .eq('id', id)
    .maybeSingle();

  if (!error) {
    if (cachedZoneSchema === null && data) {
      cachedZoneSchema = hasHierarchicalSchema([data as unknown as EmergencyZoneDbRow])
        ? 'hierarchical'
        : 'flat';
    }
    return ok(data as unknown as EmergencyZone | null);
  }

  if (isPostgrestMissingColumnError(error)) {
    cachedZoneSchema = 'flat';
    const flat = await supabase
      .from('emergency_zones')
      .select(EMERGENCY_ZONE_COLUMNS_FLAT)
      .eq('id', id)
      .maybeSingle();
    if (flat.error) return fail(flat.error, 'No se pudo cargar la zona');
    return ok(flat.data as EmergencyZone | null);
  }

  return fail(error, 'No se pudo cargar la zona');
}

export const zonesService = {
  async getEmergencyZones(activeOnly = true): Promise<ServiceResponse<EmergencyZonePublic[]>> {
    if (isMockMode()) {
      const nodes = activeOnly
        ? EMERGENCY_ZONE_TREE.filter((z) => z.active)
        : EMERGENCY_ZONE_TREE;
      return mockApiCall(mockNodesToPublic(nodes));
    }

    try {
      const result = await fetchZoneRows(activeOnly);
      if (result.error || !result.data) {
        return fail(result.error, 'No se pudieron cargar las zonas de emergencia');
      }

      const publicRows = result.data.rows.map(dbRowToPublic);
      return ok(publicRows as EmergencyZonePublic[]);
    } catch (error) {
      return fail(error, 'No se pudieron cargar las zonas de emergencia');
    }
  },

  /** Registro comunitario de una zona (depto/ciudad/municipio) vía RPC. */
  async createCommunityZone(input: {
    name: string;
    type?: 'DEPARTMENT' | 'CITY' | 'MUNICIPALITY' | 'DISTRICT';
    parentId?: string | null;
    department?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<ServiceResponse<EmergencyZonePublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Registro disponible con Supabase');
    }
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('create_community_zone', {
        p_name: input.name,
        p_type: input.type ?? 'CITY',
        p_parent_id: input.parentId ?? null,
        p_latitude: input.latitude ?? null,
        p_longitude: input.longitude ?? null,
        p_department: input.department ?? null,
      });
      if (error) return fail(error, 'No se pudo registrar la zona');
      return ok(dbRowToPublic(data as EmergencyZoneDbRow) as EmergencyZonePublic);
    } catch (error) {
      return fail(error, 'No se pudo registrar la zona');
    }
  },

  async getEmergencyZoneById(id: string): Promise<ServiceResponse<EmergencyZone | null>> {
    if (isMockMode()) {
      const found = EMERGENCY_ZONE_TREE.find((z) => z.id === id);
      return mockApiCall(found ? toDbZone(found) : null);
    }

    try {
      return fetchZoneRowById(id);
    } catch (error) {
      return fail(error, 'No se pudo cargar la zona');
    }
  },

  async getEmergencyZoneByName(name: string): Promise<ServiceResponse<EmergencyZone | null>> {
    if (isMockMode()) {
      const found = EMERGENCY_ZONE_TREE.find(
        (z) => z.name.toLowerCase() === name.toLowerCase()
      );
      return mockApiCall(found ? toDbZone(found) : null);
    }

    try {
      const supabase = getSupabaseClient();
      // Same reasoning as fetchZoneRowById: widen to `string` so
      // select() doesn't try (and fail) to parse a union of literals.
      const columns: string =
        cachedZoneSchema === 'flat'
          ? EMERGENCY_ZONE_COLUMNS_FLAT
          : EMERGENCY_ZONE_COLUMNS_HIERARCHICAL;

      const { data, error } = await supabase
        .from('emergency_zones')
        .select(columns)
        .ilike('name', name)
        .maybeSingle();

      if (!error) {
        return ok(data as unknown as EmergencyZone | null);
      }

      if (isPostgrestMissingColumnError(error)) {
        cachedZoneSchema = 'flat';
        const flat = await supabase
          .from('emergency_zones')
          .select(EMERGENCY_ZONE_COLUMNS_FLAT)
          .ilike('name', name)
          .maybeSingle();
        if (flat.error) return fail(flat.error, 'No se pudo cargar la zona');
        return ok(flat.data as EmergencyZone | null);
      }

      return fail(error, 'No se pudo cargar la zona');
    } catch (error) {
      return fail(error, 'No se pudo cargar la zona');
    }
  },

  /** Árbol completo — jerárquico desde Supabase o sintético desde filas planas */
  async getEmergencyZoneTree(): Promise<ServiceResponse<EmergencyZoneNode[]>> {
    if (isMockMode()) {
      return mockApiCall(EMERGENCY_ZONE_TREE.filter((z) => z.active));
    }

    try {
      const result = await fetchZoneRows(true);
      if (result.error || !result.data) {
        return fail(result.error, 'No se pudo cargar el árbol de zonas');
      }

      const { rows, hierarchical } = result.data;
      const nodes = rowsToZoneNodes(rows, hierarchical ? 'hierarchical' : 'flat');
      return ok(nodes);
    } catch (error) {
      return fail(error, 'No se pudo cargar el árbol de zonas');
    }
  },

  /** Mapa code slug → UUID (p. ej. zone-quibdo → uuid) */
  async getZoneCodeMap(): Promise<ServiceResponse<Map<string, string>>> {
    if (isMockMode()) {
      return mockApiCall(new Map(EMERGENCY_ZONE_TREE.map((z) => [z.id, z.id])));
    }

    const result = await fetchZoneRows(true);
    if (result.error || !result.data) {
      return fail(result.error, 'No se pudo cargar el mapa de zonas');
    }

    return ok(buildCodeToIdMap(result.data.rows));
  },

  /** Convierte nodos DB a EmergencyZoneNode (utilidad para mapService) */
  nodeFromRow(row: EmergencyZoneDbRow): EmergencyZoneNode {
    return rowToZoneNode(row);
  },
};
