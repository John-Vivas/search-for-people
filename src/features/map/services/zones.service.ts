import { getSupabaseClient } from '../../../lib/supabase';
import { isMockMode } from '../../../lib/dataSource';
import {
  EMERGENCY_ZONE_COLUMNS_FLAT,
  EMERGENCY_ZONE_COLUMNS_HIERARCHICAL,
} from '../../../lib/constants';
import { ok, fail, mockApiCall, ServiceResponse } from '../../../services/api/errors';
import { EMERGENCY_ZONE_TREE } from '../../../data/mock/emergencyZones';
import type { EmergencyZoneNode } from '../../../types/emergency-zone';
import { isCityLevelZone, isDepartmentZone } from '../../../types/emergency-zone';
import type { EmergencyZone, EmergencyZonePublic } from '../types/zone.db';
import { isPostgrestMissingColumnError } from '../../../lib/postgrestErrors';
import {
  buildCodeToIdMap,
  dbRowToPublic,
  EmergencyZoneDbRow,
  hasHierarchicalSchema,
  rowsToZoneNodes,
  rowToZoneNode,
} from '../utils/zoneMappers';

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
  if (cachedZoneSchema === 'hierarchical') {
    const hierResult = await fetchHierarchicalZoneRows(activeOnly);
    if (!hierResult.error && hierResult.data) {
      const rows = hierResult.data;
      return ok({
        rows,
        hierarchical: hasHierarchicalSchema(rows) || rows.some((r) => r.type != null),
      });
    }
    // Fallback to flat if hierarchical query failed
    cachedZoneSchema = 'flat';
  }

  // Query flat columns (supported on both flat and hierarchical schema without 400 errors)
  const flatResult = await fetchFlatZoneRows(activeOnly);
  if (flatResult.error || !flatResult.data) {
    return fail(flatResult.error, 'No se pudieron cargar las zonas de emergencia');
  }

  // If schema state is unknown, try hierarchical query once to check if migration 20250813000000 was applied
  if (cachedZoneSchema === null) {
    const hierTest = await fetchHierarchicalZoneRows(activeOnly);
    if (!hierTest.error && hierTest.data && hierTest.data.length > 0) {
      cachedZoneSchema = 'hierarchical';
      const rows = hierTest.data;
      return ok({
        rows,
        hierarchical: hasHierarchicalSchema(rows) || rows.some((r) => r.type != null),
      });
    }
    cachedZoneSchema = 'flat';
  }

  return ok({ rows: flatResult.data, hierarchical: false });
}

async function fetchZoneRowById(id: string): Promise<ServiceResponse<EmergencyZone | null>> {
  const supabase = getSupabaseClient();
  const columns =
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
      cachedZoneSchema = hasHierarchicalSchema([data as EmergencyZoneDbRow])
        ? 'hierarchical'
        : 'flat';
    }
    return ok(data as EmergencyZone | null);
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
      const columns =
        cachedZoneSchema === 'flat'
          ? EMERGENCY_ZONE_COLUMNS_FLAT
          : EMERGENCY_ZONE_COLUMNS_HIERARCHICAL;

      const { data, error } = await supabase
        .from('emergency_zones')
        .select(columns)
        .ilike('name', name)
        .maybeSingle();

      if (!error) {
        return ok(data as EmergencyZone | null);
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
