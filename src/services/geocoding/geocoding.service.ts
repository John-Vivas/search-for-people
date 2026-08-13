/**
 * Geocoding — Best-effort address → coordinates via OpenStreetMap Nominatim.
 *
 * Nominatim es gratuito y sin API key, pero su cobertura de direcciones
 * colombianas (barrios informales, nomenclatura local) es irregular. Por eso
 * esta función es *best-effort*: devuelve null si no encuentra o si falla, y
 * el llamador debe caer a las coordenadas de la ciudad.
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_TIMEOUT_MS = 6000;

/**
 * Intenta geocodificar una dirección en Colombia. No lanza: devuelve null
 * ante cualquier error, timeout o resultado vacío.
 */
export async function geocodeAddress(parts: {
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
}): Promise<GeocodeResult | null> {
  const query = [parts.address, parts.neighborhood, parts.city, 'Colombia']
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(', ');

  if (!query || query === 'Colombia') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=co&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    const first = Array.isArray(data) ? data[0] : null;
    if (!first) return null;

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude, displayName: first.display_name };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
