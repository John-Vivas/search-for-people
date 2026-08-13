import React, { useCallback, useMemo, useState } from 'react';
import { useAidRequests } from '@/src/features/aid/hooks/useAidRequests';
import { aidRequestsService } from '@/src/features/aid/services/aidRequests.service';
import { AidRequestCard } from '@/src/features/aid/components/AidRequestCard';
import { AidRequestForm } from '@/src/features/aid/components/AidRequestForm';
import type { AidRequest } from '@/src/features/aid/types/aid';
import { ListLoadingState, ListErrorState } from '@/src/components/common/AsyncListState';

type StatusFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'DELIVERED';

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

export const AidBoardView: React.FC = () => {
  const { requests, loading, error, live, refetch } = useAidRequests();
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [committing, setCommitting] = useState<AidRequest | null>(null);
  const [providerOrg, setProviderOrg] = useState('');
  const [eta, setEta] = useState('60');
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(
    () => requests.filter((r) => matchesFilter(r, filter)),
    [requests, filter]
  );

  const openCount = requests.filter((r) => r.status === 'OPEN').length;

  const doCommit = async () => {
    if (!committing) return;
    setBusyId(committing.id);
    await aidRequestsService.commit(committing.id, providerOrg.trim() || 'Anónimo', eta ? Number(eta) : null);
    setBusyId(null);
    setCommitting(null);
    setProviderOrg('');
    setEta('60');
    refetch();
  };

  const advance = useCallback(
    async (req: AidRequest, status: 'EN_ROUTE' | 'DELIVERED') => {
      setBusyId(req.id);
      await aidRequestsService.advance(req.id, status);
      setBusyId(null);
      refetch();
    },
    [refetch]
  );

  // Stable handlers so memoized AidRequestCard doesn't re-render every tick.
  const handleCommit = useCallback((r: AidRequest) => setCommitting(r), []);
  const handleEnRoute = useCallback((r: AidRequest) => advance(r, 'EN_ROUTE'), [advance]);
  const handleDelivered = useCallback((r: AidRequest) => advance(r, 'DELIVERED'), [advance]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-12 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191c1d]">Coordinación de Ayuda</h1>
          <p className="text-sm text-[#6d7a77]">
            Solicitudes de recursos en tiempo real para las zonas de emergencia.
          </p>
        </div>
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

      <div className="flex items-center justify-between gap-2 mt-4 mb-4">
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filter === f.key ? 'bg-[#00685d] text-white' : 'bg-white border border-[#e1e3e4] text-[#3d4947]'
              }`}
            >
              {f.label}
              {f.key === 'OPEN' && openCount > 0 ? ` (${openCount})` : ''}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="shrink-0 flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#00685d] text-white text-sm font-bold hover:bg-[#008376] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline">Nueva</span>
        </button>
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
          {visible.map((req) => (
            <AidRequestCard
              key={req.id}
              request={req}
              busy={busyId === req.id}
              onCommit={handleCommit}
              onMarkEnRoute={handleEnRoute}
              onMarkDelivered={handleDelivered}
            />
          ))}
        </div>
      )}

      <AidRequestForm open={formOpen} onClose={() => setFormOpen(false)} onCreated={refetch} />

      {/* Commit modal */}
      {committing && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setCommitting(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[#191c1d] mb-1">Ayudar con esta solicitud</h3>
            <p className="text-sm text-[#6d7a77] mb-4">
              Confirmas que tu organización llevará este recurso.
            </p>
            <label className="block text-xs font-bold text-[#191c1d] mb-1">Tu organización</label>
            <input
              value={providerOrg}
              onChange={(e) => setProviderOrg(e.target.value)}
              placeholder="Ej. Banco de Alimentos"
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
                className="flex-1 h-11 rounded-full bg-[#1c1c1c] text-white font-bold text-sm hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                Confirmar ayuda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
