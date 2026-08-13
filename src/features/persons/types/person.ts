export type ItemType = 'desaparecido' | 'encontrado' | 'nn' | 'mascota';

export interface Location {
  address: string;
  city: string;
  department?: string;
  coordinates: [number, number]; // [lat, lng]
}

export interface PersonItem {
  id: string;
  code: string; // e.g. #COL-2024-089
  type: ItemType;
  name: string;
  age: string;
  gender?: string;
  photo: string;
  location: string;
  city: string;
  coordinates: [number, number]; // [lat, lng]
  /** True when coordinates come from a real location/zone (not the default fallback) */
  hasKnownLocation?: boolean;
  /** For pets only: their lifecycle status, so found pets can be listed too. */
  petStatus?: 'LOST' | 'FOUND' | 'REUNITED';
  updatedAt: string;
  lastSeenDate: string;
  verified: boolean;
  description?: string;
  height?: string;
  physique?: string;
  clothing?: string;
  additionalDetails?: string;
  hospitalOrRefuge?: string;
  tattoo?: string;
  skinColor?: string;
  hairColor?: string;
  distinctiveFeatures?: string;
  reporterInfo?: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
    documentType: string;
    documentId: string;
  };
}
