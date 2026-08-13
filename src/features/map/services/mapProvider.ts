import L from 'leaflet';
import { MapProviderConfig, MapProviderInstance } from '@/src/features/map/types/map.types';

const DEFAULT_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION = '&copy; OpenStreetMap contributors';

export function createLeafletProvider(
  container: HTMLElement,
  config: MapProviderConfig
): MapProviderInstance {
  const interactive = config.interactive !== false;

  const map = L.map(container, {
    center: config.center,
    zoom: config.zoom,
    zoomControl: false,
    dragging: interactive,
    scrollWheelZoom: interactive,
    doubleClickZoom: interactive,
    boxZoom: interactive,
    keyboard: interactive,
    touchZoom: interactive,
  });

  L.tileLayer(config.tileUrl ?? DEFAULT_TILE, {
    attribution: config.attribution ?? DEFAULT_ATTRIBUTION,
    maxZoom: 19,
  }).addTo(map);

  if (interactive) {
    L.control.zoom({ position: 'topright' }).addTo(map);
  }

  const layers = new Map<string, L.Layer>();

  return {
    setView(center, zoom) {
      map.setView(center, zoom ?? map.getZoom());
    },
    getZoom() {
      return map.getZoom();
    },
    panTo(center) {
      map.panTo(center);
    },
    addCircle(id, center, radius, options) {
      const circle = L.circle(center, {
        radius,
        color: options.color,
        fillColor: options.fillColor,
        fillOpacity: options.fillOpacity,
        weight: options.weight,
      }).addTo(map);
      layers.set(id, circle);
    },
    addMarker(id, center, html, ariaLabel, onClick) {
      const icon = L.divIcon({
        className: 'map-custom-marker',
        html,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });
      const marker = L.marker(center, { icon, alt: ariaLabel }).addTo(map);
      marker.on('click', onClick);
      layers.set(id, marker);
    },
    removeLayer(id) {
      const layer = layers.get(id);
      if (layer) {
        map.removeLayer(layer);
        layers.delete(id);
      }
    },
    clearLayers() {
      layers.forEach((layer) => map.removeLayer(layer));
      layers.clear();
    },
    invalidateSize() {
      map.invalidateSize();
    },
    destroy() {
      map.remove();
      layers.clear();
    },
  };
}

/** Punto de extensión para Mapbox / Google Maps */
export type MapProviderFactory = (
  container: HTMLElement,
  config: MapProviderConfig
) => MapProviderInstance;

export const defaultMapProviderFactory: MapProviderFactory = createLeafletProvider;
