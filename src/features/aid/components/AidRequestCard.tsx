import React from 'react';
import {
  AidRequest,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ICONS,
  STATUS_LABELS,
  STATUS_STYLES,
  urgencyColor,
} from '@/src/features/aid/types/aid';

interface AidRequestCardProps {
  request: AidRequest;
  busy?: boolean;
  onCommit: (request: AidRequest) => void;
  onMarkEnRoute: (request: AidRequest) => void;
  onMarkDelivered: (request: AidRequest) => void;
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

function Badge({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return (
    <span
      className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: bg, color: text }}
    >
      {children}
    </span>
  );
}

const AidRequestCardBase: React.FC<AidRequestCardProps> = ({
  request,
  busy = false,
  onCommit,
  onMarkEnRoute,
  onMarkDelivered,
}) => {
  const resourceName = request.resource_label?.trim() || RESOURCE_TYPE_LABELS[request.resource_type];
  const quantityLabel = [request.quantity, request.unit].filter((v) => v != null && v !== '').join(' ');
  const title = quantityLabel ? `${quantityLabel} · ${resourceName}` : resourceName;
  const statusStyle = STATUS_STYLES[request.status];
  const urg = urgencyColor(request.urgency);

  const isOpen = request.status === 'OPEN';
  const isCommitted = request.status === 'COMMITTED';
  const isEnRoute = request.status === 'EN_ROUTE';
  const isActionable = isOpen || isCommitted || isEnRoute;

  return (
    <article className="bg-white rounded-2xl border border-[#e1e3e4] p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge bg="#1c1c1c" text="#ffffff">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] align-middle">
                {RESOURCE_TYPE_ICONS[request.resource_type]}
              </span>
              {RESOURCE_TYPE_LABELS[request.resource_type]}
            </span>
          </Badge>
          <Badge bg={urg.bg} text={urg.text}>Urgencia {request.urgency}</Badge>
          <Badge bg={statusStyle.bg} text={statusStyle.text}>{STATUS_LABELS[request.status]}</Badge>
        </div>
        <span className="text-xs text-[#6d7a77] whitespace-nowrap shrink-0">
          {relativeTime(request.created_at)}
        </span>
      </div>

      <h3 className="text-lg font-extrabold text-[#191c1d] mt-2">{title}</h3>

      {(request.place_name || request.address || request.requester_org) && (
        <p className="text-sm text-[#6d7a77] mt-0.5">
          {[request.place_name || request.address, request.requester_org]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      {request.provider_org && (
        <p className="text-sm font-semibold text-[#00685d] mt-0.5">
          {request.provider_org}
          {request.eta_minutes != null ? ` · ETA ${request.eta_minutes} min` : ''}
        </p>
      )}

      {request.description && (
        <p className="text-sm text-[#3d4947] mt-2">{request.description}</p>
      )}

      {/* Committed pill */}
      {(isCommitted || isEnRoute) && (
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 bg-[#1c1c1c] text-white text-xs font-bold px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-[15px]">
              {isEnRoute ? 'local_shipping' : 'handshake'}
            </span>
            {isEnRoute ? 'En ruta' : 'Comprometido'}
            {request.eta_minutes != null ? ` · ETA ${request.eta_minutes} min` : ''}
          </span>
        </div>
      )}

      {/* Actions */}
      {isActionable && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          {isOpen && (
            <button
              disabled={busy}
              onClick={() => onCommit(request)}
              className="flex-1 h-11 rounded-full bg-[#1c1c1c] text-white font-bold text-sm hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
            >
              Comprometerse
            </button>
          )}
          {isCommitted && (
            <button
              disabled={busy}
              onClick={() => onMarkEnRoute(request)}
              className="flex-1 h-11 rounded-full bg-[#8e5a00] text-white font-bold text-sm hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
            >
              Marcar en ruta
            </button>
          )}
          <button
            disabled={busy}
            onClick={() => onMarkDelivered(request)}
            className="flex-1 h-11 rounded-full border border-[#00685d] text-[#00685d] font-bold text-sm hover:bg-[#00685d] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            Marcar atendida
          </button>
        </div>
      )}

      {request.status === 'DELIVERED' && (
        <div className="mt-3 flex items-center gap-1.5 text-[#00685d] text-sm font-bold">
          <span className="material-symbols-outlined text-[18px]">task_alt</span>
          Entregada{request.delivered_at ? ` · ${relativeTime(request.delivered_at)}` : ''}
        </div>
      )}
    </article>
  );
};

/** Memoized: a card re-renders only when its request/handlers change. */
export const AidRequestCard = React.memo(AidRequestCardBase);
