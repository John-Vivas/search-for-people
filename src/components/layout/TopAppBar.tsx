import React from 'react';
import { FEATURES } from '@/src/lib/featureFlags';

interface TopAppBarProps {
  currentTab: string;
  onNavigate: (tab: string, itemId?: string) => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onSearchClick?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentTab,
  onNavigate,
  title = 'Estamos Buscando',
  showBack = false,
  onBack,
  onSearchClick
}) => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-[64px] md:h-[72px] bg-white border-b border-[#e1e3e4] shadow-xs">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={onBack || (() => onNavigate('home'))}
            className="flex items-center justify-center p-2 rounded-full text-[#00685d] hover:bg-[#edeeef] transition-colors active:scale-95 cursor-pointer"
            aria-label="Volver"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            <span
              className="material-symbols-outlined text-[#00685d] text-[28px] md:text-[32px] group-hover:scale-105 transition-transform"
              data-weight="fill"
            >
              volunteer_activism
            </span>
            <span className="text-xl md:text-2xl font-bold text-[#00685d] tracking-tight">
              {title}
            </span>
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-2">
        <button
          onClick={() => onNavigate('home')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            currentTab === 'home'
              ? 'bg-[#008376] text-white shadow-xs'
              : 'text-[#3d4947] hover:bg-[#edeeef]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          Inicio
        </button>

        <button
          onClick={() => onNavigate('buscar')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            currentTab === 'buscar'
              ? 'bg-[#008376] text-white shadow-xs'
              : 'text-[#3d4947] hover:bg-[#edeeef]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
          Buscar
        </button>

        <button
          onClick={() => onNavigate('encontrados')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            currentTab === 'encontrados'
              ? 'bg-[#008376] text-white shadow-xs'
              : 'text-[#3d4947] hover:bg-[#edeeef]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Encontrados
        </button>

        <button
          onClick={() => onNavigate('nn')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            currentTab === 'nn'
              ? 'bg-[#008376] text-white shadow-xs'
              : 'text-[#3d4947] hover:bg-[#edeeef]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          Personas NN
        </button>

        <button
          onClick={() => onNavigate('mapa')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            currentTab === 'mapa'
              ? 'bg-[#008376] text-white shadow-xs'
              : 'text-[#3d4947] hover:bg-[#edeeef]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">map</span>
          Mapa
        </button>

        {FEATURES.aid && (
          <button
            onClick={() => onNavigate('ayuda')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'ayuda'
                ? 'bg-[#008376] text-white shadow-xs'
                : 'text-[#3d4947] hover:bg-[#edeeef]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
            Ayuda
          </button>
        )}

        <button
          onClick={() => onNavigate('reportar')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
            currentTab === 'reportar'
              ? 'bg-[#00685d] text-white'
              : 'bg-[#f4fffb] border border-[#00685d] text-[#00685d] hover:bg-[#00685d] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">add_alert</span>
          Reportar
        </button>
      </nav>

      {/* Mobile Search button */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={onSearchClick || (() => onNavigate('buscar'))}
          className="p-2 rounded-full text-[#00685d] hover:bg-[#edeeef] active:scale-95 transition-all cursor-pointer"
          aria-label="Buscar"
        >
          <span className="material-symbols-outlined text-[24px]">search</span>
        </button>
      </div>
    </header>
  );
};
