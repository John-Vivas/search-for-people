export type { PetStatus } from '../../../types/enums';
export type { PetRow } from '../../../types/database';

/** Domain alias — maps to pets table */
export type Pet = import('../../../types/database').PetRow;

export type PetPublic = Pick<
  Pet,
  | 'id'
  | 'zone_id'
  | 'name'
  | 'species'
  | 'breed'
  | 'color'
  | 'sex'
  | 'approximate_age'
  | 'status'
  | 'last_seen_at'
  | 'is_verified'
  | 'updated_at'
  | 'current_location_id'
  | 'last_seen_location_id'
>;

export type PetInsert = Omit<Pet, 'id' | 'created_at' | 'updated_at' | 'is_verified'> & {
  id?: string;
  is_verified?: boolean;
};

export type PetUpdate = Partial<Omit<Pet, 'id' | 'created_at'>>;

export interface PetSearchFilters {
  query?: string;
  status?: Pet['status'] | Pet['status'][];
  zoneId?: string;
  species?: string;
  limit?: number;
  offset?: number;
}
