import { useState, useMemo, useCallback } from 'react';
import {
  MapFilter,
  MapLocation,
  EmergencyZone,
  ZoneStats,
} from '../types/map.types';
import { filterMapLocations } from '../services/mapService';
import {
  computeStatsForZoneIds,
  getCitiesForDepartment,
  getDescendantZoneIds,
  getMapDisplayZones,
  getDepartmentZones,
} from '../utils/zoneTree';
import { isDepartmentZone } from '../../../types/emergency-zone';

const DEFAULT_FILTERS: MapFilter = {
  type: 'ALL',
  status: 'ALL',
  zoneId: 'ALL',
  departmentId: 'ALL',
};

function buildCityStats(
  locations: MapLocation[],
  zone: EmergencyZone,
  zones: EmergencyZone[]
): ZoneStats {
  return computeStatsForZoneIds(locations, [zone.id], zone, zones);
}

function buildDepartmentStats(
  locations: MapLocation[],
  department: EmergencyZone,
  zones: EmergencyZone[]
): ZoneStats {
  const cityZones = getCitiesForDepartment(zones, department.id);
  const descendantIds = getDescendantZoneIds(zones, department.id);
  const base = computeStatsForZoneIds(locations, descendantIds, department, zones);
  return {
    ...base,
    childStats: cityZones.map((city) => buildCityStats(locations, city, zones)),
  };
}

export function useMapFilters(
  locations: MapLocation[],
  zones: EmergencyZone[]
) {
  const [filters, setFilters] = useState<MapFilter>(DEFAULT_FILTERS);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [selectedZone, setSelectedZone] = useState<EmergencyZone | null>(null);

  const mapDisplayZones = useMemo(() => getMapDisplayZones(zones), [zones]);
  const departmentZones = useMemo(() => getDepartmentZones(zones), [zones]);

  const filteredLocations = useMemo(
    () => filterMapLocations(locations, filters, zones),
    [locations, filters, zones]
  );

  const zoneStats = useMemo((): ZoneStats[] => {
    return mapDisplayZones.map((zone) => buildCityStats(locations, zone, zones));
  }, [locations, mapDisplayZones, zones]);

  const departmentStats = useMemo((): ZoneStats[] => {
    return departmentZones.map((dept) =>
      buildDepartmentStats(locations, dept, zones)
    );
  }, [locations, departmentZones, zones]);

  const activeZoneStats = useMemo(() => {
    if (selectedZone) {
      if (isDepartmentZone(selectedZone)) {
        return departmentStats.find((s) => s.zoneId === selectedZone.id) ?? null;
      }
      return zoneStats.find((s) => s.zoneId === selectedZone.id) ?? null;
    }

    if (filters.zoneId !== 'ALL') {
      return zoneStats.find((s) => s.zoneId === filters.zoneId) ?? null;
    }

    if (filters.departmentId !== 'ALL') {
      return departmentStats.find((s) => s.zoneId === filters.departmentId) ?? null;
    }

    return null;
  }, [selectedZone, filters.zoneId, filters.departmentId, zoneStats, departmentStats]);

  const updateFilters = useCallback((partial: Partial<MapFilter>) => {
    setFilters((prev) => {
      const next = { ...prev, ...partial };

      if (partial.departmentId !== undefined && partial.departmentId !== prev.departmentId) {
        if (partial.zoneId === undefined && next.zoneId !== 'ALL') {
          const city = zones.find((z) => z.id === next.zoneId);
          if (city?.parentId !== next.departmentId && next.departmentId !== 'ALL') {
            next.zoneId = 'ALL';
          }
        }
      }

      return next;
    });
    setSelectedLocation(null);
  }, [zones]);

  const selectZone = useCallback(
    (zone: EmergencyZone | null) => {
      setSelectedZone(zone);
      setSelectedLocation(null);
      if (zone) {
        if (isDepartmentZone(zone)) {
          setFilters((prev) => ({
            ...prev,
            departmentId: zone.id,
            zoneId: 'ALL',
          }));
        } else {
          setFilters((prev) => ({
            ...prev,
            zoneId: zone.id,
            departmentId: zone.parentId ?? prev.departmentId,
          }));
        }
      } else {
        setFilters((prev) => ({ ...prev, zoneId: 'ALL', departmentId: 'ALL' }));
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
    departmentStats,
    activeZoneStats,
    mapDisplayZones,
    departmentZones,
    selectedLocation,
    selectedZone,
    updateFilters,
    selectZone,
    selectLocation,
    resetSelection,
    setFilters,
  };
}
