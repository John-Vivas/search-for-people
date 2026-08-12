import React from 'react';
import { MapLocation } from '../types/map.types';
import { formatRelativeTime } from '../../../lib/utils';
import { getMarkerStyle } from './MarkerIcon';

interface LocationPopupProps {
  location: MapLocation;
  onClose: () => void;
  onViewDetail?: (location: MapLocation) => void;
}

function statusLabel(location: MapLocation): string {
  if (location.type === 'PERSON') {
    switch (location.status) {
      case 'MISSING':
        return 'Desaparecido';
      case 'FOUND':
        return 'Encontrado';
      case 'UNIDENTIFIED':
        return 'NN — Sin identificar';
    }
  }
  if (location.type === 'PET') return 'Mascota';
  return 'Centro de atención';
}

function statusBadgeClass(location: MapLocation): string {
  if (location.type === 'PERSON') {
    switch (location.status) {
      case 'MISSING':
        return 'bg-[#ffdad6] text-[#93000a]';
      case 'FOUND':
        return 'bg-[#f4fffb] text-[#00685d]';
      case 'UNIDENTIFIED':
        return 'bg-[#fff8e1] text-[#735802]';
    }
  }
  if (location.type === 'PET') return 'bg-[#fff8e1] text-[#735802]';
  return 'bg-[#c6e8f8] text-[#436370]';
}

export const LocationPopup: React.FC<LocationPopupProps> = ({
  location,
  onClose,
  onViewDetail,
}) => {
  const style =
    location.type === 'FACILITY'
      ? getMarkerStyle('FACILITY', location.facilityType)
      : location.type === 'PET'
      ? getMarkerStyle('PET')
      : getMarkerStyle('PERSON', location.status);

  return (
    <div className="bg-white rounded-2xl border border-[#e1e3e4] shadow-xl overflow-hidden animate-slide-up">
      <div className="p-3 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#f3f4f5] z-10 cursor-pointer"
          aria-label="Cerrar detalle"
        >
          <span className="material-symbols-outlined text-[20px] text-[#6d7a77]">close</span>
        </button>

        <div className="flex gap-3">
          {location.type !== 'FACILITY' && location.photo ? (
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#e7e8e9] shrink-0">
              <img
                src={location.photo}
                alt={location.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center"
              style={{ backgroundColor: style.bg }}
            >
              <span className="material-symbols-outlined text-white text-[32px]">{style.icon}</span>
            </div>
          )}

          <div className="flex flex-col justify-center flex-grow pr-8 min-w-0">
            <span
              className={`inline-block self-start text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase mb-1 ${statusBadgeClass(location)}`}
            >
              {statusLabel(location)}
            </span>
            <h3 className="text-base font-bold text-[#191c1d] leading-tight truncate">
              {location.name}
            </h3>
            <p className="text-xs text-[#6d7a77] mt-0.5">{location.zoneName}</p>
            <p className="text-xs text-[#6d7a77]">{formatRelativeTime(location.updatedAt)}</p>
          </div>
        </div>

        <div className="mt-3 space-y-2 text-xs text-[#3d4947]">
          {location.type === 'PERSON' && location.lastSeenLocation && (
            <div className="flex gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#6d7a77] shrink-0">
                history
              </span>
              <div>
                <p className="font-semibold text-[#6d7a77]">Última vez visto</p>
                <p>{location.lastSeenLocation}</p>
                <p className="text-[#6d7a77]">{location.lastSeenDate}</p>
              </div>
            </div>
          )}

          {location.type === 'PERSON' && location.currentLocation && (
            <div className="flex gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#00685d] shrink-0">
                location_on
              </span>
              <div>
                <p className="font-semibold text-[#00685d]">Ubicación actual</p>
                <p>{location.currentLocation}</p>
              </div>
            </div>
          )}

          {location.type === 'PET' && location.lastSeenLocation && (
            <div className="flex gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#6d7a77] shrink-0">
                history
              </span>
              <div>
                <p className="font-semibold text-[#6d7a77]">Última vez visto</p>
                <p>{location.lastSeenLocation}</p>
              </div>
            </div>
          )}

          {location.type === 'FACILITY' && (
            <div className="flex gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#436370] shrink-0">
                groups
              </span>
              <p>
                <strong>{location.registeredCount}</strong> personas registradas aquí
              </p>
            </div>
          )}
        </div>

        {onViewDetail && (
          <div className="mt-3 pt-2 border-t border-[#e1e3e4]">
            <button
              type="button"
              onClick={() => onViewDetail(location)}
              className="w-full min-h-[44px] bg-[#00685d] hover:bg-[#008376] text-white text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              Ver información
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
