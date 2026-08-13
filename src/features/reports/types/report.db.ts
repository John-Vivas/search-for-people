export type { ReportStatus, ReportType, ReporterType } from '@/src/types/enums';
export type { ReportRow, ReporterRow } from '@/src/types/database';

/** Domain alias — maps to reports table */
export type Report = import('@/src/types/database').ReportRow;

/** PRIVATE — maps to reporters table. Never expose in public components. */
export type Reporter = import('@/src/types/database').ReporterRow;

export type ReportPublic = Pick<
  Report,
  | 'id'
  | 'reporter_id'
  | 'report_type'
  | 'person_id'
  | 'pet_id'
  | 'description'
  | 'status'
  | 'reviewed_by'
  | 'reviewed_at'
  | 'submitted_at'
  | 'updated_at'
>;

export type ReportInsert = Omit<
  Report,
  'id' | 'created_at' | 'updated_at' | 'submitted_at' | 'status' | 'reviewed_by' | 'reviewed_at'
> & {
  id?: string;
  status?: Report['status'];
};

export type ReportUpdate = Partial<
  Pick<Report, 'status' | 'description' | 'reviewed_by' | 'reviewed_at'>
>;

export interface ReportSearchFilters {
  status?: Report['status'] | Report['status'][];
  reportType?: Report['report_type'];
  zoneId?: string;
  limit?: number;
  offset?: number;
}
