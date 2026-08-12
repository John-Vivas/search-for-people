import { useState, useEffect, useCallback } from 'react';
import { EmergencyZone, MapLocation } from '../types/map.types';
import { mapService } from '../services/mapService';

export function useMapData() {
  const [zones, setZones] = useState<EmergencyZone[]>([]);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await mapService.getMapData();
    if (res.data) {
      setZones(res.data.zones);
      setLocations(res.data.locations);
    } else {
      setError('No se pudieron cargar los datos del mapa');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { zones, locations, loading, error, reload: load };
}
