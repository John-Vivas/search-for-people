import type { EmergencyZoneNode } from '../../types/emergency-zone';

/**
 * Árbol geográfico del MVP — fuente de verdad para mock (reemplazable por Supabase).
 *
 * Colombia
 * ├── Valle del Cauca → Cali, Buenaventura
 * ├── Risaralda → Pereira
 * ├── Chocó → Quibdó, Condoto
 * ├── Caldas → Manizales
 * └── Quindío → Armenia
 */
export const EMERGENCY_ZONE_TREE: EmergencyZoneNode[] = [
  {
    id: 'colombia',
    name: 'Colombia',
    type: 'COUNTRY',
    countryCode: 'CO',
    active: true,
  },

  // ── Departamentos ──
  {
    id: 'dept-valle',
    name: 'Valle del Cauca',
    type: 'DEPARTMENT',
    parentId: 'colombia',
    countryCode: 'CO',
    active: true,
  },
  {
    id: 'dept-risaralda',
    name: 'Risaralda',
    type: 'DEPARTMENT',
    parentId: 'colombia',
    countryCode: 'CO',
    active: true,
  },
  {
    id: 'dept-choco',
    name: 'Chocó',
    type: 'DEPARTMENT',
    parentId: 'colombia',
    countryCode: 'CO',
    active: true,
  },
  {
    id: 'dept-caldas',
    name: 'Caldas',
    type: 'DEPARTMENT',
    parentId: 'colombia',
    countryCode: 'CO',
    active: true,
  },
  {
    id: 'dept-quindio',
    name: 'Quindío',
    type: 'DEPARTMENT',
    parentId: 'colombia',
    countryCode: 'CO',
    active: true,
  },

  // ── Valle del Cauca ──
  {
    id: 'zone-cali',
    name: 'Cali',
    type: 'CITY',
    parentId: 'dept-valle',
    department: 'Valle del Cauca',
    latitude: 3.4516,
    longitude: -76.532,
    active: true,
    affectedArea: 12000,
  },
  {
    id: 'zone-buenaventura',
    name: 'Buenaventura',
    type: 'DISTRICT',
    parentId: 'dept-valle',
    department: 'Valle del Cauca',
    latitude: 3.8801,
    longitude: -77.0318,
    active: true,
    affectedArea: 7000,
  },

  // ── Risaralda ──
  {
    id: 'zone-pereira',
    name: 'Pereira',
    type: 'CITY',
    parentId: 'dept-risaralda',
    department: 'Risaralda',
    latitude: 4.8133,
    longitude: -75.6961,
    active: true,
    affectedArea: 10000,
  },

  // ── Chocó ──
  {
    id: 'zone-quibdo',
    name: 'Quibdó',
    type: 'CITY',
    parentId: 'dept-choco',
    department: 'Chocó',
    latitude: 5.6947,
    longitude: -76.6611,
    active: true,
    affectedArea: 8000,
  },
  {
    id: 'zone-condoto',
    name: 'Condoto',
    type: 'MUNICIPALITY',
    parentId: 'dept-choco',
    department: 'Chocó',
    latitude: 5.0933,
    longitude: -76.6528,
    active: true,
    affectedArea: 6000,
  },

  // ── Caldas ──
  {
    id: 'zone-manizales',
    name: 'Manizales',
    type: 'CITY',
    parentId: 'dept-caldas',
    department: 'Caldas',
    latitude: 5.0703,
    longitude: -75.5138,
    active: true,
    affectedArea: 9000,
  },

  // ── Quindío ──
  {
    id: 'zone-armenia',
    name: 'Armenia',
    type: 'CITY',
    parentId: 'dept-quindio',
    department: 'Quindío',
    latitude: 4.5339,
    longitude: -75.6811,
    active: true,
    affectedArea: 8000,
  },
];

/** @deprecated Usar EMERGENCY_ZONE_TREE — alias temporal para compatibilidad */
export const EMERGENCY_ZONES = EMERGENCY_ZONE_TREE;
