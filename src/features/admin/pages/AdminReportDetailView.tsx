import React, { useState } from 'react';
import { AdminReportItem } from '@/src/features/admin/types/admin';

interface AdminReportDetailViewProps {
  report: AdminReportItem;
  onBack: () => void;
  onUpdateStatus: (id: string, newStatus: 'pending' | 'approved' | 'rejected', notes: string) => void;
}

export const AdminReportDetailView: React.FC<AdminReportDetailViewProps> = ({
  report,
  onBack,
  onUpdateStatus,
}) => {
  const [status, setStatus] = useState(report.status);
  const [notes, setNotes] = useState(report.notes);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(report.reporterPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSave = () => {
    onUpdateStatus(report.id, status, notes);
    alert('¡Estado del reporte actualizado exitosamente!');
    onBack();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-12 animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-bold text-[#00685d] hover:underline mb-6 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        Volver a Visión General
      </button>

      {/* Warning privacy alert banner */}
      <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 p-4 rounded-2xl mb-6 flex items-start gap-3 text-[#93000a]">
        <span className="material-symbols-outlined text-2xl shrink-0 mt-0.5" data-weight="fill">
          security
        </span>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider">
            INFORMACIÓN PRIVADA DE REPORTANTE - Visibilidad Restringida a Administradores
          </h3>
          <p className="text-xs mt-1 text-[#ba1a1a]">
            Esta sección contiene datos sensibles recopilados exclusivamente para la verificación oficial de identidad del usuario antes de la publicación comunitaria.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Reporter Info */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#e1e3e4] shadow-xs h-fit">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#e1e3e4]">
            <span className="material-symbols-outlined text-[#00685d] text-2xl">
              badge
            </span>
            <h2 className="text-base font-bold text-[#191c1d]">Datos del Reportante</h2>
          </div>

          <div className="space-y-4 text-sm text-[#3d4947]">
            <div>
              <span className="text-xs font-bold text-[#6d7a77] uppercase block mb-0.5">
                Nombre Completo
              </span>
              <p className="font-bold text-[#191c1d]">{report.reporterName}</p>
              <span className="text-xs text-[#00685d] font-semibold">{report.reporterRole}</span>
            </div>

            <div>
              <span className="text-xs font-bold text-[#6d7a77] uppercase block mb-0.5">
                Teléfono
              </span>
              <div className="flex items-center justify-between bg-[#f8f9fa] p-2 rounded-xl border border-[#bcc9c6]">
                <span className="font-mono text-xs font-bold text-[#191c1d]">{report.reporterPhone}</span>
                <button
                  onClick={handleCopyPhone}
                  className="text-xs text-[#00685d] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  {copiedPhone ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-[#6d7a77] uppercase block mb-0.5">
                Correo Electrónico
              </span>
              <p className="font-mono text-xs text-[#191c1d]">{report.reporterEmail}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-[#6d7a77] uppercase block mb-0.5">
                Documento de Identidad
              </span>
              <p className="text-xs font-mono font-bold text-[#191c1d]">
                {report.reporterDocumentType}: {report.reporterDocumentId}
              </p>
            </div>

            <div className="pt-3 border-t border-[#e1e3e4]">
              <div className="bg-[#f4fffb] border border-[#00685d]/30 p-3 rounded-xl flex items-center gap-2 text-xs text-[#00685d] font-semibold">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Documento verificado por la plataforma
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Person & Verification Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Person Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#e1e3e4] shadow-xs">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-mono text-[#00685d] font-bold">
                  {report.code}
                </span>
                <h2 className="text-2xl font-extrabold text-[#191c1d]">
                  {report.personName}
                </h2>
                <p className="text-xs text-[#6d7a77]">{report.personLocation}</p>
              </div>

              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase ${
                  status === 'pending'
                    ? 'bg-[#ffdad6] text-[#93000a]'
                    : status === 'approved'
                    ? 'bg-[#f4fffb] text-[#00685d]'
                    : 'bg-[#e1e3e4] text-[#3d4947]'
                }`}
              >
                {status === 'pending'
                  ? 'Pendiente'
                  : status === 'approved'
                  ? 'Aprobado'
                  : 'Rechazado'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="w-full sm:w-36 h-40 rounded-xl overflow-hidden bg-[#e7e8e9] shrink-0 border border-[#bcc9c6]">
                <img
                  src={report.personPhoto}
                  alt={report.personName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2 text-sm text-[#3d4947]">
                <p>
                  <strong>Edad:</strong> {report.personAge}
                </p>
                <p>
                  <strong>Ubicación:</strong> {report.personLocation}
                </p>
                <p>
                  <strong>Fecha de reporte:</strong> {report.reportDate}
                </p>
                <div className="pt-2 border-t border-[#e1e3e4]">
                  <p className="text-xs font-bold text-[#6d7a77] uppercase mb-1">
                    Observaciones e Historia
                  </p>
                  <p className="text-xs leading-relaxed text-[#191c1d] bg-[#f8f9fa] p-3 rounded-xl border border-[#e1e3e4]">
                    {report.notes}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Moderation Panel */}
          <div className="bg-[#f8f9fa] p-6 rounded-2xl border border-[#bcc9c6] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#191c1d] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00685d]">gavel</span>
              Panel de Verificación y Moderación
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1">
                Estado de la Solicitud
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-white text-sm font-bold text-[#191c1d] focus:border-[#00685d] outline-none cursor-pointer"
              >
                <option value="pending">Pendiente de Revisión</option>
                <option value="approved">Aprobar - Publicar en Mapa y Listados</option>
                <option value="rejected">Rechazar - Incompleto o Duplicado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1">
                Notas Internas del Moderador
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade observaciones internas sobre la verificación telefónica..."
                className="w-full p-3 rounded-xl border border-[#bcc9c6] bg-white text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onBack}
                className="px-5 py-2.5 bg-white border border-[#bcc9c6] text-[#3d4947] font-bold text-xs rounded-full hover:bg-[#e7e8e9] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-[#00685d] text-white font-bold text-xs rounded-full hover:bg-[#008376] transition-colors shadow-xs cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
