export type MapLocationType = 'PERSON' | 'PET' | 'FACILITY';

export type PersonMapStatus = 'MISSING' | 'FOUND' | 'UNIDENTIFIED';

export type FacilityType = 'HOSPITAL' | 'MEDICAL_CENTER' | 'SHELTER' | 'OTHER';

export interface EmergencyZone {
  id: string;
  name: string;
  department: string;
  latitude: number;
  longitude: number;
  active: boolean;
  /** Radio aproximado en metros para visualización MVP */
  affectedArea?: number;
}

export interface MapFilter {
  type: 'ALL' | 'PERSON' | 'PET' | 'FACILITY';
  status: 'ALL' | PersonMapStatus;
  zoneId: string;
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
  department: string;
  total: number;
  missing: number;
  found: number;
  unidentified: number;
  pets: number;
  facilities: number;
}

export interface MapViewProps {
  locations: MapLocation[];
  zones: EmergencyZone[];
  selectedLocation: MapLocation | null;
  selectedZone: EmergencyZone | null;
  activeZoneStats: ZoneStats | null;
  filters: MapFilter;
  onLocationSelect: (location: MapLocation | null) => void;
  onZoneSelect: (zone: EmergencyZone | null) => void;
  onFiltersChange: (filters: Partial<MapFilter>) => void;
  onViewLocationDetail?: (location: MapLocation) => void;
  onViewZoneRecords?: (zoneId: string) => void;
}

export interface MapProviderConfig {
  center: [number, number];
  zoom: number;
  tileUrl?: string;
  attribution?: string;
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
