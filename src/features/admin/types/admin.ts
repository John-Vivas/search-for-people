import { AdminReportItem } from '../../reports/types/report';

export type AdminReportStatus = 'pending' | 'approved' | 'rejected';

export interface AdminStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
}

export type { AdminReportItem };
