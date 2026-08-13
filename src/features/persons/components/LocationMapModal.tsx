import { useEffect } from 'react';
import { PersonLocationMap } from '@/src/features/persons/components/PersonLocationMap';

interface LocationMapModalProps {
  open: boolean;
  onClose: () => void;
  coordinates: [number, number];
  title: string;
  subtitle?: string;
  markerColor?: string;
}

/**
 * Centered, non-fullscreen modal that shows an enlarged interactive map for
 * better visibility of the last-seen location. Closes on backdrop click, the
 * X button, or the Escape key.
 */
export function LocationMapModal({
  open,
  onClose,
  coordinates,
  title,
  subtitle,
  markerColor,
}: LocationMapModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Prevent background scroll while the modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Mapa de ubicación: ${title}`}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#e1e3e4]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[22px] text-[#00685d]" data-weight="fill">
              location_on
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#191c1d] truncate">{title}</h3>
              {subtitle && <p className="text-xs text-[#6d7a77] truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-full text-[#436370] hover:bg-[#e7e8e9] transition-colors cursor-pointer"
            aria-label="Cerrar mapa"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="h-[60vh]">
          <PersonLocationMap
            coordinates={coordinates}
            label={title}
            markerColor={markerColor}
            zoom={16}
          />
        </div>
      </div>
    </div>
  );
}
