import React from 'react';
import { MapViewProps } from '../types/map.types';
import { MapCanvas } from './MapCanvas';
import { MapFilters } from './MapFilters';
import { MapLegend } from './MapLegend';
import { ZoneDetails } from './ZoneDetails';
import { LocationPopup } from './LocationPopup';
import { LocationList } from './LocationList';

export const MapView: React.FC<MapViewProps> = ({
  locations,
  zones,
  selectedLocation,
  selectedZone,
  activeZoneStats,
  filters,
  onLocationSelect,
  onZoneSelect,
  onFiltersChange,
  onViewLocationDetail,
  onViewZoneRecords,
}) => {
  const activeZone = selectedZone ?? (filters.zoneId !== 'ALL'
    ? zones.find((z) => z.id === filters.zoneId) ?? null
    : null);

  const handleZoneFilterChange = (zoneId: string) => {
    onFiltersChange({ zoneId });
    if (zoneId === 'ALL') {
      onZoneSelect(null);
    } else {
      const zone = zones.find((z) => z.id === zoneId);
      if (zone) onZoneSelect(zone);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] md:h-[calc(100vh-72px)] overflow-hidden">
      {/* Panel lateral / superior de filtros en desktop */}
      <aside className="hidden lg:flex flex-col w-80 shrink-0 border-r border-[#e1e3e4] bg-[#f8f9fa] overflow-y-auto">
        <div className="p-4 space-y-4">
          <MapFilters
            filters={filters}
            zones={zones}
            onChange={(partial) => {
              if (partial.zoneId !== undefined) {
                handleZoneFilterChange(partial.zoneId);
              } else {
                onFiltersChange(partial);
              }
            }}
          />
          <MapLegend />
        </div>

        <div className="flex-1 flex flex-col min-h-0 border-t border-[#e1e3e4]">
          <div className="p-4 pb-2">
            <h2 className="text-sm font-bold text-[#191c1d]">
              Resultados ({locations.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LocationList
              locations={locations}
              selectedId={selectedLocation?.id}
              onSelect={(loc) => onLocationSelect(loc)}
              onViewDetail={onViewLocationDetail}
            />
          </div>
        </div>
      </aside>

      {/* Área del mapa */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        {/* Filtros móvil / tablet */}
        <div className="lg:hidden p-3 bg-white border-b border-[#e1e3e4] shrink-0 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 min-w-max">
            <select
              value={filters.zoneId}
              onChange={(e) => handleZoneFilterChange(e.target.value)}
              className="min-h-[44px] px-3 rounded-xl border border-[#e1e3e4] bg-white text-sm font-medium cursor-pointer"
              aria-label="Filtrar por zona"
            >
              <option value="ALL">Todas las zonas</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <select
              value={filters.type}
              onChange={(e) =>
                onFiltersChange({
                  type: e.target.value as typeof filters.type,
                  status:
                    e.target.value === 'PET' || e.target.value === 'FACILITY'
                      ? 'ALL'
                      : filters.status,
                })
              }
              className="min-h-[44px] px-3 rounded-xl border border-[#e1e3e4] bg-white text-sm font-medium cursor-pointer"
              aria-label="Filtrar por tipo"
            >
              <option value="ALL">Todos</option>
              <option value="PERSON">Personas</option>
              <option value="PET">Mascotas</option>
              <option value="FACILITY">Centros</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) =>
                onFiltersChange({ status: e.target.value as typeof filters.status })
              }
              disabled={filters.type === 'PET' || filters.type === 'FACILITY'}
              className="min-h-[44px] px-3 rounded-xl border border-[#e1e3e4] bg-white text-sm font-medium cursor-pointer disabled:opacity-50"
              aria-label="Filtrar por estado"
            >
              <option value="ALL">Todos</option>
              <option value="MISSING">Desaparecidos</option>
              <option value="FOUND">Encontrados</option>
              <option value="UNIDENTIFIED">NN</option>
            </select>
          </div>
        </div>

        <div className="relative flex-1 min-h-[240px]">
          <MapCanvas
            zones={zones}
            locations={locations}
            zoneFilter={filters.zoneId}
            selectedLocationId={selectedLocation?.id ?? null}
            selectedZoneId={activeZone?.id ?? null}
            centerOnZone={activeZone}
            onLocationSelect={onLocationSelect}
            onZoneSelect={onZoneSelect}
          />

          {/* Leyenda flotante desktop en mapa */}
          <div className="hidden md:block absolute bottom-4 left-4 z-10 max-w-[180px]">
            <MapLegend />
          </div>
        </div>

        {/* Panel inferior móvil: zona o registro seleccionado */}
        <div className="lg:hidden shrink-0 max-h-[45vh] overflow-y-auto bg-[#f8f9fa] border-t border-[#e1e3e4]">
          {selectedLocation ? (
            <div className="p-3">
              <LocationPopup
                location={selectedLocation}
                onClose={() => onLocationSelect(null)}
                onViewDetail={onViewLocationDetail}
              />
            </div>
          ) : activeZoneStats ? (
            <div className="p-3">
              <ZoneDetails
                stats={activeZoneStats}
                onViewRecords={onViewZoneRecords}
                onClose={() => {
                  onZoneSelect(null);
                  onFiltersChange({ zoneId: 'ALL' });
                }}
              />
            </div>
          ) : (
            <div>
              <div className="px-4 py-2 border-b border-[#e1e3e4] bg-white sticky top-0">
                <h2 className="text-sm font-bold text-[#191c1d]">
                  Resultados ({locations.length})
                </h2>
                <p className="text-[11px] text-[#6d7a77]">
                  Toca una zona en el mapa o selecciona un registro
                </p>
              </div>
              <LocationList
                locations={locations}
                selectedId={selectedLocation?.id}
                onSelect={(loc) => onLocationSelect(loc)}
                onViewDetail={onViewLocationDetail}
              />
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho desktop: detalle */}
      <aside className="hidden lg:flex flex-col w-96 shrink-0 border-l border-[#e1e3e4] bg-[#f8f9fa] overflow-y-auto">
        <div className="p-4">
          {selectedLocation ? (
            <LocationPopup
              location={selectedLocation}
              onClose={() => onLocationSelect(null)}
              onViewDetail={onViewLocationDetail}
            />
          ) : activeZoneStats ? (
            <ZoneDetails
              stats={activeZoneStats}
              onViewRecords={onViewZoneRecords}
              onClose={() => {
                onZoneSelect(null);
                onFiltersChange({ zoneId: 'ALL' });
              }}
            />
          ) : (
            <div className="text-center py-12 px-4">
              <span className="material-symbols-outlined text-[48px] text-[#bcc9c6] mb-3">
                map
              </span>
              <h3 className="text-base font-bold text-[#191c1d] mb-1">Mapa de emergencia</h3>
              <p className="text-sm text-[#6d7a77]">
                Selecciona una zona o un registro para ver más información
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
