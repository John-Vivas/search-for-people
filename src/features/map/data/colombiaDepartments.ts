/**
 * Los 32 departamentos de Colombia (+ Bogotá D.C.), con un punto de referencia
 * (coords de su capital) para ubicar aproximadamente al registrar sin coords.
 *
 * Lista fija: el dropdown de "Departamento" del registro los muestra todos, y el
 * RPC create_community_zone crea el departamento por nombre si aún no existe.
 * Así hay cobertura nacional sin sembrar la BD ni depender de datos previos.
 */

export interface DepartmentRef {
  name: string;
  latitude: number;
  longitude: number;
}

export const COLOMBIA_DEPARTMENTS: DepartmentRef[] = [
  { name: 'Amazonas', latitude: -4.2153, longitude: -69.9406 },
  { name: 'Antioquia', latitude: 6.2442, longitude: -75.5736 },
  { name: 'Arauca', latitude: 7.0844, longitude: -70.7591 },
  { name: 'Atlántico', latitude: 10.9685, longitude: -74.7813 },
  { name: 'Bogotá D.C.', latitude: 4.7110, longitude: -74.0721 },
  { name: 'Bolívar', latitude: 10.3910, longitude: -75.4794 },
  { name: 'Boyacá', latitude: 5.5353, longitude: -73.3678 },
  { name: 'Caldas', latitude: 5.0703, longitude: -75.5138 },
  { name: 'Caquetá', latitude: 1.6144, longitude: -75.6062 },
  { name: 'Casanare', latitude: 5.3378, longitude: -72.3959 },
  { name: 'Cauca', latitude: 2.4448, longitude: -76.6147 },
  { name: 'Cesar', latitude: 10.4631, longitude: -73.2532 },
  { name: 'Chocó', latitude: 5.6947, longitude: -76.6583 },
  { name: 'Córdoba', latitude: 8.7479, longitude: -75.8814 },
  { name: 'Cundinamarca', latitude: 4.7110, longitude: -74.0721 },
  { name: 'Guainía', latitude: 3.8653, longitude: -67.9239 },
  { name: 'Guaviare', latitude: 2.5700, longitude: -72.6400 },
  { name: 'Huila', latitude: 2.9273, longitude: -75.2819 },
  { name: 'La Guajira', latitude: 11.5444, longitude: -72.9072 },
  { name: 'Magdalena', latitude: 11.2408, longitude: -74.1990 },
  { name: 'Meta', latitude: 4.1420, longitude: -73.6266 },
  { name: 'Nariño', latitude: 1.2136, longitude: -77.2811 },
  { name: 'Norte de Santander', latitude: 7.8939, longitude: -72.5078 },
  { name: 'Putumayo', latitude: 1.1498, longitude: -76.6478 },
  { name: 'Quindío', latitude: 4.5350, longitude: -75.6811 },
  { name: 'Risaralda', latitude: 4.8143, longitude: -75.6946 },
  { name: 'San Andrés y Providencia', latitude: 12.5847, longitude: -81.7006 },
  { name: 'Santander', latitude: 7.1193, longitude: -73.1227 },
  { name: 'Sucre', latitude: 9.3047, longitude: -75.3978 },
  { name: 'Tolima', latitude: 4.4389, longitude: -75.2322 },
  { name: 'Valle del Cauca', latitude: 3.4516, longitude: -76.5320 },
  { name: 'Vaupés', latitude: 1.2536, longitude: -70.2339 },
  { name: 'Vichada', latitude: 6.1890, longitude: -67.4859 },
];
