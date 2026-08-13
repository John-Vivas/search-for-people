import React from 'react';
import { PersonItem } from '@/src/features/persons/types/person';

interface PersonDetailViewProps {
  item: PersonItem;
  onOpenSightingModal: () => void;
  onBack: () => void;
}

export const PersonDetailView: React.FC<PersonDetailViewProps> = ({
  item,
  onOpenSightingModal,
  onBack
}) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Estamos Buscando: ${item.name}`,
        text: `Ayúdanos a encontrar a ${item.name}. Visto por última vez en ${item.location}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace de ficha copiado al portapapeles!');
    }
  };

  return (
    <div className="pt-2 max-w-3xl mx-auto px-4 pb-28 md:pb-12 animate-fade-in">
      {/* Back button header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-bold text-[#00685d] hover:underline cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Volver a la lista
        </button>

        <button
          onClick={handleShare}
          className="p-2 bg-white border border-[#bcc9c6] rounded-full text-[#436370] hover:bg-[#f3f4f5] transition-colors cursor-pointer"
          title="Compartir ficha"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
        </button>
      </div>

      {/* Hero Photo & Badges */}
      <div className="relative w-full aspect-square md:aspect-video bg-[#e1e3e4] rounded-2xl overflow-hidden mb-6 shadow-sm border border-[#e1e3e4]">
        <img
          src={item.photo}
          alt={item.name}
          className="w-full h-full object-cover"
        />

        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {item.type === 'desaparecido' && (
            <div className="bg-[#ba1a1a] text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span className="text-xs font-extrabold uppercase tracking-wider">Desaparecido</span>
            </div>
          )}
          {item.type === 'encontrado' && (
            <div className="bg-[#00685d] text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span className="text-xs font-extrabold uppercase tracking-wider">Encontrado</span>
            </div>
          )}
          {item.type === 'nn' && (
            <div className="bg-[#8e711f] text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">help</span>
              <span className="text-xs font-extrabold uppercase tracking-wider">Sin Identificar (NN)</span>
            </div>
          )}

          {item.verified && (
            <div className="bg-[#00685d]/90 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm backdrop-blur-xs">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span className="text-[11px] font-semibold">Información verificada</span>
            </div>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#191c1d] mb-2">
          {item.name}
        </h1>
        <div className="flex items-center gap-2 text-[#3d4947] text-sm">
          <span className="material-symbols-outlined text-[#6d7a77] text-[18px]">schedule</span>
          <p>
            Visto por última vez: <span className="font-bold text-[#191c1d]">{item.lastSeenDate || item.updatedAt}</span>
          </p>
        </div>
      </div>

      {/* Detailed Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Ubicación */}
        <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#00685d]">
            <span className="material-symbols-outlined text-[20px]" data-weight="fill">
              location_on
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6d7a77]">
              Última Ubicación
            </h3>
          </div>
          <p className="text-base font-bold text-[#191c1d]">{item.location}, {item.city}</p>

          <div className="w-full h-32 bg-[#e7e8e9] rounded-xl overflow-hidden relative mt-2 border border-[#bcc9c6]/40 flex items-center justify-center">
            {/* Map Preview Snippet */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-90"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCeOnxHJRsn50r51p1M-IiqRlCfMVbGldYoAJ6CjNekeWvCHayD1LRRJHudc6cdKB9q2s_MgX5MU2RuFx01kXJKg4xJMAjZTxOfRClHIVzSDhoEa2BSssiH2YZZTAhEGHTWR7s2Ad-NJf17SpXzqMTKsaMfsLOKN0kUUBybz5Vl54fIt_HNlVSirbyxDcMBhCtwTJch8CToWaidx2ei5MFVGzKgjvLHcU9VoZGrTT8qNFlZfjDFPLkPBw')`,
              }}
            />
            <div className="relative z-10 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-xs font-bold text-[#00685d]">
              <span className="material-symbols-outlined text-[16px]">pin_drop</span>
              Ver en mapa interactivo
            </div>
          </div>
        </div>

        {/* Descripción Física */}
        <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#00685d]">
            <span className="material-symbols-outlined text-[20px]" data-weight="fill">
              person
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6d7a77]">
              Descripción Física
            </h3>
          </div>

          <ul className="space-y-2.5 text-sm text-[#3d4947]">
            <li className="flex justify-between border-b border-[#e1e3e4] pb-2">
              <span>Edad aproximada</span>
              <span className="font-bold text-[#191c1d]">{item.age}</span>
            </li>
            {item.height && (
              <li className="flex justify-between border-b border-[#e1e3e4] pb-2">
                <span>Estatura</span>
                <span className="font-bold text-[#191c1d]">{item.height}</span>
              </li>
            )}
            {item.physique && (
              <li className="flex justify-between border-b border-[#e1e3e4] pb-2">
                <span>Complexión</span>
                <span className="font-bold text-[#191c1d]">{item.physique}</span>
              </li>
            )}
            {item.clothing && (
              <li className="flex justify-between">
                <span>Vestimenta</span>
                <span className="font-bold text-[#191c1d] text-right max-w-[60%]">
                  {item.clothing}
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* Detalles Adicionales */}
        {(item.additionalDetails || item.tattoo || item.distinctiveFeatures) && (
          <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs flex flex-col gap-2 md:col-span-2">
            <div className="flex items-center gap-2 text-[#00685d]">
              <span className="material-symbols-outlined text-[20px]" data-weight="fill">
                info
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6d7a77]">
                Detalles Adicionales y Señal Particular
              </h3>
            </div>
            <p className="text-sm text-[#3d4947] leading-relaxed">
              {item.additionalDetails || item.distinctiveFeatures || item.tattoo}
            </p>
          </div>
        )}
      </div>

      {/* Call to Action Box */}
      <div className="bg-[#f3f4f5] p-6 rounded-2xl text-center mb-6 border border-[#bcc9c6]/40 shadow-xs">
        <span className="material-symbols-outlined text-4xl text-[#00685d] mb-2">campaign</span>
        <h3 className="text-xl font-bold text-[#191c1d] mb-1">¿Tienes información?</h3>
        <p className="text-sm text-[#3d4947] mb-5 max-w-md mx-auto leading-relaxed">
          Cualquier detalle puede ser crucial. Tu reporte será tratado con urgencia y confidencialidad.
        </p>
        <button
          onClick={onOpenSightingModal}
          className="bg-[#00685d] text-white font-bold text-sm w-full md:w-auto px-8 py-3.5 rounded-full hover:bg-[#008376] transition-all shadow-sm flex items-center justify-center gap-2 mx-auto active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add_comment</span>
          Reportar información sobre esta persona
        </button>
      </div>

      {/* Privacy Note */}
      <div className="flex items-start gap-3 bg-[#e1e3e4]/40 p-4 rounded-xl">
        <span className="material-symbols-outlined text-[#6d7a77] text-[20px] shrink-0 mt-0.5">
          privacy_tip
        </span>
        <p className="text-xs text-[#3d4947]">
          Por motivos de privacidad y seguridad, no se muestran documentos de identidad ni datos sensibles públicamente. La información proporcionada ha sido verificada por moderadores comunitarios.
        </p>
      </div>
    </div>
  );
};
