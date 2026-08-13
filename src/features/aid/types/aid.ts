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

/** Row shape returned by Supabase for public.aid_requests */
export interface AidRequest {
  id: string;
  resource_type: AidResourceType;
  resource_label: string | null;
  quantity: number | null;
  unit: string | null;
  urgency: number;
  status: AidStatus;
  description: string | null;
  requester_org: string | null;
  requester_contact: string | null;
  provider_org: string | null;
  eta_minutes: number | null;
  zone_id: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  place_name: string | null;
  created_at: string;
  committed_at: string | null;
  delivered_at: string | null;
  updated_at: string;
}

export interface CreateAidRequestInput {
  resourceType: AidResourceType;
  quantity?: number | null;
  unit?: string | null;
  urgency?: number;
  resourceLabel?: string | null;
  description?: string | null;
  requesterOrg?: string | null;
  requesterContact?: string | null;
  zoneId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  placeName?: string | null;
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
  VOLUNTEERS: 'diversity_3',
  TOOLS: 'construction',
  OTHER: 'category',
};

export const STATUS_LABELS: Record<AidStatus, string> = {
  OPEN: 'Abierta',
  COMMITTED: 'Comprometida',
  EN_ROUTE: 'En ruta',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};

/** Tailwind-ish color pairs (bg + text) for status badges */
export const STATUS_STYLES: Record<AidStatus, { bg: string; text: string }> = {
  OPEN: { bg: '#fddede', text: '#ba1a1a' },
  COMMITTED: { bg: '#1c1c1c', text: '#ffffff' },
  EN_ROUTE: { bg: '#fbe6c2', text: '#8e5a00' },
  DELIVERED: { bg: '#d6f0e5', text: '#00685d' },
  CANCELLED: { bg: '#e7e8e9', text: '#6d7a77' },
};

export function urgencyColor(urgency: number): { bg: string; text: string } {
  if (urgency >= 4) return { bg: '#ba1a1a', text: '#ffffff' };
  if (urgency === 3) return { bg: '#8e5a00', text: '#ffffff' };
  return { bg: '#8e711f', text: '#ffffff' };
}
