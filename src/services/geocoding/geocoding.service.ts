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
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
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

/**
 * Best-effort coordinates → address, for when someone picks a point on the
 * map instead of typing one (e.g. the Ayuda location picker). Same
 * best-effort contract as geocodeAddress: null on any failure, caller falls
 * back to something else (e.g. raw coordinates as text).
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `${NOMINATIM_REVERSE_URL}?format=json&lat=${latitude}&lon=${longitude}&zoom=18`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { display_name?: string };
    return data.display_name?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
