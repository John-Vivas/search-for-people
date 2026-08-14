import React, { useEffect, useState } from 'react';
import {
  AidRequest,
  AidRequestPhones,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ICONS,
  RESOURCE_TYPE_COLORS,
  statusBadge,
  urgencyInfo,
  shortRequestCode,
} from '@/src/features/aid/types/aid';
import { formatDistanceKm } from '@/src/features/aid/utils/distance';
import { StaticLocationMap } from '@/src/features/map/components/StaticLocationMap';
import { Portal } from '@/src/components/common/Portal';

interface AidRequestDetailPanelProps {
  /** null = closed */
  request: AidRequest | null;
  phones?: AidRequestPhones;
  sessionPhone: string | null;
  distanceKm?: number | null;
  busy?: boolean;
  onClose: () => void;
  onCommit: (request: AidRequest) => void;
  onMarkEnRoute: (request: AidRequest) => void;
  onDeliver: (request: AidRequest) => void;
  onCancel: (request: AidRequest) => void;
  onWithdraw: (request: AidRequest) => void;
  onRegenerateCode: (request: AidRequest) => void;
  onReopen: (request: AidRequest) => void;
}

function relativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `hace ${h} hora${h === 1 ? '' : 's'}`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d === 1 ? '' : 's'}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[11px] font-bold tracking-wide text-[#6d7a77] uppercase mb-2">{children}</h4>;
}

export const AidRequestDetailPanel: React.FC<AidRequestDetailPanelProps> = ({
  request,
  phones,
  sessionPhone,
  distanceKm,
  busy = false,
  onClose,
  onCommit,
  onMarkEnRoute,
  onDeliver,
  onCancel,
  onWithdraw,
  onRegenerateCode,
  onReopen,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!request) {
      setVisible(false);
      return;
    }
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [request, onClose]);

  if (!request) return null;

  const title = request.resource_label?.trim() || RESOURCE_TYPE_LABELS[request.resource_type];
  const quantityLabel = [request.quantity, request.unit].filter((v) => v != null && v !== '').join(' ');
  const badge = statusBadge(request.status);
  const urg = urgencyInfo(request.urgency);
  const resourceStyle = RESOURCE_TYPE_COLORS[request.resource_type];

  const isOpen = request.status === 'OPEN';
  const isCommitted = request.status === 'COMMITTED';
  const isEnRoute = request.status === 'EN_ROUTE';
  const isDelivered = request.status === 'DELIVERED';
  const isCancelled = request.status === 'CANCELLED';
  const isRequester = Boolean(sessionPhone && phones && phones.requesterPhone === sessionPhone);
  const isProvider = Boolean(sessionPhone && phones && phones.providerPhone === sessionPhone);

  // Only ever one contact shown: the "other side" relative to the viewer.
  // Third parties (not the requester or provider) only ever see the
  // requester's number — the provider's stays between the pair who matched.
  let contact: { role: string; name: string; phone: string } | null = null;
  if (isProvider && phones?.requesterPhone) {
    contact = { role: 'Solicitante', name: request.requester_name, phone: phones.requesterPhone };
  } else if (isRequester && phones?.providerPhone) {
    contact = { role: 'Ayudante', name: request.provider_name || 'Ayudante', phone: phones.providerPhone };
  } else if (!isRequester && !isProvider && phones?.requesterPhone) {
    contact = { role: 'Solicitante', name: request.requester_name, phone: phones.requesterPhone };
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true" aria-label={`Detalles de ${title}`}>
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute top-0 right-0 h-full w-full sm:max-w-md bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start gap-3 px-5 py-4 border-b border-[#e1e3e4] sticky top-0 bg-white z-10">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: resourceStyle.bg }}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ color: resourceStyle.text }}>
              {RESOURCE_TYPE_ICONS[request.resource_type]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-extrabold text-[#191c1d]">{title}</h3>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{ backgroundColor: badge.bg, color: badge.text }}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-[#9ba5a2] mt-0.5">
              Solicitud {shortRequestCode(request.id)} · {relativeTime(request.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -m-1 rounded-full text-[#436370] hover:bg-[#e7e8e9] cursor-pointer shrink-0"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ backgroundColor: urg.bg }}>
              <p className="text-[10px] font-bold tracking-wide uppercase" style={{ color: urg.text }}>
                Urgencia
              </p>
              <p className="text-base font-extrabold mt-0.5" style={{ color: urg.text }}>
                {urg.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: urg.text }}>
                Prioridad {request.urgency}/5
              </p>
            </div>
            <div className="rounded-xl p-3 bg-[#f3f4f5]">
              <p className="text-[10px] font-bold tracking-wide uppercase text-[#6d7a77]">Cantidad</p>
              <p className="text-base font-extrabold text-[#191c1d] mt-0.5">
                {quantityLabel || 'Sin especificar'}
              </p>
            </div>
          </div>

          <div>
            <SectionLabel>Entrega</SectionLabel>
            {request.latitude != null && request.longitude != null ? (
              <StaticLocationMap latitude={request.latitude} longitude={request.longitude} />
            ) : (
              <div className="w-full h-24 rounded-xl bg-[#f3f4f5] flex items-center justify-center text-xs text-[#9ba5a2]">
                Sin ubicación exacta en el mapa
              </div>
            )}
            <p className="text-sm font-semibold text-[#191c1d] mt-2">{request.address}</p>
            <p className="text-xs text-[#6d7a77] mt-0.5">
              {[
                distanceKm != null ? `${formatDistanceKm(distanceKm)} de tu ubicación` : null,
                request.place_name,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          {contact && (
            <div>
              <SectionLabel>Contacto</SectionLabel>
              <div className="flex items-center gap-3 rounded-xl border border-[#e1e3e4] p-3">
                <div className="w-10 h-10 rounded-full bg-[#e6f4f1] text-[#00685d] font-bold text-sm flex items-center justify-center shrink-0">
                  {initials(contact.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#191c1d] truncate">{contact.name}</p>
                  <p className="text-xs text-[#6d7a77]">{contact.phone}</p>
                </div>
                <a
                  href={`tel:${contact.phone}`}
                  className="shrink-0 inline-flex items-center gap-1 h-9 px-3.5 rounded-full border border-[#00685d] text-[#00685d] text-xs font-bold hover:bg-[#00685d] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">call</span>
                  Llamar
                </a>
              </div>
            </div>
          )}

          {request.description && (
            <div>
              <SectionLabel>Notas</SectionLabel>
              <p className="text-sm text-[#3d4947]">{request.description}</p>
            </div>
          )}

          {isRequester && (isOpen || isCommitted || isEnRoute) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRegenerateCode(request)}
              className="text-xs font-bold text-[#00685d] hover:underline cursor-pointer disabled:opacity-50"
            >
              ¿Perdiste el código de entrega? Generar uno nuevo
            </button>
          )}

          {isDelivered && (
            <div className="flex items-center gap-2 text-[#00685d] text-sm font-bold bg-[#e6f4f1] rounded-xl p-3">
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
              Entregada{request.delivered_at ? ` · ${relativeTime(request.delivered_at)}` : ''}
            </div>
          )}

          {isCancelled && (
            <div className="flex items-center gap-2 text-[#6d7a77] text-sm font-bold bg-[#f3f4f5] rounded-xl p-3">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
              Solicitud cancelada
            </div>
          )}
        </div>

        {/* Sticky footer actions */}
        {(isOpen || isCommitted || isEnRoute || ((isCancelled || isDelivered) && isRequester)) && (
          <div className="sticky bottom-0 bg-white border-t border-[#e1e3e4] px-5 py-4 space-y-2">
            {isOpen && !isRequester && (
              <button
                disabled={busy}
                onClick={() => onCommit(request)}
                className="w-full h-12 rounded-full bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Ayudar con esta solicitud
              </button>
            )}

            {isProvider && (isCommitted || isEnRoute) && (
              <>
                <button
                  disabled={busy}
                  onClick={() => onDeliver(request)}
                  className="w-full h-12 rounded-full bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Marcar como entregada
                </button>
                <div className="flex gap-2">
                  {isCommitted && (
                    <button
                      disabled={busy}
                      onClick={() => onMarkEnRoute(request)}
                      className="flex-1 h-11 rounded-full border border-[#8e5a00] text-[#8e5a00] font-bold text-sm hover:bg-[#8e5a00] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Marcar en ruta
                    </button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => onWithdraw(request)}
                    className="flex-1 h-11 rounded-full border border-[#ba1a1a] text-[#ba1a1a] font-bold text-sm hover:bg-[#ba1a1a] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Liberar solicitud
                  </button>
                </div>
                <p className="text-[11px] text-[#9ba5a2] text-center">
                  Confirma solo cuando el recurso ya esté en manos de la persona.
                </p>
              </>
            )}

            {isRequester && (isOpen || isCommitted || isEnRoute) && (
              <button
                disabled={busy}
                onClick={() => onCancel(request)}
                className="w-full h-11 rounded-full border border-[#ba1a1a] text-[#ba1a1a] font-bold text-sm hover:bg-[#ba1a1a] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar solicitud
              </button>
            )}

            {(isCancelled || isDelivered) && isRequester && (
              <button
                disabled={busy}
                onClick={() => onReopen(request)}
                className="w-full h-12 rounded-full bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Reabrir solicitud
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    </Portal>
  );
};
