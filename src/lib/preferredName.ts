const STORAGE_KEY = 'estamos-buscando:preferred-name';

/**
 * Remembers the last name someone typed on the Ayuda board (as requester or
 * as provider) so they aren't asked to retype it every single time — just
 * a local convenience default, always editable, never sent anywhere on its
 * own. Fails silently if localStorage is unavailable (private browsing, etc).
 */
export function getPreferredName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setPreferredName(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } catch {
    // Non-critical — just skip remembering it this time.
  }
}
