import React from 'react';
import { MapFilter, EmergencyZone } from '../types/map.types';

interface MapFiltersProps {
  filters: MapFilter;
  zones: EmergencyZone[];
  onChange: (partial: Partial<MapFilter>) => void;
  compact?: boolean;
}

export const MapFilters: React.FC<MapFiltersProps> = ({
  filters,
  zones,
  onChange,
  compact = false,
}) => {
  const selectClass =
    'w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#e1e3e4] bg-white text-sm text-[#191c1d] font-medium focus:outline-none focus:ring-2 focus:ring-[#008376]/30 cursor-pointer';

  const labelClass = 'text-[11px] font-bold uppercase tracking-wide text-[#6d7a77] mb-1 block';

  return (
    <div
      className={`bg-white border border-[#e1e3e4] rounded-2xl p-4 space-y-4 ${
        compact ? '' : 'shadow-sm'
      }`}
      role="search"
      aria-label="Filtros del mapa"
    >
      <h2 className="text-sm font-bold text-[#191c1d] flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[18px] text-[#00685d]">filter_list</span>
        Filtros
      </h2>

      <div>
        <label htmlFor="map-filter-zone" className={labelClass}>
          Zona
        </label>
        <select
          id="map-filter-zone"
          value={filters.zoneId}
          onChange={(e) => onChange({ zoneId: e.target.value })}
          className={selectClass}
        >
          <option value="ALL">Todas</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="map-filter-type" className={labelClass}>
          Tipo
        </label>
        <select
          id="map-filter-type"
          value={filters.type}
          onChange={(e) =>
            onChange({
              type: e.target.value as MapFilter['type'],
              status: e.target.value === 'PET' || e.target.value === 'FACILITY' ? 'ALL' : filters.status,
            })
          }
          className={selectClass}
        >
          <option value="ALL">Todos</option>
          <option value="PERSON">Personas</option>
          <option value="PET">Mascotas</option>
          <option value="FACILITY">Hospitales / Centros</option>
        </select>
      </div>

      <div>
        <label htmlFor="map-filter-status" className={labelClass}>
          Estado
        </label>
        <select
          id="map-filter-status"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as MapFilter['status'] })}
          className={selectClass}
          disabled={filters.type === 'PET' || filters.type === 'FACILITY'}
        >
          <option value="ALL">Todos</option>
          <option value="MISSING">Desaparecidos</option>
          <option value="FOUND">Encontrados</option>
          <option value="UNIDENTIFIED">NN</option>
        </select>
        {(filters.type === 'PET' || filters.type === 'FACILITY') && (
          <p className="text-[10px] text-[#6d7a77] mt-1">Estado aplica solo a personas</p>
        )}
      </div>
    </div>
  );
};
