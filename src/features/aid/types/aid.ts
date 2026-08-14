export type AidResourceType =
  | 'FOOD'
  | 'WATER'
  | 'SHELTER'
  | 'MEDICAL'
  | 'CLOTHING'
  | 'HYGIENE'
  | 'VOLUNTEERS'
  | 'TOOLS'
  | 'OTHER';

export type AidStatus = 'OPEN' | 'COMMITTED' | 'EN_ROUTE' | 'DELIVERED' | 'CANCELLED';

/**
 * Row shape returned by Supabase for public.aid_requests (public read) and
 * by the backend's write endpoints. Phone numbers are never part of this
 * shape — they live in aid_request_secrets and only the backend can read
 * them (see AidRequestPhones + aidRequestsService.listPhones).
 */
export interface AidRequest {
  id: string;
  resource_type: AidResourceType;
  resource_label: string | null;
  quantity: number | null;
  unit: string | null;
  urgency: number;
  status: AidStatus;
  description: string | null;
  requester_name: string;
  provider_name: string | null;
  eta_minutes: number | null;
  zone_id: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string;
  place_name: string | null;
  created_at: string;
  committed_at: string | null;
  delivered_at: string | null;
  updated_at: string;
}

/**
 * Who to call for a request — only available from the backend to a
 * logged-in (phone-verified) session. `requesterPhone` is shown to any
 * logged-in viewer so they can reach out before committing; `providerPhone`
 * only exists once someone has committed.
 */
export interface AidRequestPhones {
  id: string;
  requesterPhone: string;
  providerPhone: string | null;
}

/**
 * Optional fields must be omitted (`undefined`), not `null` — the backend's
 * Zod schema uses `.optional()`, which only accepts a missing key, not an
 * explicit `null`. `null` fails validation there. Whoever builds this
 * payload (AidRequestForm) must use `?? undefined`, never `?? null`.
 */
export interface CreateAidRequestInput {
  resourceType: AidResourceType;
  quantity?: number;
  unit?: string;
  urgency?: number;
  resourceLabel?: string;
  description?: string;
  requesterName: string;
  address: string;
  zoneId?: string;
  latitude?: number;
  longitude?: number;
  placeName?: string;
}

export interface CommitAidRequestInput {
  providerName: string;
  etaMinutes?: number;
}

export const RESOURCE_TYPE_LABELS: Record<AidResourceType, string> = {
  FOOD: 'Alimento',
  WATER: 'Agua',
  SHELTER: 'Refugio',
  MEDICAL: 'Médico',
  CLOTHING: 'Ropa',
  HYGIENE: 'Higiene',
  VOLUNTEERS: 'Voluntarios',
  TOOLS: 'Herramientas',
  OTHER: 'Otro',
};

export const RESOURCE_TYPE_ICONS: Record<AidResourceType, string> = {
  FOOD: 'restaurant',
  WATER: 'water_drop',
  SHELTER: 'cottage',
  MEDICAL: 'medical_services',
  CLOTHING: 'checkroom',
  HYGIENE: 'sanitizer',
  // Reuses the same icon as the app's other "help/volunteering" surfaces
  // (e.g. the collection-point tab in RegisterPlaceModal).
  VOLUNTEERS: 'volunteer_activism',
  TOOLS: 'construction',
  OTHER: 'category',
};

/**
 * Color per resource type — purely a visual grouping aid (not a status
 * signal), built from the app's real theme tokens (see src/index.css
 * `@theme`) so it reads as part of the same design system instead of the
 * flat black pill the board used to have.
 */
export const RESOURCE_TYPE_COLORS: Record<AidResourceType, { bg: string; text: string }> = {
  FOOD: { bg: '#d6f0e5', text: '#00685d' },
  WATER: { bg: '#c6e8f8', text: '#436370' },
  SHELTER: { bg: '#fbe6c2', text: '#735802' },
  MEDICAL: { bg: '#c6e8f8', text: '#436370' },
  CLOTHING: { bg: '#d6f0e5', text: '#00685d' },
  HYGIENE: { bg: '#fbe6c2', text: '#735802' },
  VOLUNTEERS: { bg: '#d6f0e5', text: '#00685d' },
  TOOLS: { bg: '#e1e3e4', text: '#3d4947' },
  OTHER: { bg: '#e1e3e4', text: '#3d4947' },
};

export const STATUS_LABELS: Record<AidStatus, string> = {
  OPEN: 'Abierta',
  COMMITTED: 'Comprometida',
  EN_ROUTE: 'En ruta',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};

/** Color pairs (bg + text) for status badges — same theme tokens as the rest of the app. */
export const STATUS_STYLES: Record<AidStatus, { bg: string; text: string }> = {
  OPEN: { bg: '#ffdad6', text: '#ba1a1a' },
  COMMITTED: { bg: '#c6e8f8', text: '#436370' },
  EN_ROUTE: { bg: '#e7c268', text: '#735802' },
  DELIVERED: { bg: '#8cf5e4', text: '#00685d' },
  CANCELLED: { bg: '#e1e3e4', text: '#6d7a77' },
};

/**
 * The compact badge shown next to a card's title collapses COMMITTED and
 * EN_ROUTE into one "En proceso" bucket — the distinction between them
 * still matters (see the expanded detail section), just not at a glance.
 */
export function statusBadge(status: AidStatus): { label: string; bg: string; text: string } {
  if (status === 'COMMITTED' || status === 'EN_ROUTE') {
    return { label: 'En proceso', ...STATUS_STYLES.COMMITTED };
  }
  return { label: STATUS_LABELS[status], ...STATUS_STYLES[status] };
}

/**
 * Urgency keeps its own color scale, deliberately separate from
 * RESOURCE_TYPE_COLORS/STATUS_STYLES — this is the one signal that must
 * stay unambiguous ("how urgent is this, really?") even as the rest of the
 * card gets friendlier. `accent` is the solid tone for the card's left
 * edge; `bg`/`text` are the softer pair for the pill badge.
 */
export interface UrgencyInfo {
  label: string;
  bg: string;
  text: string;
  accent: string;
}

export function urgencyInfo(urgency: number): UrgencyInfo {
  if (urgency >= 4) return { label: 'Crítica', bg: '#ffdad6', text: '#ba1a1a', accent: '#ba1a1a' };
  if (urgency === 3) return { label: 'Alta', bg: '#fbe6c2', text: '#735802', accent: '#e7a325' };
  return { label: 'Media', bg: '#d6f0e5', text: '#00685d', accent: '#00685d' };
}
