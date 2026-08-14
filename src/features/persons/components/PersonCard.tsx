import React, { useState } from 'react';
import { PersonItem } from '@/src/features/persons/types/person';
import { OptimizedImage } from '@/src/components/ui/OptimizedImage';

interface PersonCardProps {
  item: PersonItem;
  onSelect: (item: PersonItem) => void;
  layout?: 'grid' | 'horizontal';
}

const PersonCardBase: React.FC<PersonCardProps> = ({ item, onSelect, layout = 'grid' }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const caseUrl = `${window.location.origin}/caso/${item.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Estamos Buscando: ${item.name}`,
        text: `Información sobre ${item.name} (${item.code}) - ${item.location}`,
        url: caseUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(caseUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderBadge = () => {
    switch (item.type) {
      case 'desaparecido':
        return (
          <span className="bg-[#ba1a1a] text-white font-semibold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
            <span className="material-symbols-outlined text-[14px]">warning</span> Desaparecido
          </span>
        );
      case 'encontrado':
        return (
          <span className="bg-[#00685d] text-white font-semibold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
            <span className="material-symbols-outlined text-[14px]">check_circle</span> Encontrado
          </span>
        );
      case 'nn':
        return (
          <span className="bg-[#8e711f] text-white font-semibold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
            <span className="material-symbols-outlined text-[14px]">help</span> Sin identificar
          </span>
        );
      case 'mascota':
        return (
          <span className="bg-[#ba1a1a] text-white font-semibold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
            <span className="material-symbols-outlined text-[14px]">pets</span> Mascota - Perdida
          </span>
        );
      default:
        return null;
    }
  };

  const fallbackType = item.type === 'mascota' ? 'pet' : 'person';

  if (layout === 'horizontal') {
    return (
      <article
        onClick={() => onSelect(item)}
        className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-4 relative overflow-hidden border border-[#e1e3e4] hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="w-full sm:w-32 h-44 sm:h-36 shrink-0 rounded-lg overflow-hidden bg-[#e7e8e9] relative">
          <OptimizedImage
            src={item.photo}
            alt={item.name}
            width={300}
            height={300}
            fallbackType={fallbackType}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex flex-col justify-between flex-1 py-1">
          <div>
            <div className="mb-2 flex justify-center">{renderBadge()}</div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-lg font-bold text-[#191c1d] group-hover:text-[#00685d] transition-colors">
                {item.name}
              </h3>
              <button
                onClick={handleShare}
                className="text-[#00685d] hover:bg-[#f3f4f5] p-1.5 rounded-full transition-colors relative cursor-pointer"
                title="Compartir"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
                {copied && (
                  <span className="absolute -top-7 right-0 bg-[#191c1d] text-white text-[10px] px-2 py-0.5 rounded shadow-xs">
                    ¡Copiado!
                  </span>
                )}
              </button>
            </div>
            <p className="text-xs text-[#3d4947] font-mono mt-0.5">{item.code} {item.age ? `• ${item.age}` : ''}</p>
          </div>

          <div className="flex flex-col gap-1.5 mt-3">
            <div className="flex items-center gap-2 text-xs text-[#3d4947]">
              <span className="material-symbols-outlined text-[18px] text-[#00685d]">location_on</span>
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#3d4947]">
              <span className="material-symbols-outlined text-[18px] text-[#6d7a77]">schedule</span>
              <span>{item.updatedAt}</span>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#e1e3e4] flex justify-end">
            <button className="text-xs font-bold text-[#00685d] hover:underline flex items-center gap-1 cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">info</span> Ver información
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onSelect(item)}
      className="bg-white rounded-xl border border-[#e1e3e4] overflow-hidden flex flex-col relative group hover:shadow-md transition-all cursor-pointer"
    >
      <div className="h-52 relative overflow-hidden bg-[#e7e8e9]">
        {/* Fondo difuminado de la misma foto: la imagen se ve COMPLETA
            (object-contain) sin recortes feos, especialmente en grupales. */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-40"
          style={{ backgroundImage: `url("${item.photo}")` }}
          aria-hidden="true"
        />
        <OptimizedImage
          src={item.photo}
          alt={item.name}
          width={400}
          height={300}
          crop="fit"
          fallbackType={fallbackType}
          className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="mb-2 flex justify-center">{renderBadge()}</div>
          <h3 className="text-lg font-bold text-[#191c1d] group-hover:text-[#00685d] transition-colors mb-0.5">
            {item.name}
          </h3>
          <p className="text-xs text-[#3d4947] font-mono mb-3">ID: {item.code}</p>

          <div className="space-y-2 mt-auto">
            <div className="flex items-center gap-2 text-xs text-[#3d4947]">
              <span className="material-symbols-outlined text-[18px] text-[#00685d]">location_on</span>
              <span className="truncate">{item.location}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#3d4947]">
              <span className="material-symbols-outlined text-[18px] text-[#6d7a77]">schedule</span>
              <span className="truncate">{item.updatedAt}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between gap-2">
        <button
          className="flex-1 h-10 border border-[#00685d] text-[#00685d] font-semibold text-xs rounded-lg hover:bg-[#008376] hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">info</span>
          Ver información
        </button>

        <button
          onClick={handleShare}
          className="p-2 border border-[#bcc9c6] text-[#436370] rounded-lg hover:bg-[#e7e8e9] transition-colors relative cursor-pointer"
          title="Compartir"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
          {copied && (
            <span className="absolute -top-7 right-0 bg-[#191c1d] text-white text-[10px] px-2 py-0.5 rounded shadow-xs whitespace-nowrap">
              ¡Copiado!
            </span>
          )}
        </button>
      </div>
    </article>
  );
};

/** Memoized: list cards only re-render when their own item/handlers change. */
export const PersonCard = React.memo(PersonCardBase);
