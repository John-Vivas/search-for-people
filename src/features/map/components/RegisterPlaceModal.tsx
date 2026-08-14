import React, { useMemo, useState } from 'react';
import type { EmergencyZone } from '@/src/features/map/types/map.types';
import { getDepartmentZones, getCityLevelZones } from '@/src/features/map/utils/zoneTree';
import { zonesService } from '@/src/features/map/services/zones.service';
import { facilitiesService } from '@/src/features/map/services/facilities.service';
import { invalidateEnrichmentContext } from '@/src/lib/enrichmentContext';
import { geocodeAddress } from '@/src/services/geocoding/geocoding.service';

type Kind = 'zone' | 'facility' | 'collection';

interface RegisterPlaceModalProps {
  open: boolean;
  zones: EmergencyZone[];
  onClose: () => void;
  onRegistered: () => void;
}

const KIND_TABS: { key: Kind; label: string; icon: string }[] = [
  { key: 'zone', label: 'Zona', icon: 'map' },
  { key: 'facility', label: 'Centro de atención', icon: 'local_hospital' },
  { key: 'collection', label: 'Centro de acopio', icon: 'volunteer_activism' },
];

const ZONE_TYPES: { value: 'DEPARTMENT' | 'CITY' | 'MUNICIPALITY'; label: string }[] = [
  { value: 'CITY', label: 'Ciudad' },
  { value: 'MUNICIPALITY', label: 'Municipio' },
  { value: 'DEPARTMENT', label: 'Departamento' },
];

const FACILITY_TYPES: { value: string; label: string }[] = [
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'CLINIC', label: 'Clínica / Centro médico' },
  { value: 'SHELTER', label: 'Refugio / Albergue' },
  { value: 'EMERGENCY_CENTER', label: 'Centro de emergencia' },
  { value: 'OTHER', label: 'Otro' },
];

export const RegisterPlaceModal: React.FC<RegisterPlaceModalProps> = ({
  open,
  zones,
  onClose,
  onRegistered,
}) => {
  const [kind, setKind] = useState<Kind>('zone');
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState<'DEPARTMENT' | 'CITY' | 'MUNICIPALITY'>('CITY');
  const [parentId, setParentId] = useState('');
  const [facilityType, setFacilityType] = useState('HOSPITAL');
  const [zoneId, setZoneId] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departments = useMemo(() => getDepartmentZones(zones), [zones]);
  const cities = useMemo(() => getCityLevelZones(zones), [zones]);

  // Dedup en vivo: zonas existentes con nombre parecido
  const similar = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (kind !== 'zone' || q.length < 3) return [];
    return zones
      .filter((z) => z.name.toLowerCase().includes(q))
      .slice(0, 4);
  }, [name, kind, zones]);

  if (!open) return null;

  const reset = () => {
    setName('');
    setAddress('');
    setCoords(null);
    setParentId('');
    setZoneId('');
    setError(null);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no permite geolocalización.');
      return;
    }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => {
        setError('No pudimos obtener tu ubicación. Podés registrar igual y ajustarla luego.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Poné un nombre.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const deptNode = departments.find((d) => d.id === parentId);
      const cityNode = cities.find((c) => c.id === zoneId);

      // Coordenadas: las capturadas por GPS, o geocodificadas por nombre para
      // que la zona/centro aparezca en el mapa aunque no usen "Usar mi ubicación".
      let lat = coords?.lat ?? null;
      let lng = coords?.lng ?? null;
      if (lat == null || lng == null) {
        const geo = await geocodeAddress(
          kind === 'zone'
            ? { city: name.trim(), neighborhood: deptNode?.name ?? null }
            : { address: address.trim() || null, city: cityNode?.name ?? null }
        );
        if (geo) {
          lat = geo.latitude;
          lng = geo.longitude;
        }
      }

      if (kind === 'zone') {
        // Los departamentos del árbol son sintéticos (id "dept-...", no UUID),
        // así que mandamos el NOMBRE del depto y solo el parentId si es UUID real.
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parentId);
        const res = await zonesService.createCommunityZone({
          name: name.trim(),
          type: zoneType,
          parentId: zoneType === 'DEPARTMENT' ? null : isUuid ? parentId : null,
          department: zoneType === 'DEPARTMENT' ? null : deptNode?.name ?? null,
          latitude: lat,
          longitude: lng,
        });
        if (res.error) throw res.error;
      } else {
        const res = await facilitiesService.createCommunityFacility({
          name: name.trim(),
          facilityType: (kind === 'collection' ? 'COLLECTION_POINT' : facilityType) as never,
          zoneId: zoneId || null,
          address: address.trim() || null,
          latitude: lat,
          longitude: lng,
        });
        if (res.error) throw res.error;
      }

      invalidateEnrichmentContext();
      reset();
      onRegistered();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e1e3e4] px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#191c1d]">Registrar un lugar</h2>
            <p className="text-xs text-[#6d7a77]">Ayuda a dar cobertura donde se necesita la app.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#f3f4f5] text-[#436370] cursor-pointer"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Selector de tipo */}
          <div className="grid grid-cols-3 gap-2">
            {KIND_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setKind(t.key); setError(null); }}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                  kind === t.key
                    ? 'border-[#00685d] bg-[#f4fffb] text-[#00685d]'
                    : 'border-[#e1e3e4] text-[#3d4947] hover:border-[#bcc9c6]'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{t.icon}</span>
                <span className="text-[11px] font-semibold leading-tight">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-[#3d4947] mb-1">
              Nombre {kind === 'zone' ? 'de la zona' : 'del centro'}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === 'zone' ? 'Ej: Tumaco' : 'Ej: Hospital San José'}
              className="w-full h-11 px-3 rounded-xl border-2 border-[#e1e3e4] focus:border-[#00685d] focus:outline-none text-sm"
            />
            {similar.length > 0 && (
              <div className="mt-1.5 text-[11px] text-[#8e711f] bg-[#fff8e1] border border-[#ffdf96] rounded-lg px-2.5 py-1.5">
                ¿Ya existe? {similar.map((z) => z.name).join(', ')}. Si es la misma, no la dupliques.
              </div>
            )}
          </div>

          {/* Campos por tipo */}
          {kind === 'zone' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-[#3d4947] mb-1">Tipo</label>
                <select
                  value={zoneType}
                  onChange={(e) => setZoneType(e.target.value as typeof zoneType)}
                  className="w-full h-11 px-3 rounded-xl border-2 border-[#e1e3e4] focus:border-[#00685d] focus:outline-none text-sm bg-white cursor-pointer"
                >
                  {ZONE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              {zoneType !== 'DEPARTMENT' && (
                <div>
                  <label className="block text-xs font-bold text-[#3d4947] mb-1">Departamento</label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border-2 border-[#e1e3e4] focus:border-[#00685d] focus:outline-none text-sm bg-white cursor-pointer"
                  >
                    <option value="">Sin especificar</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : (
            <>
              {kind === 'facility' && (
                <div>
                  <label className="block text-xs font-bold text-[#3d4947] mb-1">Tipo de centro</label>
                  <select
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border-2 border-[#e1e3e4] focus:border-[#00685d] focus:outline-none text-sm bg-white cursor-pointer"
                  >
                    {FACILITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-[#3d4947] mb-1">Ciudad / Municipio</label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border-2 border-[#e1e3e4] focus:border-[#00685d] focus:outline-none text-sm bg-white cursor-pointer"
                >
                  <option value="">Sin especificar</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3d4947] mb-1">Dirección (opcional)</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Calle 5 #38-25"
                  className="w-full h-11 px-3 rounded-xl border-2 border-[#e1e3e4] focus:border-[#00685d] focus:outline-none text-sm"
                />
              </div>
            </>
          )}

          {/* Ubicación */}
          <div>
            <label className="block text-xs font-bold text-[#3d4947] mb-1">Ubicación</label>
            <button
              onClick={useMyLocation}
              disabled={geoLoading}
              className="w-full h-11 px-3 rounded-xl border-2 border-[#00685d] text-[#00685d] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#f4fffb] transition-colors cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">
                {geoLoading ? 'progress_activity' : 'my_location'}
              </span>
              {coords ? 'Ubicación capturada ✓' : geoLoading ? 'Obteniendo…' : 'Usar mi ubicación'}
            </button>
            {coords && (
              <p className="mt-1 text-[11px] text-[#6d7a77]">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-center text-[#ba1a1a] bg-[#ffdad6] rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#e1e3e4] px-5 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-[#bcc9c6] text-[#3d4947] font-semibold text-sm hover:bg-[#f3f4f5] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-11 rounded-xl bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            )}
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
};
