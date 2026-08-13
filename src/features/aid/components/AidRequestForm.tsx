import React, { useEffect, useState } from 'react';
import { zonesService } from '@/src/features/map/services/zones.service';
import { aidRequestsService } from '@/src/features/aid/services/aidRequests.service';
import {
  AidResourceType,
  RESOURCE_TYPE_LABELS,
} from '@/src/features/aid/types/aid';

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

const RESOURCE_ORDER: AidResourceType[] = [
  'FOOD', 'WATER', 'SHELTER', 'MEDICAL', 'CLOTHING', 'HYGIENE', 'VOLUNTEERS', 'TOOLS', 'OTHER',
];

export const AidRequestForm: React.FC<AidRequestFormProps> = ({ open, onClose, onCreated }) => {
  const [resourceType, setResourceType] = useState<AidResourceType>('FOOD');
  const [resourceLabel, setResourceLabel] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [urgency, setUrgency] = useState(3);
  const [requesterOrg, setRequesterOrg] = useState('');
  const [cityId, setCityId] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [description, setDescription] = useState('');
  const [cities, setCities] = useState<CityOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await aidRequestsService.create({
      resourceType,
      resourceLabel: resourceLabel.trim() || null,
      quantity: quantity ? Number(quantity) : null,
      unit: unit.trim() || null,
      urgency,
      requesterOrg: requesterOrg.trim() || null,
      zoneId: cityId || null,
      latitude: selectedCity?.latitude ?? null,
      longitude: selectedCity?.longitude ?? null,
      placeName: placeName.trim() || null,
      description: description.trim() || null,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error.message ?? 'No se pudo crear la solicitud');
      return;
    }
    onCreated();
    onClose();
    // Reset for next time
    setResourceLabel(''); setQuantity(''); setUnit(''); setUrgency(3);
    setRequesterOrg(''); setPlaceName(''); setDescription('');
  };

  const inputCls =
    'w-full h-11 px-3 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none';
  const labelCls = 'block text-xs font-bold text-[#191c1d] mb-1';

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Nueva solicitud de ayuda"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e1e3e4] sticky top-0 bg-white">
          <h3 className="text-base font-bold text-[#191c1d]">Nueva solicitud de ayuda</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-[#436370] hover:bg-[#e7e8e9] cursor-pointer" aria-label="Cerrar">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Tipo de recurso *</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Cantidad</label>
              <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="400" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Unidad</label>
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
            <label className={labelCls}>Ciudad *</label>
            <select required value={cityId} onChange={(e) => setCityId(e.target.value)} className={inputCls}>
              <option value="" disabled>{cities.length ? 'Selecciona una ciudad' : 'Cargando…'}</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Barrio / punto</label>
            <input value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder="Ej. La Julita (Universidad)" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Quién solicita (organización)</label>
            <input value={requesterOrg} onChange={(e) => setRequesterOrg(e.target.value)} placeholder="Ej. JAC Perla del Otún" className={inputCls} />
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
  );
};
