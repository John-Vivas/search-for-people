import React from 'react';

interface BottomNavBarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-[#e1e3e4] md:hidden shadow-lg">
      <div className="grid grid-cols-5 h-16">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentTab === 'home' ? 'text-[#00685d] font-bold' : 'text-[#6d7a77]'
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            data-weight={currentTab === 'home' ? 'fill' : 'normal'}
          >
            home
          </span>
          <span className="text-[10px]">Inicio</span>
        </button>

        <button
          onClick={() => onNavigate('buscar')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentTab === 'buscar' ? 'text-[#00685d] font-bold' : 'text-[#6d7a77]'
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            data-weight={currentTab === 'buscar' ? 'fill' : 'normal'}
          >
            search
          </span>
          <span className="text-[10px]">Buscar</span>
        </button>

        <button
          onClick={() => onNavigate('reportar')}
          className="flex flex-col items-center justify-center gap-1 -mt-4"
        >
          <div className="w-12 h-12 rounded-full bg-[#00685d] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform border-2 border-white">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </div>
          <span className="text-[10px] text-[#00685d] font-bold">Reportar</span>
        </button>

        <button
          onClick={() => onNavigate('mapa')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentTab === 'mapa' ? 'text-[#00685d] font-bold' : 'text-[#6d7a77]'
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            data-weight={currentTab === 'mapa' ? 'fill' : 'normal'}
          >
            map
          </span>
          <span className="text-[10px]">Mapa</span>
        </button>

        <button
          onClick={() => onNavigate('admin')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentTab.startsWith('admin') ? 'text-[#00685d] font-bold' : 'text-[#6d7a77]'
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            data-weight={currentTab.startsWith('admin') ? 'fill' : 'normal'}
          >
            admin_panel_settings
          </span>
          <span className="text-[10px]">Admin</span>
        </button>
      </div>
    </nav>
  );
};
