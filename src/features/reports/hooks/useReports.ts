import { useState, useCallback } from 'react';
import { ReportForm, AdminReportItem, SightingReport } from '../types/report';
import { PersonItem } from '../../persons/types/person';
import { reportService } from '../services/reportService';

export function useReports() {
  const [submitting, setSubmitting] = useState(false);

  const submitReport = useCallback(
    async (form: ReportForm): Promise<{ newItem: PersonItem; newAdminItem: AdminReportItem }> => {
      setSubmitting(true);
      try {
        const res = await reportService.createReport(form);
        if (res.error || !res.data) {
          throw res.error || new Error('Failed to create report');
        }
        return {
          newItem: res.data.newItem,
          newAdminItem: res.data.newAdminReport
        };
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const submitSighting = useCallback(async (sighting: SightingReport) => {
    setSubmitting(true);
    try {
      await reportService.submitSighting(sighting);
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitting,
    submitReport,
    submitSighting
  };
}
