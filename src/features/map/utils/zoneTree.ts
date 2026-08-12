import {
  EmergencyZoneNode,
  isCityLevelZone,
  isDepartmentZone,
  isMapDisplayZone,
  ZONE_TYPES_FILTERABLE,
} from '../../../types/emergency-zone';
import type { MapLocation } from '../types/map.types';

export function buildZoneIndex(zones: EmergencyZoneNode[]): Map<string, EmergencyZoneNode> {
  return new Map(zones.map((z) => [z.id, z]));
}

export function getZoneById(
  zones: EmergencyZoneNode[],
  id: string
): EmergencyZoneNode | undefined {
  return buildZoneIndex(zones).get(id);
}

export function getChildZones(
  zones: EmergencyZoneNode[],
  parentId: string
): EmergencyZoneNode[] {
  return zones.filter((z) => z.parentId === parentId && z.active);
}

export function getDescendantZoneIds(
  zones: EmergencyZoneNode[],
  ancestorId: string
): string[] {
  const index = buildZoneIndex(zones);
  const result: string[] = [];
  const queue = getChildZones(zones, ancestorId).map((z) => z.id);

  while (queue.length > 0) {
    const id = queue.shift()!;
    result.push(id);
    getChildZones(zones, id).forEach((child) => queue.push(child.id));
  }

  if (index.get(ancestorId) && isCityLevelZone(index.get(ancestorId)!)) {
    return [ancestorId, ...result];
  }

  return result;
}

export function getDepartmentZones(zones: EmergencyZoneNode[]): EmergencyZoneNode[] {
  return zones.filter((z) => isDepartmentZone(z) && z.active);
}

export function getCityLevelZones(zones: EmergencyZoneNode[]): EmergencyZoneNode[] {
  return zones.filter((z) => isCityLevelZone(z) && z.active);
}

export function getMapDisplayZones(zones: EmergencyZoneNode[]): EmergencyZoneNode[] {
  return zones.filter(isMapDisplayZone);
}

export function getFilterableZones(zones: EmergencyZoneNode[]): EmergencyZoneNode[] {
  return zones.filter((z) => ZONE_TYPES_FILTERABLE.includes(z.type) && z.active);
}

export function getCitiesForDepartment(
  zones: EmergencyZoneNode[],
  departmentId: string
): EmergencyZoneNode[] {
  return getDescendantZoneIds(zones, departmentId)
    .map((id) => getZoneById(zones, id))
    .filter((z): z is EmergencyZoneNode => z != null && isCityLevelZone(z));
}

export function resolveDepartmentName(
  zone: EmergencyZoneNode,
  zones: EmergencyZoneNode[]
): string {
  if (zone.department) return zone.department;
  if (isDepartmentZone(zone)) return zone.name;
  if (zone.parentId) {
    const parent = getZoneById(zones, zone.parentId);
    if (parent?.type === 'DEPARTMENT') return parent.name;
  }
  return '';
}

export function locationMatchesZoneFilter(
  location: MapLocation,
  zoneId: string,
  departmentId: string,
  zones: EmergencyZoneNode[]
): boolean {
  if (zoneId !== 'ALL') {
    return location.zoneId === zoneId;
  }

  if (departmentId !== 'ALL') {
    const descendantIds = getDescendantZoneIds(zones, departmentId);
    return descendantIds.includes(location.zoneId);
  }

  return true;
}

export function computeStatsForZoneIds(
  locations: MapLocation[],
  zoneIds: string[],
  zone: EmergencyZoneNode,
  zones: EmergencyZoneNode[]
) {
  const zoneLocs = locations.filter((l) => zoneIds.includes(l.zoneId));
  return {
    zoneId: zone.id,
    zoneName: zone.name,
    zoneType: zone.type,
    department: resolveDepartmentName(zone, zones),
    parentId: zone.parentId ?? null,
    total: zoneLocs.length,
    missing: zoneLocs.filter((l) => l.type === 'PERSON' && l.status === 'MISSING').length,
    found: zoneLocs.filter((l) => l.type === 'PERSON' && l.status === 'FOUND').length,
    unidentified: zoneLocs.filter(
      (l) => l.type === 'PERSON' && l.status === 'UNIDENTIFIED'
    ).length,
    pets: zoneLocs.filter((l) => l.type === 'PET').length,
    facilities: zoneLocs.filter((l) => l.type === 'FACILITY').length,
  };
}
