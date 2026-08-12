/**
 * Tipos geográficos centralizados — compatibles con emergency_zones (Supabase).
 * Jerarquía: COUNTRY → DEPARTMENT → CITY | MUNICIPALITY | DISTRICT | EMERGENCY_ZONE
 */

export type ZoneType =
  | 'COUNTRY'
  | 'DEPARTMENT'
  | 'CITY'
  | 'MUNICIPALITY'
  | 'DISTRICT'
  | 'EMERGENCY_ZONE';

/** Nodos geográficos mapeables en UI y filtros */
export interface EmergencyZoneNode {
  id: string;
  name: string;
  type: ZoneType;
  parentId?: string | null;
  /** Nombre del departamento (denormalizado en ciudades para display rápido) */
  department?: string;
  countryCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  active: boolean;
  /** Radio aproximado en metros — solo zonas con coordenadas en el mapa */
  affectedArea?: number;
}

export const ZONE_TYPES_WITH_COORDINATES: ZoneType[] = [
  'CITY',
  'MUNICIPALITY',
  'DISTRICT',
  'EMERGENCY_ZONE',
];

export const ZONE_TYPES_FILTERABLE: ZoneType[] = [
  'DEPARTMENT',
  'CITY',
  'MUNICIPALITY',
  'DISTRICT',
  'EMERGENCY_ZONE',
];

export function isMapDisplayZone(zone: EmergencyZoneNode): boolean {
  return (
    ZONE_TYPES_WITH_COORDINATES.includes(zone.type) &&
    zone.latitude != null &&
    zone.longitude != null &&
    zone.active
  );
}

export function isDepartmentZone(zone: EmergencyZoneNode): boolean {
  return zone.type === 'DEPARTMENT';
}

export function isCityLevelZone(zone: EmergencyZoneNode): boolean {
  return ZONE_TYPES_WITH_COORDINATES.includes(zone.type);
}
