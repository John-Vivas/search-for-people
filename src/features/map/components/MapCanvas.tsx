import { useEffect, useRef } from 'react';
import {
  EmergencyZone,
  MapLocation,
  MapCluster,
} from '../types/map.types';
import { defaultMapProviderFactory } from '../services/mapProvider';
import type { MapProviderInstance } from '../types/map.types';
import { resolveMapDisplay } from '../services/clustering';
import { isMapDisplayZone } from '../../../types/emergency-zone';

import {
  buildMarkerHtml,
  buildClusterHtml,
  buildZoneAreaStyle,
  getMarkerStyle,
} from './MarkerIcon';

interface MapCanvasProps {
  zones: EmergencyZone[];
  allZones: EmergencyZone[];
  locations: MapLocation[];
  zoneFilter: string;
  departmentFilter: string;
  selectedLocationId: string | null;
  selectedZoneId: string | null;
  onLocationSelect: (location: MapLocation) => void;
  onZoneSelect: (zone: EmergencyZone) => void;
  onClusterSelect?: (cluster: MapCluster) => void;
  centerOnZone?: EmergencyZone | null;
}

const DEFAULT_CENTER: [number, number] = [4.65, -76.2];
const DEFAULT_ZOOM = 7;
const ZONE_ZOOM = 11;

export function MapCanvas({
  zones,
  allZones,
  locations,
  zoneFilter,
  departmentFilter,
  selectedLocationId,
  selectedZoneId,
  onLocationSelect,
  onZoneSelect,
  onClusterSelect,
  centerOnZone,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<MapProviderInstance | null>(null);
  const zoomRef = useRef(DEFAULT_ZOOM);

  useEffect(() => {
    if (!containerRef.current || providerRef.current) return;

    const provider = defaultMapProviderFactory(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    providerRef.current = provider;

    const container = containerRef.current;
    const handleResize = () => provider.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      provider.destroy();
      providerRef.current = null;
    };
  }, []);

  const renderMarkers = () => {
    const provider = providerRef.current;
    if (!provider) return;

    provider.clearLayers();

    const zoom = provider.getZoom();
    zoomRef.current = zoom;
    const display = resolveMapDisplay(
      zones,
      locations,
      zoom,
      zoneFilter,
      departmentFilter,
      allZones
    );

    zones.filter(isMapDisplayZone).forEach((zone) => {
      if (!zone.affectedArea || zone.latitude == null || zone.longitude == null) return;
      const isActive =
        selectedZoneId === zone.id ||
        zoneFilter === zone.id ||
        (departmentFilter !== 'ALL' && zone.parentId === departmentFilter);
      const areaStyle = buildZoneAreaStyle(isActive);
      provider.addCircle(
        `zone-area-${zone.id}`,
        [zone.latitude, zone.longitude],
        zone.affectedArea,
        areaStyle
      );
    });

    if (display.mode === 'zones' || display.mode === 'clusters') {
      display.clusters.forEach((cluster) => {
        const isSelected = selectedZoneId === cluster.zoneId;
        provider.addMarker(
          cluster.id,
          [cluster.latitude, cluster.longitude],
          buildClusterHtml(cluster.count, cluster.label, isSelected),
          `${cluster.label}: ${cluster.count} registros`,
          () => {
            if (display.mode === 'zones') {
              const zone = allZones.find((z) => z.id === cluster.zoneId);
              if (zone) onZoneSelect(zone);
            } else if (onClusterSelect) {
              onClusterSelect(cluster);
              provider.setView([cluster.latitude, cluster.longitude], Math.min(zoom + 2, 14));
            }
          }
        );
      });
      return;
    }

    locations.forEach((loc) => {
      const style =
        loc.type === 'FACILITY'
          ? getMarkerStyle('FACILITY', loc.facilityType)
          : loc.type === 'PET'
          ? getMarkerStyle('PET')
          : getMarkerStyle('PERSON', loc.status);

      const selected = selectedLocationId === loc.id;
      provider.addMarker(
        loc.id,
        [loc.latitude, loc.longitude],
        buildMarkerHtml(style, selected),
        style.label,
        () => {
          onLocationSelect(loc);
          provider.panTo([loc.latitude, loc.longitude]);
        }
      );
    });
  };

  useEffect(() => {
    renderMarkers();
  }, [
    zones,
    allZones,
    locations,
    zoneFilter,
    departmentFilter,
    selectedLocationId,
    selectedZoneId,
    centerOnZone,
    onLocationSelect,
    onZoneSelect,
    onClusterSelect,
  ]);

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider || !containerRef.current) return;

    if (centerOnZone?.latitude != null && centerOnZone.longitude != null) {
      provider.setView([centerOnZone.latitude, centerOnZone.longitude], ZONE_ZOOM);
      zoomRef.current = ZONE_ZOOM;
      renderMarkers();
    }
  }, [centerOnZone]);

  useEffect(() => {
    const timer = setTimeout(() => providerRef.current?.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, [centerOnZone]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[280px] bg-[#e7e8e9] z-0"
      role="application"
      aria-label="Mapa de zonas de emergencia"
    />
  );
}
