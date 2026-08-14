import React, { useEffect, useState } from 'react';
import { zonesService } from '@/src/features/map/services/zones.service';
import { facilitiesService } from '@/src/features/map/services/facilities.service';
import type { FacilityWithLocation } from '@/src/features/map/types/zone.db';
import { aidRequestsService } from '@/src/features/aid/services/aidRequests.service';
import { geocodeAddress, reverseGeocode } from '@/src/services/geocoding/geocoding.service';
import { LocationPickerMap } from '@/src/features/map/components/LocationPickerMap';
import { getPreferredName, setPreferredName } from '@/src/lib/preferredName';
import { Portal } from '@/src/components/common/Portal';
import {
  AidResourceType,
  RESOURCE_TYPE_LABELS,
} from '@/src/features/aid/types/aid';

/** Facility-type icon — includes 'COLLECTION_POINT', which exists at the DB
 *  level (see RegisterPlaceModal) even though it's missing from the FacilityType TS enum. */
function facilityIcon(type: string): string {
  if (type === 'HOSPITAL') return 'local_hospital';
  if (type === 'CLINIC') return 'medical_services';
  if (type === 'SHELTER') return 'night_shelter';
  if (type === 'EMERGENCY_CENTER') return 'emergency';
  if (type === 'MORGUE') return 'local_hospital';
  if (type === 'COLLECTION_POINT') return 'volunteer_activism';
  return 'place';
}

interface AidRequestFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface CityOption {
  id: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
}

type LocationMode = 'address' | 'map';

const RESOURCE_ORDER: AidResourceType[] = [
  'FOOD', 'WATER', 'SHELTER', 'MEDICAL', 'CLOTHING', 'HYGIENE', 'VOLUNTEERS', 'TOOLS', 'OTHER',
];

export const AidRequestForm: React.FC<AidRequestFormProps> = ({ open, onClose, onCreated }) => {
  const [resourceType, setResourceType] = useState<AidResourceType>('FOOD');
  const [resourceLabel, setResourceLabel] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [urgency, setUrgency] = useState(3);
  const [requesterName, setRequesterName] = useState('');
  const [cityId, setCityId] = useState('');
  const [address, setAddress] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [description, setDescription] = useState('');
  const [cities, setCities] = useState<CityOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryCode, setDeliveryCode] = useState<string | null>(null);

  const [locationMode, setLocationMode] = useState<LocationMode>('address');
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingMe, setLocatingMe] = useState(false);
  const [resolvingPoint, setResolvingPoint] = useState(false);
  const [places, setPlaces] = useState<FacilityWithLocation[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesOpen, setPlacesOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRequesterName(getPreferredName());
    zonesService.getEmergencyZones(true).then((res) => {
      const options = (res.data ?? [])
        .map((z) => ({
          id: z.id,
          label: z.city?.trim() || z.name,
          latitude: z.latitude,
          longitude: z.longitude,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'));
      setCities(options);
    });
    setPlacesLoading(true);
    facilitiesService.getFacilitiesWithLocation().then((res) => {
      const withCoords = (res.data ?? []).filter((p) => p.latitude != null && p.longitude != null);
      setPlaces(withCoords);
      setPlacesLoading(false);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const selectedCity = cities.find((c) => c.id === cityId);

  const resetForm = () => {
    setResourceLabel(''); setQuantity(''); setUnit(''); setUrgency(3);
    setRequesterName(''); setAddress(''); setPlaceName(''); setDescription('');
    setDeliveryCode(null); setLocationMode('address'); setPickedCoords(null);
    setPlacesOpen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePick = async (lat: number, lng: number) => {
    setPickedCoords({ lat, lng });
    setResolvingPoint(true);
    const displayName = await reverseGeocode(lat, lng);
    setAddress(displayName || `Punto en el mapa (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
    setResolvingPoint(false);
  };

  const handleSelectPlace = (place: FacilityWithLocation) => {
    if (place.latitude == null || place.longitude == null) return;
    setPickedCoords({ lat: place.latitude, lng: place.longitude });
    setAddress(place.address?.trim() || place.name);
    setPlaceName(place.name);
    if (place.zone_id) setCityId(place.zone_id);
    setPlacesOpen(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no permite geolocalización.');
      return;
    }
    setLocatingMe(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingMe(false);
        handlePick(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocatingMe(false);
        setError('No pudimos obtener tu ubicación. Podés escribir la dirección o marcarla en el mapa.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!address.trim()) {
      setError('Indica una dirección o marca un punto en el mapa.');
      return;
    }

    setSubmitting(true);

    // Best-effort coordinates: what the user picked directly, or a geocode
    // guess from the typed address, so the request still lands on the map.
    let latitude = pickedCoords?.lat ?? null;
    let longitude = pickedCoords?.lng ?? null;
    if (latitude == null || longitude == null) {
      const geo = await geocodeAddress({ address: address.trim(), city: selectedCity?.label ?? null });
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
      } else {
        latitude = selectedCity?.latitude ?? null;
        longitude = selectedCity?.longitude ?? null;
      }
    }

    const res = await aidRequestsService.create({
      resourceType,
      resourceLabel: resourceLabel.trim() || undefined,
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit.trim() || undefined,
      urgency,
      requesterName: requesterName.trim(),
      address: address.trim(),
      zoneId: cityId || undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      placeName: placeName.trim() || undefined,
      description: description.trim() || undefined,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error.message || 'No se pudo crear la solicitud');
      return;
    }
    setPreferredName(requesterName);
    onCreated();
    setDeliveryCode(res.data?.deliveryCode ?? null);
  };

  const inputCls =
    'w-full h-11 px-3 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none';
  const labelCls = 'block text-xs font-bold text-[#191c1d] mb-1';

  // Success step: show the one-time delivery code before closing.
  if (deliveryCode) {
    return (
      <Portal>
      <div
        className="fixed inset-0 z-[1300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Solicitud publicada"
        onClick={handleClose}
      >
        <div
          className="bg-white w-full max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="material-symbols-outlined text-[36px] text-[#00685d]">task_alt</span>
          <h3 className="text-base font-bold text-[#191c1d] mt-2">Solicitud publicada</h3>
          <p className="text-sm text-[#6d7a77] mt-1">
            Guarda este código. Solo se muestra una vez, y quien te ayude deberá dártelo a ti para
            confirmar que la ayuda llegó.
          </p>
          <p className="text-3xl font-extrabold tracking-[0.3em] text-[#00685d] mt-4 mb-1">
            {deliveryCode}
          </p>
          <button
            onClick={handleClose}
            className="w-full h-12 mt-4 rounded-full bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
      </Portal>
    );
  }

  return (
    <Portal>
    <div
      className="fixed inset-0 z-[1300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Nueva solicitud de ayuda"
      onClick={handleClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e1e3e4] sticky top-0 bg-white">
          <h3 className="text-base font-bold text-[#191c1d]">Nueva solicitud de ayuda</h3>
          <button type="button" onClick={handleClose} className="p-2 rounded-full text-[#436370] hover:bg-[#e7e8e9] cursor-pointer" aria-label="Cerrar">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Tipo de ayuda *</label>
            <select required value={resourceType} onChange={(e) => setResourceType(e.target.value as AidResourceType)} className={inputCls}>
              {RESOURCE_ORDER.map((t) => (
                <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {resourceType === 'OTHER' && (
            <div>
              <label className={labelCls}>Especifica el recurso</label>
              <input value={resourceLabel} onChange={(e) => setResourceLabel(e.target.value)} placeholder="Ej. Colchonetas" className={inputCls} />
            </div>
          )}

          {/* Ubicación: dirección escrita o punto en el mapa */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Ubicación *</label>
              <div className="flex rounded-full bg-[#f3f4f5] p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLocationMode('address')}
                  className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                    locationMode === 'address' ? 'bg-white text-[#00685d] shadow-xs' : 'text-[#6d7a77]'
                  }`}
                >
                  Dirección
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode('map')}
                  className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                    locationMode === 'map' ? 'bg-white text-[#00685d] shadow-xs' : 'text-[#6d7a77]'
                  }`}
                >
                  Mapa
                </button>
              </div>
            </div>

            {locationMode === 'address' ? (
              <div className="space-y-2">
                <input
                  required
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setPickedCoords(null); }}
                  placeholder="Ej. Calle 10 #5-20, o 'Centro de acopio La Julita'"
                  className={inputCls}
                  minLength={3}
                  maxLength={300}
                />
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locatingMe}
                  className="w-full h-10 px-3 rounded-xl border border-[#00685d] text-[#00685d] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#f4fffb] transition-colors cursor-pointer disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {locatingMe ? 'progress_activity' : 'my_location'}
                  </span>
                  {locatingMe ? 'Obteniendo…' : 'Usar mi ubicación'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locatingMe}
                    className="flex-1 h-10 px-3 rounded-xl border border-[#00685d] text-[#00685d] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#f4fffb] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {locatingMe ? 'progress_activity' : 'my_location'}
                    </span>
                    {locatingMe ? 'Obteniendo…' : 'Mi ubicación'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlacesOpen((v) => !v)}
                    className="flex-1 h-10 px-3 rounded-xl border border-[#bcc9c6] text-[#3d4947] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#f3f4f5] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">list</span>
                    Lugares registrados
                  </button>
                </div>

                {placesOpen && (
                  <div className="border border-[#e1e3e4] rounded-xl max-h-40 overflow-y-auto divide-y divide-[#e1e3e4]">
                    {placesLoading ? (
                      <p className="text-xs text-[#6d7a77] p-3">Cargando lugares…</p>
                    ) : places.length === 0 ? (
                      <p className="text-xs text-[#6d7a77] p-3">
                        No hay lugares registrados con ubicación todavía.
                      </p>
                    ) : (
                      places.map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => handleSelectPlace(place)}
                          className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-[#f8f9fa] transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px] text-[#00685d] shrink-0">
                            {facilityIcon(place.facility_type)}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-bold text-[#191c1d] truncate">
                              {place.name}
                            </span>
                            {place.address && (
                              <span className="block text-[11px] text-[#6d7a77] truncate">
                                {place.address}
                              </span>
                            )}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                <LocationPickerMap
                  latitude={pickedCoords?.lat ?? null}
                  longitude={pickedCoords?.lng ?? null}
                  defaultCenter={
                    selectedCity?.latitude != null && selectedCity?.longitude != null
                      ? [selectedCity.latitude, selectedCity.longitude]
                      : undefined
                  }
                  onPick={handlePick}
                />
                <p className="text-[11px] text-[#6d7a77]">
                  Toca el mapa para marcar el punto (ej. un centro de acopio o punto de encuentro).
                </p>
                {resolvingPoint ? (
                  <p className="text-xs text-[#6d7a77]">Ubicando dirección…</p>
                ) : address ? (
                  <p className="text-xs font-semibold text-[#191c1d]">{address}</p>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Nombre de quien recibe la ayuda *</label>
            <input required value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Ej. Ana Pérez" className={inputCls} minLength={2} maxLength={150} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Cantidad (opcional)</label>
              <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="400" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Unidad (opcional)</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="raciones, litros…" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Urgencia: {urgency}</label>
            <input type="range" min={1} max={5} value={urgency} onChange={(e) => setUrgency(Number(e.target.value))} className="w-full accent-[#ba1a1a]" />
            <div className="flex justify-between text-[10px] text-[#6d7a77] px-0.5">
              <span>Baja</span><span>Media</span><span>Crítica</span>
            </div>
          </div>

          <div>
            <label className={labelCls}>Ciudad (opcional)</label>
            <select value={cityId} onChange={(e) => setCityId(e.target.value)} className={inputCls}>
              <option value="">Sin especificar</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Barrio / punto (opcional)</label>
            <input value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder="Ej. La Julita (Universidad)" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Detalle (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none" />
          </div>

          {error && <p className="text-sm text-[#ba1a1a] font-medium">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-[#e1e3e4] sticky bottom-0 bg-white">
          <button type="submit" disabled={submitting} className="w-full h-12 rounded-full bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors disabled:opacity-50 cursor-pointer">
            {submitting ? 'Publicando…' : 'Publicar solicitud'}
          </button>
        </div>
      </form>
    </div>
    </Portal>
  );
};
