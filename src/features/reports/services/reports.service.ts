import { getSupabaseClient } from '@/src/lib/supabase';
import { isMockMode } from '@/src/lib/dataSource';
import { DEFAULT_PAGE_SIZE } from '@/src/lib/constants';
import { ok, fail, mockApiCall, ServiceResponse } from '@/src/services/api/errors';
import type {
  ReportPublic,
  ReportInsert,
  ReportSearchFilters,
  ReportStatus,
} from '@/src/features/reports/types/report.db';
import {
  mapAdminQueueRows,
  type AdminReportQueueRow,
} from '@/src/features/reports/mappers/report.mapper';
import type { AdminReportItem } from '@/src/features/reports/types/report';

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

  /** Admin queue with private reporter fields — via SECURITY DEFINER RPC */
  async getAdminReportQueue(limit = 100): Promise<ServiceResponse<AdminReportItem[]>> {
    if (isMockMode()) {
      return mockApiCall([]);
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('get_admin_report_queue', {
        p_limit: limit,
      });

      if (error) return fail(error, 'No se pudieron cargar los reportes administrativos');
      return ok(mapAdminQueueRows((data ?? []) as AdminReportQueueRow[]));
    } catch (error) {
      return fail(error, 'No se pudieron cargar los reportes administrativos');
    }
  },

  async moderateReport(
    reportId: string,
    status: ReportStatus,
    notes?: string
  ): Promise<ServiceResponse<ReportPublic>> {
    if (isMockMode()) {
      return fail(new Error('Mock mode'), 'Moderación disponible con Supabase');
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('moderate_report', {
        p_report_id: reportId,
        p_status: status,
        p_notes: notes ?? null,
      });

      if (error) return fail(error, 'No se pudo actualizar el reporte');
      return ok(data as ReportPublic);
    } catch (error) {
      return fail(error, 'No se pudo actualizar el reporte');
    }
  },

  async approveReport(id: string, notes?: string): Promise<ServiceResponse<ReportPublic>> {
    return this.moderateReport(id, 'APPROVED', notes);
  },

  async rejectReport(id: string, notes?: string): Promise<ServiceResponse<ReportPublic>> {
    return this.moderateReport(id, 'REJECTED', notes);
  },
};
