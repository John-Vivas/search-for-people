import { useEffect, useRef } from 'react';
import { defaultMapProviderFactory } from '@/src/features/map/services/mapProvider';
import type { MapProviderInstance } from '@/src/features/map/types/map.types';

interface PersonLocationMapProps {
  coordinates: [number, number];
  label: string;
  /** Marker color (defaults to the "missing" red) */
  markerColor?: string;
  zoom?: number;
  /** When false, renders a non-interactive static preview (clicks pass through) */
  interactive?: boolean;
}

/**
 * Small interactive Leaflet map centered on a single point, used in the
 * person/pet detail view to show the last-seen location.
 */
export function PersonLocationMap({
  coordinates,
  label,
  markerColor = '#ba1a1a',
  zoom = 15,
  interactive = true,
}: PersonLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<MapProviderInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current || providerRef.current) return;

    const provider = defaultMapProviderFactory(containerRef.current, {
      center: coordinates,
      zoom,
      interactive,
    });
    providerRef.current = provider;

    const markerHtml = `
      <div style="display:flex;align-items:flex-end;justify-content:center;width:44px;height:44px;">
        <div style="width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(45deg);
          background:${markerColor};border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45);"></div>
      </div>`;
    provider.addMarker('person-location', coordinates, markerHtml, label, () => {});

    // Leaflet needs a size recalculation once the container has painted.
    const timer = setTimeout(() => provider.invalidateSize(), 150);

    return () => {
      clearTimeout(timer);
      provider.destroy();
      providerRef.current = null;
    };
  }, [coordinates, label, markerColor, zoom, interactive]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[128px] z-0 ${interactive ? '' : 'pointer-events-none'}`}
      role="application"
      aria-label={`Mapa: ${label}`}
    />
  );
}
