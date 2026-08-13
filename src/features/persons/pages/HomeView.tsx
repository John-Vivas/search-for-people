import React, { useState } from 'react';
import { PersonItem } from '@/src/features/persons/types/person';
import { PersonCard } from '@/src/features/persons/components/PersonCard';

interface HomeViewProps {
  items: PersonItem[];
  onNavigate: (tab: string, filter?: string, itemId?: string) => void;
  onSelectPerson: (person: PersonItem) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ items, onNavigate, onSelectPerson }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('buscar', searchQuery.trim());
    } else {
      onNavigate('buscar');
    }
  };

  const featuredItems = items.slice(0, 4);
  const missingCount = items.filter((i) => i.type === 'desaparecido').length;
  const foundCount = items.filter((i) => i.type === 'encontrado').length;
  const nnCount = items.filter((i) => i.type === 'nn').length;
  const petCount = items.filter((i) => i.type === 'mascota').length;

  return (
    <div className="pb-24 md:pb-12 pt-6">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center px-4 max-w-3xl mx-auto mb-8 animate-fade-in">
        <div className="w-28 h-28 md:w-40 md:h-40 mb-4 rounded-full bg-[#f4fffb] border border-[#00685d]/20 flex items-center justify-center p-3 shadow-sm">
          <span className="material-symbols-outlined text-[#00685d] text-[64px] md:text-[88px]" data-weight="fill">
            volunteer_activism
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#00685d] mb-3 tracking-tight">
          Estamos Buscando
        </h1>
        <p className="text-base md:text-lg text-[#3d4947] max-w-xl mx-auto leading-relaxed">
          Información comunitaria para ayudar a encontrar personas, reunir familias y localizar mascotas.
        </p>
      </section>

      {/* Main Search Input */}
      <section className="mb-10 max-w-2xl mx-auto px-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6d7a77]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="¿Buscas a alguien? Escribe nombre, ciudad, código o seña..."
            className="w-full h-12 md:h-14 pl-12 pr-28 rounded-full border-2 border-[#e1e3e4] bg-white text-base text-[#191c1d] focus:outline-none focus:border-[#00685d] focus:ring-1 focus:ring-[#00685d] shadow-sm transition-all placeholder:text-[#6d7a77]"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 md:h-10 px-5 bg-[#00685d] text-white text-xs md:text-sm font-bold rounded-full hover:bg-[#008376] transition-colors cursor-pointer"
          >
            Buscar
          </button>
        </form>
      </section>

      {/* Quick Access Bento Grid */}
      <section className="mb-10 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('desaparecidos')}
            className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-[#e1e3e4] shadow-xs hover:shadow-md hover:border-[#ba1a1a] transition-all group text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[#93000a] text-[26px]">person_search</span>
            </div>
            <span className="text-sm font-bold text-[#191c1d] text-center">Personas desaparecidas</span>
            <span className="text-[11px] text-[#ba1a1a] font-semibold mt-1">{missingCount} activos</span>
          </button>

          <button
            onClick={() => onNavigate('encontrados')}
            className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-[#e1e3e4] shadow-xs hover:shadow-md hover:border-[#00685d] transition-all group text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#f4fffb] border border-[#00685d]/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[#00685d] text-[26px]">handshake</span>
            </div>
            <span className="text-sm font-bold text-[#191c1d] text-center">Personas encontradas</span>
            <span className="text-[11px] text-[#00685d] font-semibold mt-1">{foundCount} registrados</span>
          </button>

          <button
            onClick={() => onNavigate('nn')}
            className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-[#e1e3e4] shadow-xs hover:shadow-md hover:border-[#8e711f] transition-all group text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#e1e3e4] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[#3d4947] text-[26px]">help_center</span>
            </div>
            <span className="text-sm font-bold text-[#191c1d] text-center">Personas sin identificar (NN)</span>
            <span className="text-[11px] text-[#8e711f] font-semibold mt-1">{nnCount} casos</span>
          </button>

          <button
            onClick={() => onNavigate('buscar', 'mascota')}
            className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-[#e1e3e4] shadow-xs hover:shadow-md hover:border-[#735802] transition-all group text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#ffdf96]/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[#735802] text-[26px]">pets</span>
            </div>
            <span className="text-sm font-bold text-[#191c1d] text-center">Mascotas perdidas</span>
            <span className="text-[11px] text-[#735802] font-semibold mt-1">{petCount} reportes</span>
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => onNavigate('mapa')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 bg-white rounded-xl border border-[#e1e3e4] shadow-xs hover:shadow-md hover:border-[#00685d] transition-all group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#00685d] group-hover:scale-110 transition-transform">map</span>
            <span className="text-sm font-bold text-[#191c1d]">Explorar en Mapa Georreferenciado</span>
          </button>
        </div>

        {/* Aid coordination CTA → /ayuda */}
        <div className="mt-4">
          <button
            onClick={() => onNavigate('ayuda')}
            className="w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl bg-[#00685d] text-white shadow-sm hover:bg-[#008376] transition-all group cursor-pointer text-left"
          >
            <span className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[26px]">volunteer_activism</span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-base font-bold">¿Deseas ayudar?</span>
              <span className="block text-sm text-white/85">
                Mira los puntos de recolección y las solicitudes de recursos (agua, alimento, refugio) en tiempo real.
              </span>
            </span>
            <span className="material-symbols-outlined shrink-0">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="mb-10 max-w-5xl mx-auto px-4">
        <div className="bg-[#f3f4f5] rounded-2xl p-4 md:p-6 border border-[#e1e3e4] flex justify-between items-center overflow-x-auto gap-4 scrollbar-hide">
          <div className="flex flex-col items-center min-w-[90px] flex-1">
            <span className="text-2xl md:text-3xl font-black text-[#ba1a1a]">{missingCount}</span>
            <span className="text-xs font-medium text-[#3d4947]">Desaparecidos</span>
          </div>
          <div className="w-px h-10 bg-[#bcc9c6] hidden sm:block"></div>
          <div className="flex flex-col items-center min-w-[90px] flex-1">
            <span className="text-2xl md:text-3xl font-black text-[#00685d]">{foundCount}</span>
            <span className="text-xs font-medium text-[#3d4947]">Encontrados</span>
          </div>
          <div className="w-px h-10 bg-[#bcc9c6] hidden sm:block"></div>
          <div className="flex flex-col items-center min-w-[90px] flex-1">
            <span className="text-2xl md:text-3xl font-black text-[#436370]">{nnCount}</span>
            <span className="text-xs font-medium text-[#3d4947]">NN Identificándose</span>
          </div>
          <div className="w-px h-10 bg-[#bcc9c6] hidden sm:block"></div>
          <div className="flex flex-col items-center min-w-[90px] flex-1">
            <span className="text-2xl md:text-3xl font-black text-[#735802]">{petCount}</span>
            <span className="text-xs font-medium text-[#3d4947]">Mascotas</span>
          </div>
        </div>
      </section>

      {/* Main Action & Disclaimer */}
      <section className="flex flex-col items-center gap-4 mb-12 px-4 text-center">
        <button
          onClick={() => onNavigate('reportar')}
          className="bg-[#00685d] text-white h-12 md:h-14 px-8 rounded-full text-base font-bold shadow-md hover:shadow-lg hover:bg-[#008376] transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">add_alert</span>
          Reportar información de desaparecido o encontrado
        </button>
        <p className="text-xs text-[#6d7a77] max-w-xl mx-auto leading-relaxed">
          Esta plataforma es una iniciativa independiente de apoyo comunitario y no reemplaza la información ni las instrucciones de las autoridades oficiales (Policía Nacional / Fiscalía).
        </p>
      </section>

      {/* Featured Search Cases Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#191c1d]">Casos Recientes</h2>
            <p className="text-xs md:text-sm text-[#3d4947]">Reportes más actualizados en la comunidad</p>
          </div>
          <button
            onClick={() => onNavigate('buscar')}
            className="text-xs md:text-sm font-bold text-[#00685d] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Ver todos los casos
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredItems.map((item) => (
            <PersonCard key={item.id} item={item} onSelect={onSelectPerson} />
          ))}
        </div>
      </section>
    </div>
  );
};
