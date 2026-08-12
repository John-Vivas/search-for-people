import { getSupabaseClient } from '../../../lib/supabase';
import { isMockMode } from '../../../lib/dataSource';
import { DEFAULT_PAGE_SIZE } from '../../../lib/constants';
import { ok, fail, mockApiCall, ServiceResponse } from '../../../services/api/errors';
import type {
  ReportPublic,
  ReportInsert,
  ReportSearchFilters,
  ReportStatus,
  ReportUpdate,
} from '../types/report.db';

const REPORT_COLUMNS =
  'id, reporter_id, report_type, person_id, pet_id, description, status, reviewed_by, reviewed_at, submitted_at, updated_at' as const;

export const reportsService = {
  async getReports(
    filters: ReportSearchFilters = {}
  ): Promise<ServiceResponse<ReportPublic[]>> {
    const { status, reportType, limit = DEFAULT_PAGE_SIZE, offset = 0 } = filters;

    if (isMockMode()) {
      return mockApiCall([]);
    }

    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('reports')
        .select(REPORT_COLUMNS)
        .order('submitted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        query = query.in('status', statuses);
      }

      if (reportType) query = query.eq('report_type', reportType);

      const { data, error, count } = await query;
      if (error) return fail(error, 'No se pudieron cargar los reportes');
      return ok((data ?? []) as ReportPublic[], count ?? undefined);
    } catch (error) {
      return fail(error, 'No se pudieron cargar los reportes');
    }
  },

  async getReportById(id: string): Promise<ServiceResponse<ReportPublic | null>> {
    if (isMockMode()) {
      return mockApiCall(null);
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('reports')
        .select(REPORT_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error) return fail(error, 'No se pudo cargar el reporte');
      return ok(data as ReportPublic | null);
    } catch (error) {
      return fail(error, 'No se pudo cargar el reporte');
    }
  },

  async createReport(payload: ReportInsert): Promise<ServiceResponse<ReportPublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Creación de reportes disponible con Supabase');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('reports')
        .insert({ ...payload, status: payload.status ?? 'PENDING' })
        .select(REPORT_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo enviar el reporte');
      return ok(data as ReportPublic);
    } catch (error) {
      return fail(error, 'No se pudo enviar el reporte');
    }
  },

  async updateReportStatus(
    id: string,
    status: ReportStatus,
    reviewedBy?: string
  ): Promise<ServiceResponse<ReportPublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Moderación disponible con Supabase');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('reports')
        .update({
          status,
          reviewed_by: reviewedBy ?? null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(REPORT_COLUMNS)
        .single();

      if (error) return fail(error, 'No se pudo actualizar el estado del reporte');
      return ok(data as ReportPublic);
    } catch (error) {
      return fail(error, 'No se pudo actualizar el estado del reporte');
    }
  },

  async approveReport(id: string, reviewedBy?: string): Promise<ServiceResponse<ReportPublic>> {
    return this.updateReportStatus(id, 'APPROVED', reviewedBy);
  },

  async rejectReport(id: string, reviewedBy?: string): Promise<ServiceResponse<ReportPublic>> {
    return this.updateReportStatus(id, 'REJECTED', reviewedBy);
  },
};
