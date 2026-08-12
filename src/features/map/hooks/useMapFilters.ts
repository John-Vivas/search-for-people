import { useState, useMemo, useCallback } from 'react';
import {
  MapFilter,
  MapLocation,
  EmergencyZone,
  ZoneStats,
} from '../types/map.types';
import { filterMapLocations } from '../services/mapService';

const DEFAULT_FILTERS: MapFilter = {
  type: 'ALL',
  status: 'ALL',
  zoneId: 'ALL',
};

export function useMapFilters(
  locations: MapLocation[],
  zones: EmergencyZone[]
) {
  const [filters, setFilters] = useState<MapFilter>(DEFAULT_FILTERS);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [selectedZone, setSelectedZone] = useState<EmergencyZone | null>(null);

  const filteredLocations = useMemo(
    () => filterMapLocations(locations, filters),
    [locations, filters]
  );

  const zoneStats = useMemo((): ZoneStats[] => {
    return zones.map((zone) => {
      const zoneLocs = locations.filter((l) => l.zoneId === zone.id);
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        department: zone.department,
        total: zoneLocs.length,
        missing: zoneLocs.filter((l) => l.type === 'PERSON' && l.status === 'MISSING').length,
        found: zoneLocs.filter((l) => l.type === 'PERSON' && l.status === 'FOUND').length,
        unidentified: zoneLocs.filter(
          (l) => l.type === 'PERSON' && l.status === 'UNIDENTIFIED'
        ).length,
        pets: zoneLocs.filter((l) => l.type === 'PET').length,
        facilities: zoneLocs.filter((l) => l.type === 'FACILITY').length,
      };
    });
  }, [locations, zones]);

  const activeZoneStats = useMemo(() => {
    if (selectedZone) {
      return zoneStats.find((s) => s.zoneId === selectedZone.id) ?? null;
    }
    if (filters.zoneId !== 'ALL') {
      return zoneStats.find((s) => s.zoneId === filters.zoneId) ?? null;
    }
    return null;
  }, [selectedZone, filters.zoneId, zoneStats]);

  const updateFilters = useCallback((partial: Partial<MapFilter>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setSelectedLocation(null);
  }, []);

  const selectZone = useCallback(
    (zone: EmergencyZone | null) => {
      setSelectedZone(zone);
      setSelectedLocation(null);
      if (zone) {
        setFilters((prev) => ({ ...prev, zoneId: zone.id }));
      } else {
        setFilters((prev) => ({ ...prev, zoneId: 'ALL' }));
      }
    },
    []
  );

  const selectLocation = useCallback((location: MapLocation | null) => {
    setSelectedLocation(location);
    if (location) setSelectedZone(null);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedLocation(null);
    setSelectedZone(null);
  }, []);

  return {
    filters,
    filteredLocations,
    zoneStats,
    activeZoneStats,
    selectedLocation,
    selectedZone,
    updateFilters,
    selectZone,
    selectLocation,
    resetSelection,
    setFilters,
  };
}
