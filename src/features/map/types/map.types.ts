export type MapLocationType = 'PERSON' | 'PET' | 'FACILITY';

export type PersonMapStatus = 'MISSING' | 'FOUND' | 'UNIDENTIFIED';

export type FacilityType = 'HOSPITAL' | 'MEDICAL_CENTER' | 'SHELTER' | 'OTHER';

export type { ZoneType, EmergencyZoneNode } from '@/src/types/emergency-zone';

/** Nodo geográfico usado en mapa y filtros */
export type EmergencyZone = import('@/src/types/emergency-zone').EmergencyZoneNode;

export interface MapFilter {
  type: 'ALL' | 'PERSON' | 'PET' | 'FACILITY';
  status: 'ALL' | PersonMapStatus;
  /** Ciudad/municipio/distrito específico, o ALL */
  zoneId: string;
  /** Departamento, o ALL */
  departmentId: string;
}

export interface MapLocationBase {
  id: string;
  zoneId: string;
  zoneName: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface PersonLocation extends MapLocationBase {
  type: 'PERSON';
  status: PersonMapStatus;
  personId: string;
  name: string;
  photo?: string;
  lastSeenLocation?: string;
  currentLocation?: string;
  lastSeenDate: string;
}

export interface PetLocation extends MapLocationBase {
  type: 'PET';
  petId: string;
  name: string;
  photo?: string;
  lastSeenLocation?: string;
  currentLocation?: string;
  lastSeenDate: string;
}

export interface FacilityLocation extends MapLocationBase {
  type: 'FACILITY';
  facilityType: FacilityType;
  locationId: string;
  name: string;
  registeredCount: number;
}

export type MapLocation = PersonLocation | PetLocation | FacilityLocation;

export interface MapMarker {
  id: string;
  type: MapLocationType;
  status?: PersonMapStatus | FacilityType;
  latitude: number;
  longitude: number;
  personId?: string;
  petId?: string;
  locationId?: string;
  zoneId: string;
  label: string;
}

export interface MapCluster {
  id: string;
  zoneId: string;
  latitude: number;
  longitude: number;
  count: number;
  label: string;
  items: MapLocation[];
}

export interface ZoneStats {
  zoneId: string;
  zoneName: string;
  zoneType: import('@/src/types/emergency-zone').ZoneType;
  department: string;
  parentId?: string | null;
  total: number;
  missing: number;
  found: number;
  unidentified: number;
  pets: number;
  facilities: number;
  /** Desglose por ciudades/municipios hijos (departamentos) */
  childStats?: ZoneStats[];
}

export interface MapViewProps {
  locations: MapLocation[];
  zones: EmergencyZone[];
  mapDisplayZones: EmergencyZone[];
  selectedLocation: MapLocation | null;
  selectedZone: EmergencyZone | null;
  activeZoneStats: ZoneStats | null;
  filters: MapFilter;
  onLocationSelect: (location: MapLocation | null) => void;
  onZoneSelect: (zone: EmergencyZone | null) => void;
  onFiltersChange: (filters: Partial<MapFilter>) => void;
  onViewLocationDetail?: (location: MapLocation) => void;
  onViewZoneRecords?: (zoneId: string) => void;
  onOpenRegister?: () => void;
}

export interface MapProviderConfig {
  center: [number, number];
  zoom: number;
  tileUrl?: string;
  attribution?: string;
  /** When false, disables all user interaction and hides the zoom control (static preview) */
  interactive?: boolean;
  /** Fires with the clicked point's coordinates — used by location pickers (e.g. the Ayuda form). */
  onMapClick?: (lat: number, lng: number) => void;
}

export interface MapProviderInstance {
  setView(center: [number, number], zoom?: number): void;
  getZoom(): number;
  panTo(center: [number, number]): void;
  addCircle(
    id: string,
    center: [number, number],
    radius: number,
    options: { color: string; fillColor: string; fillOpacity: number; weight: number }
  ): void;
  addMarker(
    id: string,
    center: [number, number],
    html: string,
    ariaLabel: string,
    onClick: () => void
  ): void;
  removeLayer(id: string): void;
  clearLayers(): void;
  invalidateSize(): void;
  destroy(): void;
}
