import { useState, useEffect, useCallback } from 'react';
import { AdminReportItem } from '../../reports/types/report';
import { adminService } from '../services/adminService';
import { isMockMode } from '../../../lib/dataSource';

export function useAdminReports() {
  const [adminReports, setAdminReports] = useState<AdminReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await adminService.getAdminReports();
    if (res.error) {
      setError(res.error.message);
      setAdminReports([]);
    } else {
      setAdminReports(res.data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (isMockMode() && adminReports.length > 0) {
      adminService.saveAdminReportsToStorage(adminReports);
    }
  }, [adminReports]);

  const addAdminReport = useCallback((report: AdminReportItem) => {
    setAdminReports((prev) => [report, ...prev]);
  }, []);

  const approveReport = useCallback(
    async (id: string, notes?: string) => {
      const res = await adminService.updateReportStatus(id, 'approved', notes);
      if (res.error) {
        setError(res.error.message);
        return false;
      }
      await fetchReports();
      return true;
    },
    [fetchReports]
  );

  const rejectReport = useCallback(
    async (id: string, notes?: string) => {
      const res = await adminService.updateReportStatus(id, 'rejected', notes);
      if (res.error) {
        setError(res.error.message);
        return false;
      }
      await fetchReports();
      return true;
    },
    [fetchReports]
  );

  const updateReportStatus = useCallback(
    async (id: string, status: AdminReportItem['status'], notes?: string) => {
      const res = await adminService.updateReportStatus(id, status, notes);
      if (res.error) {
        setError(res.error.message);
        return false;
      }
      await fetchReports();
      return true;
    },
    [fetchReports]
  );

  return {
    adminReports,
    loading,
    error,
    refetch: fetchReports,
    addAdminReport,
    approveReport,
    rejectReport,
    updateReportStatus,
  };
}
