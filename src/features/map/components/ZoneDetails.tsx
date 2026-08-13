import React from 'react';
import { ZoneStats } from '@/src/features/map/types/map.types';

interface ZoneDetailsProps {
  stats: ZoneStats;
  onViewRecords?: (zoneId: string) => void;
  onClose?: () => void;
}

export const ZoneDetails: React.FC<ZoneDetailsProps> = ({
  stats,
  onViewRecords,
  onClose,
}) => (
  <div className="bg-white rounded-2xl border border-[#e1e3e4] shadow-lg overflow-hidden animate-slide-up">
    <div className="p-4 border-b border-[#e1e3e4] relative">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#f3f4f5] cursor-pointer"
          aria-label="Cerrar panel de zona"
        >
          <span className="material-symbols-outlined text-[20px] text-[#6d7a77]">close</span>
        </button>
      )}
      <h3 className="text-lg font-bold text-[#191c1d]">{stats.zoneName}</h3>
      <p className="text-sm text-[#6d7a77]">
        {stats.zoneType === 'DEPARTMENT' ? 'Departamento' : stats.department || 'Zona'}
      </p>
    </div>

    <div className="p-4 grid grid-cols-2 gap-3">
      <StatItem label="Desaparecidos" value={stats.missing} color="#ba1a1a" />
      <StatItem label="Encontrados" value={stats.found} color="#00685d" />
      <StatItem label="NN" value={stats.unidentified} color="#8e711f" />
      <StatItem label="Mascotas" value={stats.pets} color="#735802" />
      <StatItem
        label="Centros"
        value={stats.facilities}
        color="#436370"
        className="col-span-2"
      />
      <div className="col-span-2 pt-2 border-t border-[#e1e3e4]">
        <p className="text-xs text-[#6d7a77]">
          Total de reportes: <strong className="text-[#191c1d]">{stats.total}</strong>
        </p>
      </div>
    </div>

    {stats.childStats && stats.childStats.length > 0 && (
      <div className="px-4 pb-2 border-t border-[#e1e3e4]">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#6d7a77] py-3">
          Por municipio / ciudad
        </p>
        <ul className="space-y-2 pb-2">
          {stats.childStats.map((child) => (
            <li
              key={child.zoneId}
              className="flex items-center justify-between text-sm py-1.5 border-b border-[#f3f4f5] last:border-0"
            >
              <span className="font-medium text-[#191c1d]">{child.zoneName}</span>
              <span className="text-[#6d7a77] text-xs">
                {child.missing} desap. · {child.found} enc. · {child.unidentified} NN ·{' '}
                {child.pets} masc.
              </span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {onViewRecords && stats.zoneType !== 'DEPARTMENT' && (
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => onViewRecords(stats.zoneId)}
          className="w-full min-h-[44px] bg-[#00685d] hover:bg-[#008376] text-white text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          Ver registros de esta zona
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    )}
  </div>
);

function StatItem({
  label,
  value,
  color,
  className = '',
}: {
  label: string;
  value: number;
  color: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div>
        <p className="text-xl font-bold text-[#191c1d] leading-none">{value}</p>
        <p className="text-[11px] text-[#6d7a77]">{label}</p>
      </div>
    </div>
  );
}
