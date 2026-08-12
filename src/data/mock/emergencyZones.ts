import { EmergencyZone } from '../../features/map/types/map.types';

/**
 * Zonas iniciales del MVP.
 * Estos datos provienen de configuración/mock y deben reemplazarse por Supabase.
 * Coordenadas: centros aproximados de cada ciudad para visualización del MVP.
 */
export const EMERGENCY_ZONES: EmergencyZone[] = [
  {
    id: 'zone-cali',
    name: 'Cali',
    department: 'Valle del Cauca',
    latitude: 3.4516,
    longitude: -76.532,
    active: true,
    affectedArea: 12000,
  },
  {
    id: 'zone-pereira',
    name: 'Pereira',
    department: 'Risaralda',
    latitude: 4.8133,
    longitude: -75.6961,
    active: true,
    affectedArea: 10000,
  },
  {
    id: 'zone-quibdo',
    name: 'Quibdó',
    department: 'Chocó',
    latitude: 5.6947,
    longitude: -76.6611,
    active: true,
    affectedArea: 8000,
  },
  {
    id: 'zone-manizales',
    name: 'Manizales',
    department: 'Caldas',
    latitude: 5.0703,
    longitude: -75.5138,
    active: true,
    affectedArea: 9000,
  },
  {
    id: 'zone-buenaventura',
    name: 'Buenaventura',
    department: 'Valle del Cauca',
    latitude: 3.8801,
    longitude: -77.0318,
    active: true,
    affectedArea: 7000,
  },
  {
    id: 'zone-armenia',
    name: 'Armenia',
    department: 'Quindío',
    latitude: 4.5339,
    longitude: -75.6811,
    active: true,
    affectedArea: 8000,
  },
];
