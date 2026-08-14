import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAidRequests } from '@/src/features/aid/hooks/useAidRequests';
import { useUserLocation } from '@/src/features/aid/hooks/useUserLocation';
import { aidRequestsService } from '@/src/features/aid/services/aidRequests.service';
import { AidRequestCard } from '@/src/features/aid/components/AidRequestCard';
import { AidRequestDetailPanel } from '@/src/features/aid/components/AidRequestDetailPanel';
import { AidRequestForm } from '@/src/features/aid/components/AidRequestForm';
import type { AidRequest, AidRequestPhones } from '@/src/features/aid/types/aid';
import { haversineKm } from '@/src/features/aid/utils/distance';
import { ListLoadingState, ListErrorState } from '@/src/components/common/AsyncListState';
import { Portal } from '@/src/components/common/Portal';
import { PhoneSessionProvider, usePhoneSession } from '@/src/features/phone-auth/hooks/usePhoneSession';
import { PhoneLoginModal } from '@/src/features/phone-auth/components/PhoneLoginModal';
import { OtpCodeInput } from '@/src/features/phone-auth/components/OtpCodeInput';
import { getPreferredName, setPreferredName } from '@/src/lib/preferredName';

type StatusFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'DELIVERED';
type SortBy = 'URGENCY' | 'RECENT';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'OPEN', label: 'Abiertas' },
  { key: 'IN_PROGRESS', label: 'En proceso' },
  { key: 'DELIVERED', label: 'Entregadas' },
];

function matchesFilter(req: AidRequest, filter: StatusFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'OPEN') return req.status === 'OPEN';
  if (filter === 'IN_PROGRESS') return req.status === 'COMMITTED' || req.status === 'EN_ROUTE';
  if (filter === 'DELIVERED') return req.status === 'DELIVERED';
  return true;
}

/** Short "how long ago" for the live-updating "Actualizado hace…" line. */
function formatAgoShort(sinceMs: number): string {
  const seconds = Math.max(0, Math.round(sinceMs / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `${hours} h`;
}

type PendingAction = { type: 'create' } | { type: 'commit'; request: AidRequest } | null;

const AidBoardViewInner: React.FC = () => {
  const { phone, isLoggedIn, loading: sessionLoading, logout } = usePhoneSession();
  const { requests, loading, error, live, lastUpdatedAt, refetch } = useAidRequests();
  const userLocation = useUserLocation();
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('URGENCY');
  const [formOpen, setFormOpen] = useState(false);
  const [committing, setCommitting] = useState<AidRequest | null>(null);
  const [delivering, setDelivering] = useState<AidRequest | null>(null);
  const [providerName, setProviderName] = useState('');
  const [eta, setEta] = useState('60');
  const [deliveryCodeInput, setDeliveryCodeInput] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);

  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [phones, setPhones] = useState<Record<string, AidRequestPhones>>({});

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const refetchPhones = useCallback(async () => {
    if (!isLoggedIn) {
      setPhones({});
      return;
    }
    const res = await aidRequestsService.listPhones();
    if (res.data) {
      setPhones(Object.fromEntries(res.data.map((p) => [p.id, p])));
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refetchPhones();
  }, [refetchPhones]);

  const counts = useMemo(
    () => ({
      ALL: requests.length,
      OPEN: requests.filter((r) => r.status === 'OPEN').length,
      IN_PROGRESS: requests.filter((r) => r.status === 'COMMITTED' || r.status === 'EN_ROUTE').length,
      DELIVERED: requests.filter((r) => r.status === 'DELIVERED').length,
    }),
    [requests]
  );

  const visible = useMemo(() => {
    const filtered = requests.filter((r) => matchesFilter(r, filter));
    if (sortBy === 'URGENCY') {
      return [...filtered].sort((a, b) => b.urgency - a.urgency || b.created_at.localeCompare(a.created_at));
    }
    return filtered; // requests already arrive sorted by created_at desc
  }, [requests, filter, sortBy]);

  const requireLogin = (action: PendingAction) => {
    setPendingAction(action);
    setLoginOpen(true);
  };

  const handleLoginSuccess = useCallback(() => {
    refetchPhones();
    if (pendingAction?.type === 'create') setFormOpen(true);
    else if (pendingAction?.type === 'commit') {
      setProviderName(getPreferredName());
      setCommitting(pendingAction.request);
    }
    setPendingAction(null);
  }, [pendingAction, refetchPhones]);

  const handleNew = () => {
    if (!isLoggedIn) {
      requireLogin({ type: 'create' });
      return;
    }
    setFormOpen(true);
  };

  const handleCommit = useCallback(
    (req: AidRequest) => {
      if (!isLoggedIn) {
        requireLogin({ type: 'commit', request: req });
        return;
      }
      setProviderName(getPreferredName());
      setCommitting(req);
    },
    [isLoggedIn]
  );

  const doCommit = async () => {
    if (!committing) return;
    setBusyId(committing.id);
    setActionError(null);
    const res = await aidRequestsService.commit(committing.id, {
      providerName: providerName.trim() || 'Anónimo',
      etaMinutes: eta ? Number(eta) : undefined,
    });
    setBusyId(null);
    if (res.error) {
      setActionError(res.error.message || 'No se pudo comprometer la solicitud');
      return;
    }
    setPreferredName(providerName);
    setCommitting(null);
    setProviderName('');
    setEta('60');
    refetch();
    refetchPhones();
  };

  const doDeliver = async () => {
    if (!delivering) return;
    setBusyId(delivering.id);
    setActionError(null);
    const res = await aidRequestsService.deliver(delivering.id, deliveryCodeInput.trim());
    setBusyId(null);
    if (res.error) {
      setActionError(res.error.message || 'Código incorrecto');
      return;
    }
    setDelivering(null);
    setDeliveryCodeInput('');
    refetch();
  };

  const handleMarkEnRoute = useCallback(
    async (req: AidRequest) => {
      setBusyId(req.id);
      await aidRequestsService.markEnRoute(req.id);
      setBusyId(null);
      refetch();
    },
    [refetch]
  );

  const handleRegenerateCode = useCallback(async (req: AidRequest) => {
    setBusyId(req.id);
    const res = await aidRequestsService.regenerateDeliveryCode(req.id);
    setBusyId(null);
    if (res.error) {
      setRegenerateError(res.error.message || 'No se pudo generar un nuevo código');
      return;
    }
    setNewCode(res.data?.deliveryCode ?? null);
  }, []);

  const handleCancel = useCallback(
    async (req: AidRequest) => {
      setBusyId(req.id);
      await aidRequestsService.cancel(req.id);
      setBusyId(null);
      refetch();
    },
    [refetch]
  );

  const handleWithdraw = useCallback(
    async (req: AidRequest) => {
      setBusyId(req.id);
      await aidRequestsService.withdraw(req.id);
      setBusyId(null);
      refetch();
      refetchPhones();
    },
    [refetch, refetchPhones]
  );

  const handleReopen = useCallback(
    async (req: AidRequest) => {
      setBusyId(req.id);
      const res = await aidRequestsService.reopen(req.id);
      setBusyId(null);
      if (res.error) {
        setRegenerateError(res.error.message || 'No se pudo reabrir la solicitud');
        return;
      }
      refetch();
      refetchPhones();
      if (res.data?.deliveryCode) setNewCode(res.data.deliveryCode);
    },
    [refetch, refetchPhones]
  );

  const handleDeliverIntent = useCallback((req: AidRequest) => {
    setActionError(null);
    setDeliveryCodeInput('');
    setDelivering(req);
  }, []);

  const handleCreated = useCallback(() => {
    refetch();
    refetchPhones();
  }, [refetch, refetchPhones]);

  const handleOpenDetails = useCallback((req: AidRequest) => setDetailRequestId(req.id), []);

  // Looked up fresh from `requests` (not stored as a snapshot) so the open
  // panel stays in sync if the request's status changes while it's open —
  // e.g. someone else commits to it via realtime.
  const detailRequest = detailRequestId ? requests.find((r) => r.id === detailRequestId) ?? null : null;
  const detailDistanceKm =
    detailRequest && userLocation && detailRequest.latitude != null && detailRequest.longitude != null
      ? haversineKm(userLocation.lat, userLocation.lng, detailRequest.latitude, detailRequest.longitude)
      : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-12 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#191c1d]">Coordinación de Ayuda</h1>
            <span
              className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                live ? 'bg-[#d6f0e5] text-[#00685d]' : 'bg-[#e7e8e9] text-[#6d7a77]'
              }`}
              title={live ? 'Actualizaciones en vivo activas' : 'Sin conexión en vivo'}
            >
              <span className={`w-2 h-2 rounded-full ${live ? 'bg-[#00685d] animate-pulse' : 'bg-[#9ba5a2]'}`} />
              {live ? 'En vivo' : 'Sin conexión'}
            </span>
          </div>
          <p className="text-sm text-[#6d7a77] mt-1">
            Solicitudes de recursos en tiempo real para las zonas de emergencia.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!sessionLoading &&
            (isLoggedIn ? (
              <div className="h-10 px-3.5 rounded-full border border-[#e1e3e4] bg-white flex items-center gap-2 text-xs font-bold text-[#3d4947]">
                <span className="material-symbols-outlined text-[16px] text-[#00685d]">verified_user</span>
                {phone}
                <button
                  onClick={() => logout().then(refetchPhones)}
                  className="text-[#00685d] hover:underline cursor-pointer"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={() => requireLogin(null)}
                className="h-10 px-4 rounded-full border border-[#bcc9c6] bg-white text-sm font-bold text-[#191c1d] hover:bg-[#f3f4f5] transition-colors cursor-pointer"
              >
                Iniciar sesión
              </button>
            ))}
          <button
            onClick={handleNew}
            className="shrink-0 flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#00685d] text-white text-sm font-bold hover:bg-[#008376] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nueva solicitud
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  active ? 'bg-[#1c1c1c] text-white' : 'text-[#3d4947] hover:bg-[#e7e8e9]'
                }`}
              >
                {f.label}
                <span
                  className={`text-[11px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center ${
                    active ? 'bg-white/20 text-white' : 'bg-[#e1e3e4] text-[#6d7a77]'
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-[#6d7a77] font-medium shrink-0">
          <span className="hidden sm:inline">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-xs font-bold text-[#191c1d] bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="URGENCY">Urgencia</option>
            <option value="RECENT">Recientes</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 mb-3 text-xs text-[#9ba5a2]">
        <span>
          {visible.length} solicitud{visible.length === 1 ? '' : 'es'} · ordenadas por{' '}
          {sortBy === 'URGENCY' ? 'urgencia' : 'recientes'}
        </span>
        {lastUpdatedAt != null && <span>Actualizado hace {formatAgoShort(now - lastUpdatedAt)}</span>}
      </div>

      {loading ? (
        <ListLoadingState message="Cargando solicitudes…" />
      ) : error ? (
        <ListErrorState message={error} onRetry={refetch} />
      ) : visible.length === 0 ? (
        <div className="text-center py-16 text-[#6d7a77]">
          <span className="material-symbols-outlined text-[40px] text-[#9ba5a2]">volunteer_activism</span>
          <p className="mt-2 text-sm font-medium">No hay solicitudes en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((req) => {
            const distanceKm =
              userLocation && req.latitude != null && req.longitude != null
                ? haversineKm(userLocation.lat, userLocation.lng, req.latitude, req.longitude)
                : null;
            return (
              <AidRequestCard
                key={req.id}
                request={req}
                phones={phones[req.id]}
                sessionPhone={phone}
                distanceKm={distanceKm}
                busy={busyId === req.id}
                onCommit={handleCommit}
                onOpenDetails={handleOpenDetails}
              />
            );
          })}
        </div>
      )}

      <AidRequestForm open={formOpen} onClose={() => setFormOpen(false)} onCreated={handleCreated} />

      <AidRequestDetailPanel
        request={detailRequest}
        phones={detailRequest ? phones[detailRequest.id] : undefined}
        sessionPhone={phone}
        distanceKm={detailDistanceKm}
        busy={detailRequest != null && busyId === detailRequest.id}
        onClose={() => setDetailRequestId(null)}
        onCommit={handleCommit}
        onMarkEnRoute={handleMarkEnRoute}
        onDeliver={handleDeliverIntent}
        onCancel={handleCancel}
        onWithdraw={handleWithdraw}
        onRegenerateCode={handleRegenerateCode}
        onReopen={handleReopen}
      />

      <PhoneLoginModal
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handleLoginSuccess}
      />

      {/* Commit modal */}
      {committing && (
        <Portal>
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setCommitting(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[#191c1d] mb-1">Ayudar con esta solicitud</h3>
            <p className="text-sm text-[#6d7a77] mb-4">
              Confirmas que llevarás este recurso. El solicitante verá tu nombre y tu número.
            </p>
            <label className="block text-xs font-bold text-[#191c1d] mb-1">Tu nombre</label>
            <input
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="Ej. Luis Gómez"
              className="w-full h-11 px-3 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm mb-3 focus:border-[#00685d] outline-none"
            />
            <label className="block text-xs font-bold text-[#191c1d] mb-1">Tiempo estimado de entrega (min)</label>
            <input
              type="number"
              min="0"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm mb-4 focus:border-[#00685d] outline-none"
            />
            {actionError && <p className="text-sm text-[#ba1a1a] font-medium mb-3">{actionError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setCommitting(null)}
                className="flex-1 h-11 rounded-full border border-[#bcc9c6] text-[#3d4947] font-bold text-sm hover:bg-[#e7e8e9] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={doCommit}
                disabled={busyId === committing.id}
                className="flex-1 h-11 rounded-full bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Confirmar ayuda
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Deliver modal — same shell/step design as the phone login code entry */}
      {delivering && (
        <Portal>
        <div
          className="fixed inset-0 z-[1300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar entrega"
          onClick={() => setDelivering(null)}
        >
          <div
            className="bg-white w-full max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-[#191c1d]">Confirmar entrega</h3>
              <button
                type="button"
                onClick={() => setDelivering(null)}
                className="p-2 -m-2 rounded-full text-[#436370] hover:bg-[#e7e8e9] cursor-pointer"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-sm text-[#6d7a77] mb-4">
              Pídele al solicitante el código que recibió al publicar la solicitud.
            </p>

            <OtpCodeInput
              value={deliveryCodeInput}
              onChange={setDeliveryCodeInput}
              autoFocus
              disabled={busyId === delivering.id}
            />

            {actionError && <p className="text-sm text-[#ba1a1a] font-medium mt-3">{actionError}</p>}

            <button
              onClick={doDeliver}
              disabled={busyId === delivering.id || deliveryCodeInput.length < 6}
              className="w-full h-12 mt-4 rounded-full bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {busyId === delivering.id ? 'Confirmando…' : 'Confirmar entrega'}
            </button>
          </div>
        </div>
        </Portal>
      )}

      {/* New delivery code reveal — shown once, right after regenerating */}
      {newCode && (
        <Portal>
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setNewCode(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="material-symbols-outlined text-[36px] text-[#00685d]">task_alt</span>
            <h3 className="text-base font-bold text-[#191c1d] mt-2">Nuevo código generado</h3>
            <p className="text-sm text-[#6d7a77] mt-1">
              El código anterior ya no funciona. Guarda este y compártelo con quien te ayude para
              confirmar la entrega.
            </p>
            <p className="text-3xl font-extrabold tracking-[0.3em] text-[#00685d] mt-4 mb-1">{newCode}</p>
            <button
              onClick={() => setNewCode(null)}
              className="w-full h-12 mt-4 rounded-full bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
        </Portal>
      )}

      {/* Regenerate-code error */}
      {regenerateError && (
        <Portal>
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setRegenerateError(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="material-symbols-outlined text-[36px] text-[#ba1a1a]">error</span>
            <p className="text-sm text-[#3d4947] mt-2">{regenerateError}</p>
            <button
              onClick={() => setRegenerateError(null)}
              className="w-full h-11 mt-4 rounded-full bg-[#1c1c1c] text-white font-bold text-sm hover:bg-black transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
};

export const AidBoardView: React.FC = () => (
  <PhoneSessionProvider>
    <AidBoardViewInner />
  </PhoneSessionProvider>
);
