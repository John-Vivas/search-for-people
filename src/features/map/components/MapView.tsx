import React, { useMemo } from 'react';
import { MapViewProps } from '../types/map.types';
import { MapCanvas } from './MapCanvas';
import { MapFilters } from './MapFilters';
import { MapLegend } from './MapLegend';
import { ZoneDetails } from './ZoneDetails';
import { LocationPopup } from './LocationPopup';
import { LocationList } from './LocationList';
import { getCitiesForDepartment, getDepartmentZones } from '../utils/zoneTree';
import { isDepartmentZone } from '../../../types/emergency-zone';

export const MapView: React.FC<MapViewProps> = ({
  locations,
  zones,
  mapDisplayZones,
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
  const departments = useMemo(() => getDepartmentZones(zones), [zones]);

  const cityOptions = useMemo(() => {
    if (filters.departmentId === 'ALL') return mapDisplayZones;
    return getCitiesForDepartment(zones, filters.departmentId);
  }, [filters.departmentId, mapDisplayZones, zones]);

  const activeZone =
    selectedZone ??
    (filters.zoneId !== 'ALL'
      ? zones.find((z) => z.id === filters.zoneId) ?? null
      : filters.departmentId !== 'ALL'
      ? zones.find((z) => z.id === filters.departmentId) ?? null
      : null);

  const centerOnZone =
    activeZone && !isDepartmentZone(activeZone) && activeZone.latitude != null
      ? activeZone
      : null;

  const resetFilters = () => {
    onZoneSelect(null);
    onFiltersChange({ zoneId: 'ALL', departmentId: 'ALL' });
  };

  const handleFilterChange = (partial: Partial<typeof filters>) => {
    if (partial.zoneId !== undefined) {
      onFiltersChange(partial);
      if (partial.zoneId === 'ALL') {
        if (filters.departmentId !== 'ALL') {
          const dept = zones.find((z) => z.id === filters.departmentId);
          if (dept) onZoneSelect(dept);
          else onZoneSelect(null);
        } else {
          onZoneSelect(null);
        }
      } else {
        const zone = zones.find((z) => z.id === partial.zoneId);
        if (zone) onZoneSelect(zone);
      }
      return;
    }

    if (partial.departmentId !== undefined) {
      onFiltersChange({ ...partial, zoneId: 'ALL' });
      if (partial.departmentId === 'ALL') {
        onZoneSelect(null);
      } else {
        const dept = zones.find((z) => z.id === partial.departmentId);
        if (dept) onZoneSelect(dept);
      }
      return;
    }

    onFiltersChange(partial);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] md:h-[calc(100vh-72px)] overflow-hidden">
      <aside className="hidden lg:flex flex-col w-80 shrink-0 border-r border-[#e1e3e4] bg-[#f8f9fa] overflow-y-auto">
        <div className="p-4 space-y-4">
          <MapFilters filters={filters} zones={zones} onChange={handleFilterChange} />
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

      <div className="relative flex-1 min-h-0 flex flex-col">
        <div className="lg:hidden p-3 bg-white border-b border-[#e1e3e4] shrink-0 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 min-w-max">
            <select
              value={filters.departmentId}
              onChange={(e) => handleFilterChange({ departmentId: e.target.value, zoneId: 'ALL' })}
              className="min-h-[44px] px-3 rounded-xl border border-[#e1e3e4] bg-white text-sm font-medium cursor-pointer"
              aria-label="Filtrar por departamento"
            >
              <option value="ALL">Todos los departamentos</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={filters.zoneId}
              onChange={(e) => handleFilterChange({ zoneId: e.target.value })}
              className="min-h-[44px] px-3 rounded-xl border border-[#e1e3e4] bg-white text-sm font-medium cursor-pointer"
              aria-label="Filtrar por ciudad"
            >
              <option value="ALL">Todas las ciudades</option>
              {cityOptions.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <select
              value={filters.type}
              onChange={(e) =>
                handleFilterChange({
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
                handleFilterChange({ status: e.target.value as typeof filters.status })
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
            zones={mapDisplayZones}
            allZones={zones}
            locations={locations}
            zoneFilter={filters.zoneId}
            departmentFilter={filters.departmentId}
            selectedLocationId={selectedLocation?.id ?? null}
            selectedZoneId={activeZone?.id ?? null}
            centerOnZone={centerOnZone}
            onLocationSelect={onLocationSelect}
            onZoneSelect={onZoneSelect}
          />

          <div className="hidden md:block absolute bottom-4 left-4 z-10 max-w-[180px]">
            <MapLegend />
          </div>
        </div>

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
                onClose={resetFilters}
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
              onClose={resetFilters}
            />
          ) : (
            <div className="text-center py-12 px-4">
              <span className="material-symbols-outlined text-[48px] text-[#bcc9c6] mb-3">
                map
              </span>
              <h3 className="text-base font-bold text-[#191c1d] mb-1">Mapa de emergencia</h3>
              <p className="text-sm text-[#6d7a77]">
                Selecciona un departamento, ciudad o registro para ver más información
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
