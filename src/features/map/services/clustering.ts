import { MapLocation, MapCluster, EmergencyZone } from '../types/map.types';

const CLUSTER_ZOOM_THRESHOLD = 10;

export function shouldShowClusters(zoom: number, zoneFilter: string): boolean {
  return zoom < CLUSTER_ZOOM_THRESHOLD && zoneFilter === 'ALL';
}

export function buildZoneClusters(
  zones: EmergencyZone[],
  locations: MapLocation[]
): MapCluster[] {
  return zones
    .filter((z) => z.active)
    .map((zone) => {
      const items = locations.filter((l) => l.zoneId === zone.id);
      return {
        id: `cluster-${zone.id}`,
        zoneId: zone.id,
        latitude: zone.latitude,
        longitude: zone.longitude,
        count: items.length,
        label: zone.name,
        items,
      };
    });
}

export function buildLocationClusters(
  locations: MapLocation[],
  gridSize = 0.02
): MapCluster[] {
  const buckets = new Map<string, MapLocation[]>();

  for (const loc of locations) {
    const key = `${Math.round(loc.latitude / gridSize)}_${Math.round(loc.longitude / gridSize)}`;
    const group = buckets.get(key) ?? [];
    group.push(loc);
    buckets.set(key, group);
  }

  return Array.from(buckets.entries()).map(([key, items]) => {
    const lat = items.reduce((s, i) => s + i.latitude, 0) / items.length;
    const lng = items.reduce((s, i) => s + i.longitude, 0) / items.length;
    return {
      id: `grid-${key}`,
      zoneId: items[0].zoneId,
      latitude: lat,
      longitude: lng,
      count: items.length,
      label: `${items.length} reportes`,
      items,
    };
  });
}

/** Agrupa marcadores según nivel de zoom — extensible para proveedores con clustering nativo */
export function resolveMapDisplay(
  zones: EmergencyZone[],
  locations: MapLocation[],
  zoom: number,
  zoneFilter: string
): { mode: 'zones' | 'clusters' | 'individual'; clusters: MapCluster[] } {
  if (shouldShowClusters(zoom, zoneFilter)) {
    return {
      mode: 'zones',
      clusters: buildZoneClusters(zones, locations),
    };
  }

  if (zoom < 12 && locations.length > 8) {
    return {
      mode: 'clusters',
      clusters: buildLocationClusters(locations),
    };
  }

  return { mode: 'individual', clusters: [] };
}
