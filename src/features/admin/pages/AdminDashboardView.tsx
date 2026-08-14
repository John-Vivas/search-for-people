import React, { useMemo } from 'react';
import { PersonItem } from '@/src/features/persons/types/person';

interface AdminDashboardViewProps {
  items: PersonItem[];
  reportsPending: number | null; // null si la cola de reportes no está disponible
  onOpenCases: () => void;
}

/**
 * Panel de moderación (dashboard). Muestra un resumen de casos y el acceso a
 * "Gestión de casos". Usa datos públicos (personas/mascotas), así que funciona
 * aunque la cola de reportes falle (esa tabla es privada y necesita login).
 */
export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  items,
  reportsPending,
  onOpenCases,
}) => {
  const stats = useMemo(() => {
    const desaparecidos = items.filter((i) => i.type === 'desaparecido').length;
    const nn = items.filter((i) => i.type === 'nn').length;
    const mascotasPerdidas = items.filter(
      (i) => i.type === 'mascota' && i.petStatus !== 'FOUND'
    ).length;
    const encontrados = items.filter(
      (i) => i.type === 'encontrado' || i.petStatus === 'FOUND'
    ).length;
    return {
      desaparecidos,
      nn,
      mascotasPerdidas,
      encontrados,
      abiertos: desaparecidos + nn + mascotasPerdidas,
    };
  }, [items]);

  const cards = [
    { label: 'Desaparecidos', value: stats.desaparecidos, color: '#ba1a1a', icon: 'person_search' },
    { label: 'Sin identificar (NN)', value: stats.nn, color: '#8e711f', icon: 'help_center' },
    { label: 'Mascotas perdidas', value: stats.mascotasPerdidas, color: '#735802', icon: 'pets' },
    { label: 'Encontrados', value: stats.encontrados, color: '#00685d', icon: 'check_circle' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-12 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#191c1d] mb-1">Panel de moderación</h1>
        <p className="text-sm text-[#3d4947]">Resumen de la comunidad y gestión de casos.</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-[#e1e3e4] shadow-xs p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[22px]" style={{ color: c.color }}>
                {c.icon}
              </span>
            </div>
            <p className="text-2xl md:text-3xl font-black" style={{ color: c.color }}>
              {c.value}
            </p>
            <p className="text-xs text-[#3d4947]">{c.label}</p>
          </div>
        ))}
      </div>

      {/* CTA: Gestión de casos */}
      <button
        onClick={onOpenCases}
        className="w-full flex items-center gap-4 p-5 rounded-2xl bg-[#00685d] text-white shadow-sm hover:bg-[#008376] transition-all group cursor-pointer text-left mb-6"
      >
        <span className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[26px]">fact_check</span>
        </span>
        <span className="flex-1">
          <span className="block text-base font-bold">Gestión de casos</span>
          <span className="block text-sm text-white/85">
            Marca personas o mascotas como encontradas/reunidas.{' '}
            {stats.abiertos > 0 && <b>{stats.abiertos} casos abiertos.</b>}
          </span>
        </span>
        <span className="material-symbols-outlined shrink-0">arrow_forward</span>
      </button>

      {/* Cola de reportes (necesita login) */}
      <div className="rounded-2xl border border-[#e1e3e4] bg-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-[#6d7a77]">inbox</span>
          <h2 className="text-sm font-bold text-[#191c1d]">Reportes por moderar</h2>
        </div>
        {reportsPending != null ? (
          <p className="text-sm text-[#3d4947]">{reportsPending} reporte(s) pendiente(s) de revisión.</p>
        ) : (
          <p className="text-xs text-[#6d7a77]">
            La cola de reportes requiere inicio de sesión de moderador (próximamente). Los datos de
            los reportes son privados y no se cargan sin autenticación.
          </p>
        )}
      </div>
    </div>
  );
};
