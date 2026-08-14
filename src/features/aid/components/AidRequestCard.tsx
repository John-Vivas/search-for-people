import React from 'react';
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
  /** Opens the full detail panel (map, contact, notes, and the rest of the status actions). */
  onOpenDetails: (request: AidRequest) => void;
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
  phones,
  sessionPhone,
  distanceKm,
  busy = false,
  onCommit,
  onOpenDetails,
}) => {
  const title = request.resource_label?.trim() || RESOURCE_TYPE_LABELS[request.resource_type];
  const quantityLabel = [request.quantity, request.unit].filter((v) => v != null && v !== '').join(' ');
  const badge = statusBadge(request.status);
  const urg = urgencyInfo(request.urgency);
  const resourceStyle = RESOURCE_TYPE_COLORS[request.resource_type];

  const isOpen = request.status === 'OPEN';
  const isRequester = Boolean(sessionPhone && phones && phones.requesterPhone === sessionPhone);

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

        <div className="mt-3 pt-3 border-t border-[#e1e3e4] flex items-center justify-between gap-2">
          <span className="text-sm text-[#3d4947] font-medium truncate">{quantityLabel}</span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onOpenDetails(request)}
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
          </div>
        </div>
      </div>
    </article>
  );
};

/** Memoized: a card re-renders only when its request/handlers/phones/distance change. */
export const AidRequestCard = React.memo(AidRequestCardBase);
