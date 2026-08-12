import { AdminReportItem } from '../../reports/types/report';
import { INITIAL_ADMIN_REPORTS } from '../../../data/mock/mockAdminReports';
import { mockApiCall, SupabaseResponse } from '../../../services/api/supabase';

export const adminService = {
  /**
   * Fetch admin reports.
   * Prepared for Supabase query: `supabase.from('admin_reports').select('*')`
   */
  async getAdminReports(): Promise<SupabaseResponse<AdminReportItem[]>> {
    const saved = localStorage.getItem('estamos_buscando_admin_reports');
    const reports: AdminReportItem[] = saved ? JSON.parse(saved) : INITIAL_ADMIN_REPORTS;
    return mockApiCall(reports);
  },

  /**
   * Update admin report status (approve/reject) and notes.
   * Prepared for Supabase update: `supabase.from('admin_reports').update({ status, notes }).eq('id', id)`
   */
  async updateReportStatus(
    id: string,
    newStatus: 'pending' | 'approved' | 'rejected',
    notes?: string
  ): Promise<SupabaseResponse<AdminReportItem | null>> {
    const response = await this.getAdminReports();
    const reports = response.data || [];
    let updatedReport: AdminReportItem | null = null;

    const updatedReports = reports.map((r) => {
      if (r.id === id) {
        updatedReport = { ...r, status: newStatus, ...(notes !== undefined ? { notes } : {}) };
        return updatedReport;
      }
      return r;
    });

    localStorage.setItem('estamos_buscando_admin_reports', JSON.stringify(updatedReports));
    return mockApiCall(updatedReport);
  },

  /**
   * Save admin reports to local storage sync
   */
  saveAdminReportsToStorage(reports: AdminReportItem[]): void {
    localStorage.setItem('estamos_buscando_admin_reports', JSON.stringify(reports));
  }
};
