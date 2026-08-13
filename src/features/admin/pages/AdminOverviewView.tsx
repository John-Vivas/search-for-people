import React, { useState } from 'react';
import { AdminReportItem } from '@/src/features/admin/types/admin';

interface AdminOverviewViewProps {
  adminReports: AdminReportItem[];
  onSelectAdminReport: (report: AdminReportItem) => void;
  onApproveReport: (id: string) => void;
  onRejectReport: (id: string) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({
  adminReports,
  onSelectAdminReport,
  onApproveReport,
  onRejectReport
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filtered = adminReports.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const exportData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Código,Fecha,Reportante,Rol,Persona,Estado']
        .concat(
          adminReports.map(
            (r) => `${r.code},"${r.reportDate}","${r.reporterName}","${r.reporterRole}","${r.personName}",${r.status}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reportes_estamos_buscando_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#00685d] text-2xl">
              admin_panel_settings
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1d]">
              Visión General
            </h1>
          </div>
          <p className="text-xs md:text-sm text-[#3d4947]">
            Panel de control administrativo y revisión de reportes comunitarios.
          </p>
        </div>

        <button
          onClick={exportData}
          className="px-5 py-2.5 bg-white border border-[#bcc9c6] text-[#436370] rounded-xl text-xs font-bold hover:bg-[#f3f4f5] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Exportar datos (.CSV)
        </button>
      </div>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-[#6d7a77] uppercase tracking-wider mb-1">
              Total Reportes
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-[#191c1d]">1,248</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#f3f4f5] flex items-center justify-center text-[#00685d]">
            <span className="material-symbols-outlined text-2xl">analytics</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-[#ba1a1a] uppercase tracking-wider mb-1">
              Pendientes
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-[#ba1a1a]">
              {adminReports.filter((r) => r.status === 'pending').length || 42}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] flex items-center justify-center text-[#93000a]">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-[#00685d] uppercase tracking-wider mb-1">
              Encontrados
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-[#00685d]">892</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#f4fffb] flex items-center justify-center text-[#00685d]">
            <span className="material-symbols-outlined text-2xl" data-weight="fill">
              check_circle
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-[#436370] uppercase tracking-wider mb-1">
              Albergues
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-[#436370]">34</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#c6e8f8]/50 flex items-center justify-center text-[#436370]">
            <span className="material-symbols-outlined text-2xl">domain</span>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-[#436370] text-white shadow-xs'
              : 'bg-white border border-[#bcc9c6] text-[#3d4947] hover:bg-[#f3f4f5]'
          }`}
        >
          Todos ({adminReports.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filterStatus === 'pending'
              ? 'bg-[#ba1a1a] text-white shadow-xs'
              : 'bg-white border border-[#bcc9c6] text-[#3d4947] hover:bg-[#f3f4f5]'
          }`}
        >
          Pendientes ({adminReports.filter((r) => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filterStatus === 'approved'
              ? 'bg-[#00685d] text-white shadow-xs'
              : 'bg-white border border-[#bcc9c6] text-[#3d4947] hover:bg-[#f3f4f5]'
          }`}
        >
          Aprobados ({adminReports.filter((r) => r.status === 'approved').length})
        </button>
      </div>

      {/* Admin Reports List */}
      <div className="bg-white rounded-2xl border border-[#e1e3e4] overflow-hidden shadow-xs">
        <div className="p-4 bg-[#f8f9fa] border-b border-[#e1e3e4] flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#191c1d]">
            Cola de Reportes por Revisar
          </h2>
          <span className="text-xs text-[#6d7a77] font-mono">
            Mostrando {filtered.length} casos
          </span>
        </div>

        <div className="divide-y divide-[#e1e3e4]">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="p-4 hover:bg-[#f8f9fa] transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="flex gap-4 items-start">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#e7e8e9] shrink-0 border border-[#bcc9c6]">
                  <img
                    src={report.personPhoto}
                    alt={report.personName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold font-mono text-[#00685d]">
                      {report.code}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        report.status === 'pending'
                          ? 'bg-[#ffdad6] text-[#93000a]'
                          : report.status === 'approved'
                          ? 'bg-[#f4fffb] text-[#00685d]'
                          : 'bg-[#e1e3e4] text-[#3d4947]'
                      }`}
                    >
                      {report.status === 'pending'
                        ? 'Pendiente'
                        : report.status === 'approved'
                        ? 'Aprobado'
                        : 'Rechazado'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#191c1d]">
                    {report.personName} ({report.personAge})
                  </h3>
                  <p className="text-xs text-[#3d4947]">
                    Reportante: <strong>{report.reporterName}</strong> ({report.reporterRole}) • Tel: {report.reporterPhone}
                  </p>
                  <p className="text-[11px] text-[#6d7a77] mt-0.5">
                    Recibido: {report.reportDate}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {report.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onApproveReport(report.id)}
                      className="px-3 py-1.5 bg-[#00685d] text-white rounded-lg text-xs font-bold hover:bg-[#008376] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      Aprobar
                    </button>
                    <button
                      onClick={() => onRejectReport(report.id)}
                      className="px-3 py-1.5 bg-[#ffdad6] text-[#93000a] rounded-lg text-xs font-bold hover:bg-[#ba1a1a] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      Rechazar
                    </button>
                  </>
                )}

                <button
                  onClick={() => onSelectAdminReport(report)}
                  className="px-3 py-1.5 bg-[#f3f4f5] text-[#3d4947] border border-[#bcc9c6] rounded-lg text-xs font-bold hover:bg-[#e7e8e9] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  Ver Detalle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
