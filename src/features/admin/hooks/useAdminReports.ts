import { useState, useEffect, useCallback } from 'react';
import { AdminReportItem } from '../../reports/types/report';
import { adminService } from '../services/adminService';

export function useAdminReports(initialData?: AdminReportItem[]) {
  const [adminReports, setAdminReports] = useState<AdminReportItem[]>(initialData || []);
  const [loading, setLoading] = useState<boolean>(!initialData);

  const fetchAdminReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminReports();
      if (res.data) {
        setAdminReports(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchAdminReports();
    }
  }, [fetchAdminReports, initialData]);

  const addAdminReport = useCallback((newReport: AdminReportItem) => {
    setAdminReports((prev) => {
      const updated = [newReport, ...prev];
      adminService.saveAdminReportsToStorage(updated);
      return updated;
    });
  }, []);

  const approveReport = useCallback((id: string) => {
    setAdminReports((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, status: 'approved' as const } : r));
      adminService.saveAdminReportsToStorage(updated);
      return updated;
    });
  }, []);

  const rejectReport = useCallback((id: string) => {
    setAdminReports((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r));
      adminService.saveAdminReportsToStorage(updated);
      return updated;
    });
  }, []);

  const updateReportStatus = useCallback((id: string, newStatus: 'pending' | 'approved' | 'rejected', notes: string) => {
    setAdminReports((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, status: newStatus, notes } : r));
      adminService.saveAdminReportsToStorage(updated);
      return updated;
    });
  }, []);

  return {
    adminReports,
    setAdminReports,
    loading,
    addAdminReport,
    approveReport,
    rejectReport,
    updateReportStatus
  };
}
