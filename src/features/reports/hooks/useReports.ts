import { useState, useCallback } from 'react';
import { ReportForm, SightingReport } from '../types/report';
import {
  reportService,
  type ReportSubmissionResult,
} from '../services/reportService';

export function useReports() {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitReport = useCallback(
    async (form: ReportForm): Promise<ReportSubmissionResult> => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const res = await reportService.createReport(form);
        if (res.error || !res.data) {
          const message = res.error?.message ?? 'No se pudo enviar el reporte';
          setSubmitError(message);
          throw new Error(message);
        }
        return res.data;
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
    submitError,
    submitReport,
    submitSighting,
  };
}
