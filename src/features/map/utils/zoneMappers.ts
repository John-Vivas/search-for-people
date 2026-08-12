import type { EmergencyZoneNode, ZoneType } from '../../../types/emergency-zone';
import {
  isCityLevelZone,
  isDepartmentZone,
} from '../../../types/emergency-zone';

/** Row shape returned from Supabase — hierarchical or legacy flat */
export interface EmergencyZoneDbRow {
  id: string;
  name: string;
  type?: ZoneType | string | null;
  parent_id?: string | null;
  code?: string | null;
  city?: string | null;
  department?: string | null;
  country_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  is_active: boolean;
}

export type ZoneSchemaMode = 'hierarchical' | 'flat';

const COLOMBIA_NODE_ID = '11111111-1111-4111-8111-111111111101';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function hasHierarchicalSchema(rows: EmergencyZoneDbRow[]): boolean {
  return rows.some((row) => row.type != null || row.parent_id != null);
}

export function rowToZoneNode(row: EmergencyZoneDbRow): EmergencyZoneNode {
  const type = (row.type ?? inferZoneType(row)) as ZoneType;

  return {
    id: row.id,
    name: row.name,
    type,
    parentId: row.parent_id ?? null,
    department: row.department ?? undefined,
    countryCode: row.country_code ?? 'CO',
    latitude: row.latitude,
    longitude: row.longitude,
    description: row.description,
    active: row.is_active,
  };
}

function inferZoneType(row: EmergencyZoneDbRow): ZoneType {
  if (row.city && row.department) return 'CITY';
  if (row.department && !row.city) return 'DEPARTMENT';
  return 'EMERGENCY_ZONE';
}

/**
 * Legacy flat rows (name + city + department) → synthetic tree:
 * Colombia → departments → cities
 */
export function buildTreeFromFlatRows(rows: EmergencyZoneDbRow[]): EmergencyZoneNode[] {
  const nodes: EmergencyZoneNode[] = [
    {
      id: COLOMBIA_NODE_ID,
      name: 'Colombia',
      type: 'COUNTRY',
      countryCode: 'CO',
      active: true,
    },
  ];

  const departmentIds = new Map<string, string>();

  for (const row of rows.filter((r) => r.is_active && r.department)) {
    const deptName = row.department!;
    if (departmentIds.has(deptName)) continue;

    const deptId = `dept-${slugify(deptName)}`;
    departmentIds.set(deptName, deptId);
    nodes.push({
      id: deptId,
      name: deptName,
      type: 'DEPARTMENT',
      parentId: COLOMBIA_NODE_ID,
      department: deptName,
      countryCode: 'CO',
      active: true,
    });
  }

  for (const row of rows.filter((r) => r.is_active)) {
    const deptName = row.department ?? '';
    const parentId = departmentIds.get(deptName) ?? COLOMBIA_NODE_ID;

    nodes.push({
      id: row.id,
      name: row.name,
      type: 'CITY',
      parentId,
      department: deptName || undefined,
      countryCode: row.country_code ?? 'CO',
      latitude: row.latitude,
      longitude: row.longitude,
      description: row.description,
      active: row.is_active,
    });
  }

  return nodes;
}

export function rowsToZoneNodes(
  rows: EmergencyZoneDbRow[],
  mode: ZoneSchemaMode
): EmergencyZoneNode[] {
  if (mode === 'flat') {
    return buildTreeFromFlatRows(rows);
  }

  return rows.map(rowToZoneNode);
}

/** Resolve mock slug IDs to Supabase UUIDs when code column is present */
export function buildCodeToIdMap(rows: EmergencyZoneDbRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.code) {
      map.set(row.code, row.id);
    }
  }
  return map;
}

export function resolveZoneId(
  zoneId: string,
  codeToId: Map<string, string>
): string {
  return codeToId.get(zoneId) ?? zoneId;
}

export function dbRowToPublic(row: EmergencyZoneDbRow) {
  const isCity = isCityLevelZone(rowToZoneNode(row));
  const isDept = isDepartmentZone(rowToZoneNode(row));

  return {
    id: row.id,
    name: row.name,
    type: row.type ?? inferZoneType(row),
    parent_id: row.parent_id ?? null,
    code: row.code ?? null,
    city: isCity ? row.city ?? row.name : row.city,
    department: isDept ? row.name : row.department,
    country_code: row.country_code ?? 'CO',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    description: row.description ?? null,
    is_active: row.is_active,
  };
}
