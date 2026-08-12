import { AdminReportItem } from '../../reports/types/report';
import { INITIAL_ADMIN_REPORTS } from '../../../data/mock/mockAdminReports';
import { isMockMode } from '../../../lib/dataSource';
import { ok, fail, mockApiCall, ServiceResponse } from '../../../services/api/errors';
import { reportsService } from '../../reports/services/reports.service';
import { reportService } from '../../reports/services/reportService';

export const adminService = {
  async getAdminReports(): Promise<ServiceResponse<AdminReportItem[]>> {
    if (isMockMode()) {
      const saved = localStorage.getItem('estamos_buscando_admin_reports');
      const reports: AdminReportItem[] = saved ? JSON.parse(saved) : INITIAL_ADMIN_REPORTS;
      return mockApiCall(reports);
    }

    return reportsService.getAdminReportQueue();
  },

  async updateReportStatus(
    id: string,
    newStatus: AdminReportItem['status'],
    notes?: string
  ): Promise<ServiceResponse<AdminReportItem | null>> {
    if (isMockMode()) {
      const response = await this.getAdminReports();
      const reports = response.data || [];
      let updatedReport: AdminReportItem | null = null;

      const updatedReports = reports.map((r) => {
        if (r.id === id) {
          updatedReport = {
            ...r,
            status: newStatus,
            ...(notes !== undefined ? { notes } : {}),
          };
          return updatedReport;
        }
        return r;
      });

      localStorage.setItem('estamos_buscando_admin_reports', JSON.stringify(updatedReports));
      return mockApiCall(updatedReport);
    }

    const dbStatus = reportService.adminStatusToReportStatus(newStatus);
    const res = await reportsService.moderateReport(id, dbStatus, notes);
    if (res.error) return fail(res.error, 'No se pudo actualizar el reporte');

    const queueRes = await reportsService.getAdminReportQueue();
    const updated = queueRes.data?.find((r) => r.id === id) ?? null;
    return ok(updated);
  },

  saveAdminReportsToStorage(reports: AdminReportItem[]): void {
    if (!isMockMode()) return;
    localStorage.setItem('estamos_buscando_admin_reports', JSON.stringify(reports));
  },
};
