import React, { useState } from 'react';
import {
  AidRequest,
  AidRequestPhones,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ICONS,
  RESOURCE_TYPE_COLORS,
  statusBadge,
  urgencyInfo,
} from '@/src/features/aid/types/aid';
import { formatDistanceKm } from '@/src/features/aid/utils/distance';

interface AidRequestCardProps {
  request: AidRequest;
  /** Present only when the viewer is logged in — see aidRequestsService.listPhones. */
  phones?: AidRequestPhones;
  /** The logged-in viewer's own phone, to tell requester/provider apart from a third party. */
  sessionPhone: string | null;
  /** Distance from the viewer's (best-effort, opt-in) location, in km. */
  distanceKm?: number | null;
  busy?: boolean;
  onCommit: (request: AidRequest) => void;
  onMarkEnRoute: (request: AidRequest) => void;
  onDeliver: (request: AidRequest) => void;
  onCancel: (request: AidRequest) => void;
  onWithdraw: (request: AidRequest) => void;
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

function Badge({
  bg,
  text,
  children,
  className = '',
}: {
  bg: string;
  text: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${className}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {children}
    </span>
  );
}

function CallLink({ label, phone }: { label: string; phone: string }) {
  return (
    <a
      href={`tel:${phone}`}
      className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full bg-[#e6f4f1] text-[#00685d] hover:bg-[#d6f0e5] transition-colors"
    >
      <span className="material-symbols-outlined text-[15px]">call</span>
      {label}: {phone}
    </a>
  );
}

const AidRequestCardBase: React.FC<AidRequestCardProps> = ({
  request,
  phones,
  sessionPhone,
  distanceKm,
  busy = false,
  onCommit,
  onMarkEnRoute,
  onDeliver,
  onCancel,
  onWithdraw,
}) => {
  const [expanded, setExpanded] = useState(false);

  const title = request.resource_label?.trim() || RESOURCE_TYPE_LABELS[request.resource_type];
  const quantityLabel = [request.quantity, request.unit].filter((v) => v != null && v !== '').join(' ');
  const badge = statusBadge(request.status);
  const urg = urgencyInfo(request.urgency);
  const resourceStyle = RESOURCE_TYPE_COLORS[request.resource_type];

  const isOpen = request.status === 'OPEN';
  const isCommitted = request.status === 'COMMITTED';
  const isEnRoute = request.status === 'EN_ROUTE';
  const isDelivered = request.status === 'DELIVERED';
  const isRequester = Boolean(sessionPhone && phones && phones.requesterPhone === sessionPhone);
  const isProvider = Boolean(sessionPhone && phones && phones.providerPhone === sessionPhone);
  const hasOwnerActions =
    (isProvider && (isCommitted || isEnRoute)) || (isRequester && (isOpen || isCommitted || isEnRoute));

  const metaParts = [
    request.requester_name,
    relativeTime(request.created_at),
    distanceKm != null ? formatDistanceKm(distanceKm) : null,
  ].filter(Boolean);

  return (
    <article className="flex bg-white rounded-2xl border border-[#e1e3e4] shadow-xs overflow-hidden">
      <div className="w-1.5 shrink-0" style={{ backgroundColor: urg.accent }} aria-hidden="true" />

      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: resourceStyle.bg }}
          >
            <span className="material-symbols-outlined text-[24px]" style={{ color: resourceStyle.text }}>
              {RESOURCE_TYPE_ICONS[request.resource_type]}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-[#191c1d]">{title}</h3>
              <Badge bg={badge.bg} text={badge.text}>{badge.label}</Badge>
            </div>
            <p className="text-sm text-[#6d7a77] mt-0.5">
              {request.place_name ? `${request.place_name}, ${request.address}` : request.address}
            </p>
            <p className="text-xs text-[#9ba5a2] mt-1">{metaParts.join(' · ')}</p>
          </div>

          <div className="text-right shrink-0">
            <Badge bg={urg.bg} text={urg.text}>{urg.label.toUpperCase()}</Badge>
            <p className="text-[11px] text-[#9ba5a2] mt-1 font-semibold whitespace-nowrap">
              Prioridad {request.urgency}/5
            </p>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-[#e1e3e4] space-y-3">
            {request.description && <p className="text-sm text-[#3d4947]">{request.description}</p>}

            {(isCommitted || isEnRoute) && request.provider_name && (
              <p className="text-sm font-semibold text-[#00685d]">
                <span className="material-symbols-outlined text-[15px] align-middle mr-1">
                  {isEnRoute ? 'local_shipping' : 'handshake'}
                </span>
                {isEnRoute ? 'En ruta' : 'Comprometido'}: {request.provider_name}
                {request.eta_minutes != null ? ` · ETA ${request.eta_minutes} min` : ''}
              </p>
            )}

            {isDelivered && (
              <p className="flex items-center gap-1.5 text-[#00685d] text-sm font-bold">
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
                Entregada{request.delivered_at ? ` · ${relativeTime(request.delivered_at)}` : ''}
              </p>
            )}

            {phones && (phones.requesterPhone || phones.providerPhone) && (
              <div className="flex flex-wrap gap-2">
                {phones.requesterPhone && <CallLink label="Solicitante" phone={phones.requesterPhone} />}
                {phones.providerPhone && <CallLink label="Ayudante" phone={phones.providerPhone} />}
              </div>
            )}

            {hasOwnerActions && (
              <div className="flex flex-col sm:flex-row gap-2">
                {isProvider && isCommitted && (
                  <button
                    disabled={busy}
                    onClick={() => onMarkEnRoute(request)}
                    className="flex-1 h-11 rounded-full bg-[#8e5a00] text-white font-bold text-sm hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                  >
                    Marcar en ruta
                  </button>
                )}
                {isProvider && (isCommitted || isEnRoute) && (
                  <button
                    disabled={busy}
                    onClick={() => onDeliver(request)}
                    className="flex-1 h-11 rounded-full border border-[#00685d] text-[#00685d] font-bold text-sm hover:bg-[#00685d] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Confirmar entrega
                  </button>
                )}
                {isProvider && (isCommitted || isEnRoute) && (
                  <button
                    disabled={busy}
                    onClick={() => onWithdraw(request)}
                    className="h-11 px-4 rounded-full border border-[#bcc9c6] text-[#3d4947] font-bold text-sm hover:bg-[#e7e8e9] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Retirar compromiso
                  </button>
                )}
                {isRequester && (isOpen || isCommitted || isEnRoute) && (
                  <button
                    disabled={busy}
                    onClick={() => onCancel(request)}
                    className="h-11 px-4 rounded-full border border-[#ba1a1a] text-[#ba1a1a] font-bold text-sm hover:bg-[#ba1a1a] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancelar solicitud
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[#e1e3e4] flex items-center justify-between gap-2">
          <span className="text-sm text-[#3d4947] font-medium truncate">{quantityLabel}</span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="h-9 px-3.5 rounded-full border border-[#bcc9c6] text-[#3d4947] text-xs font-bold hover:bg-[#e7e8e9] transition-colors cursor-pointer"
            >
              Detalles
            </button>
            {isOpen && !isRequester && (
              <button
                disabled={busy}
                onClick={() => onCommit(request)}
                className="h-9 px-4 rounded-full bg-[#00685d] text-white text-xs font-bold hover:bg-[#008376] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Ayudar
              </button>
            )}
            {(isCommitted || isEnRoute) && (
              <button
                onClick={() => setExpanded(true)}
                className="h-9 px-4 rounded-full bg-[#c6e8f8] text-[#436370] text-xs font-bold hover:brightness-95 transition cursor-pointer"
              >
                Ver avance
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

/** Memoized: a card re-renders only when its request/handlers/phones/distance change. */
export const AidRequestCard = React.memo(AidRequestCardBase);
