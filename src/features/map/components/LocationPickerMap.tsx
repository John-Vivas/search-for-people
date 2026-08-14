import { useEffect, useRef } from 'react';
import { defaultMapProviderFactory } from '@/src/features/map/services/mapProvider';
import type { MapProviderInstance } from '@/src/features/map/types/map.types';

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  /** Center to use before the user has picked a point (e.g. the selected city). */
  defaultCenter?: [number, number];
  onPick: (lat: number, lng: number) => void;
}

const FALLBACK_CENTER: [number, number] = [4.65, -76.2];
const DEFAULT_ZOOM = 6;
const PICKED_ZOOM = 15;
const MARKER_ID = 'picked-point';

function markerHtml(): string {
  return `
    <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;transform:translateY(-4px);">
      <span class="material-symbols-outlined" style="font-size:40px;color:#ba1a1a;text-shadow:0 1px 3px rgba(0,0,0,.35);">location_on</span>
    </div>
  `;
}

/**
 * A small click-to-place-a-pin map. Used where a precise address is
 * optional but a point on the map (e.g. a meeting point or collection
 * center) helps just as well — see AidRequestForm.
 */
export function LocationPickerMap({ latitude, longitude, defaultCenter, onPick }: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<MapProviderInstance | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!containerRef.current || providerRef.current) return;

    const hasPoint = latitude != null && longitude != null;
    const provider = defaultMapProviderFactory(containerRef.current, {
      center: hasPoint ? [latitude as number, longitude as number] : defaultCenter ?? FALLBACK_CENTER,
      zoom: hasPoint ? PICKED_ZOOM : DEFAULT_ZOOM,
      onMapClick: (lat, lng) => onPickRef.current(lat, lng),
    });
    providerRef.current = provider;

    return () => {
      provider.destroy();
      providerRef.current = null;
    };
    // Only mount/unmount once — lat/lng updates are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) return;

    provider.clearLayers();
    if (latitude != null && longitude != null) {
      provider.addMarker(MARKER_ID, [latitude, longitude], markerHtml(), 'Punto seleccionado', () => {});
      provider.setView([latitude, longitude], PICKED_ZOOM);
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="w-full h-56 rounded-xl overflow-hidden bg-[#e7e8e9] z-0"
      role="application"
      aria-label="Selecciona un punto en el mapa"
    />
  );
}
