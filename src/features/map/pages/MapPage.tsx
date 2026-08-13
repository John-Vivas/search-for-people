import React from 'react';
import { MapView } from '@/src/features/map/components/MapView';
import { useMapData } from '@/src/features/map/hooks/useMapData';
import { useMapFilters } from '@/src/features/map/hooks/useMapFilters';
import { MapLocation } from '@/src/features/map/types/map.types';

interface MapPageProps {
  onViewLocationDetail?: (location: MapLocation) => void;
}

export const MapPage: React.FC<MapPageProps> = ({ onViewLocationDetail }) => {
  const { zones, locations, loading, error } = useMapData();
  const {
    filters,
    filteredLocations,
    activeZoneStats,
    mapDisplayZones,
    selectedLocation,
    selectedZone,
    updateFilters,
    selectZone,
    selectLocation,
  } = useMapFilters(locations, zones);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] md:h-[calc(100vh-72px)]">
        <div className="text-center">
          <span className="material-symbols-outlined text-[40px] text-[#008376] animate-pulse">
            map
          </span>
          <p className="text-sm text-[#6d7a77] mt-2">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] md:h-[calc(100vh-72px)]">
        <p className="text-sm text-[#ba1a1a]">{error}</p>
      </div>
    );
  }

  const handleViewZoneRecords = (zoneId: string) => {
    updateFilters({ zoneId });
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) selectZone(zone);
  };

  return (
    <MapView
      locations={filteredLocations}
      zones={zones}
      mapDisplayZones={mapDisplayZones}
      selectedLocation={selectedLocation}
      selectedZone={selectedZone}
      activeZoneStats={activeZoneStats}
      filters={filters}
      onLocationSelect={selectLocation}
      onZoneSelect={selectZone}
      onFiltersChange={updateFilters}
      onViewLocationDetail={onViewLocationDetail}
      onViewZoneRecords={handleViewZoneRecords}
    />
  );
};
