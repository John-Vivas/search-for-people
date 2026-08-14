import { useEffect, useState } from 'react';

/**
 * Best-effort browser geolocation, requested once. Used only to show a
 * rough "how far is this" distance on the aid board — never required, and
 * silently absent if the user denies it or the browser doesn't support it.
 */
export function useUserLocation(): { lat: number; lng: number } | null {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // Denied or unavailable — the board works fine without a distance.
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  return location;
}
