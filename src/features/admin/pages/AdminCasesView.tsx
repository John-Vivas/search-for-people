import React, { useMemo, useState } from 'react';
import { PersonItem } from '@/src/features/persons/types/person';

interface AdminCasesViewProps {
  items: PersonItem[];
  onMarkStatus: (item: PersonItem, status: string) => Promise<void>;
  onBack: () => void;
}

/** Un caso "abierto" (pendiente de resolver): desaparecido, NN o mascota perdida. */
function isOpenCase(item: PersonItem): boolean {
  if (item.type === 'desaparecido' || item.type === 'nn') return true;
  if (item.type === 'mascota' && item.petStatus !== 'FOUND') return true;
  return false;
}

export const AdminCasesView: React.FC<AdminCasesViewProps> = ({ items, onMarkStatus, onBack }) => {
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const openCases = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(isOpenCase)
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.location.toLowerCase().includes(q));
  }, [items, query]);

  const mark = async (item: PersonItem, status: string, label: string) => {
    if (busyId) return;
    if (!window.confirm(`¿Marcar a "${item.name}" como ${label}?`)) return;
    setBusyId(item.id);
    try {
      await onMarkStatus(item, status);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-bold text-[#00685d] hover:underline cursor-pointer mb-4"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        Volver al panel
      </button>

      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-[#191c1d] mb-1">Gestión de casos</h1>
        <p className="text-sm text-[#3d4947]">
          Marca un caso como <b>encontrado</b> o <b>reunido</b> cuando la persona o mascota aparezca.
        </p>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre o lugar…"
        className="w-full h-11 px-3 mb-4 rounded-xl border-2 border-[#e1e3e4] focus:border-[#00685d] focus:outline-none text-sm"
      />

      {openCases.length === 0 ? (
        <p className="text-sm text-[#6d7a77] text-center py-12">No hay casos abiertos.</p>
      ) : (
        <ul className="space-y-3">
          {openCases.map((item) => {
            const isPet = item.type === 'mascota';
            const busy = busyId === item.id;
            return (
              <li
                key={item.id}
                className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs p-3 flex items-center gap-3"
              >
                <img
                  src={item.photo}
                  alt={item.name}
                  className="w-14 h-14 rounded-lg object-cover bg-[#e7e8e9] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#191c1d] truncate">{item.name}</p>
                  <p className="text-xs text-[#6d7a77] truncate">
                    {item.code} · {item.location}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0 justify-end">
                  <button
                    disabled={busy}
                    onClick={() => mark(item, 'FOUND', isPet ? 'encontrada' : 'encontrado')}
                    className="h-9 px-3 rounded-lg bg-[#00685d] text-white text-xs font-bold hover:bg-[#008376] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {busy ? '…' : isPet ? 'Encontrada' : 'Encontrado'}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => mark(item, 'REUNITED', isPet ? 'reunida' : 'reunido')}
                    className="h-9 px-3 rounded-lg border border-[#00685d] text-[#00685d] text-xs font-bold hover:bg-[#f4fffb] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPet ? 'Reunida' : 'Reunido'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
