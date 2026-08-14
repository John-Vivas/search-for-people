import { useEffect, useRef } from 'react';
import { defaultMapProviderFactory } from '@/src/features/map/services/mapProvider';
import type { MapProviderInstance } from '@/src/features/map/types/map.types';

interface StaticLocationMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
}

function markerHtml(): string {
  return `
    <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;transform:translateY(-4px);">
      <span class="material-symbols-outlined" style="font-size:36px;color:#ba1a1a;text-shadow:0 1px 3px rgba(0,0,0,.35);">location_on</span>
    </div>
  `;
}

/** Small, non-interactive map showing a single point — e.g. a request's delivery location in its detail panel. */
export function StaticLocationMap({ latitude, longitude, zoom = 15 }: StaticLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<MapProviderInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current || providerRef.current) return;

    const provider = defaultMapProviderFactory(containerRef.current, {
      center: [latitude, longitude],
      zoom,
      interactive: false,
    });
    provider.addMarker('point', [latitude, longitude], markerHtml(), 'Punto de entrega', () => {});
    providerRef.current = provider;

    return () => {
      provider.destroy();
      providerRef.current = null;
    };
    // Only mount once per instance — this preview never needs to re-center.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-40 rounded-xl overflow-hidden bg-[#e7e8e9] z-0"
      role="img"
      aria-label="Ubicación del punto de entrega"
    />
  );
}
