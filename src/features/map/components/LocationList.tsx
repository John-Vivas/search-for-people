import React from 'react';
import { MapLocation } from '../types/map.types';
import { formatRelativeTime } from '../../../lib/utils';
import { getMarkerStyle } from './MarkerIcon';

interface LocationListProps {
  locations: MapLocation[];
  selectedId?: string | null;
  onSelect: (location: MapLocation) => void;
  onViewDetail?: (location: MapLocation) => void;
}

function statusText(location: MapLocation): string {
  if (location.type === 'PERSON') {
    switch (location.status) {
      case 'MISSING':
        return 'Desaparecido';
      case 'FOUND':
        return 'Encontrado';
      case 'UNIDENTIFIED':
        return 'NN';
    }
  }
  if (location.type === 'PET') return 'Mascota';
  return 'Centro de atención';
}

export const LocationList: React.FC<LocationListProps> = ({
  locations,
  selectedId,
  onSelect,
  onViewDetail,
}) => {
  if (locations.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <span className="material-symbols-outlined text-[40px] text-[#bcc9c6] mb-2">search_off</span>
        <p className="text-sm text-[#6d7a77]">No hay registros con estos filtros</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[#e1e3e4]" role="list">
      {locations.map((loc) => {
        const style =
          loc.type === 'FACILITY'
            ? getMarkerStyle('FACILITY', loc.facilityType)
            : loc.type === 'PET'
            ? getMarkerStyle('PET')
            : getMarkerStyle('PERSON', loc.status);
        const isSelected = selectedId === loc.id;

        return (
          <li key={loc.id}>
            <div
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                isSelected ? 'bg-[#f4fffb]' : 'hover:bg-[#f3f4f5]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(loc)}
                className="flex items-center gap-3 flex-grow min-w-0 text-left min-h-[44px] cursor-pointer"
                aria-pressed={isSelected}
              >
                {loc.type !== 'FACILITY' && loc.photo ? (
                  <img
                    src={loc.photo}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[#e7e8e9]"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: style.bg }}
                  >
                    <span className="material-symbols-outlined text-white text-[20px]">
                      {style.icon}
                    </span>
                  </div>
                )}

                <div className="min-w-0 flex-grow">
                  <p className="text-sm font-bold text-[#191c1d] truncate">{loc.name}</p>
                  <p className="text-xs text-[#6d7a77]">
                    {statusText(loc)} · {loc.zoneName}
                  </p>
                  <p className="text-[11px] text-[#6d7a77]">
                    {formatRelativeTime(loc.updatedAt)}
                  </p>
                </div>
              </button>

              {onViewDetail && (
                <button
                  type="button"
                  onClick={() => onViewDetail(loc)}
                  className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#00685d] font-bold text-xs hover:bg-[#f4fffb] rounded-lg cursor-pointer"
                  aria-label={`Ver ${loc.name}`}
                >
                  Ver
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};
