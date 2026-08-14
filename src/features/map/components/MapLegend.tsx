import React from 'react';

export const MapLegend: React.FC = () => (
  <div
    className="bg-white/95 backdrop-blur-md rounded-xl border border-[#e1e3e4] p-3 shadow-sm"
    aria-label="Leyenda del mapa"
  >
    <p className="text-[10px] font-bold uppercase tracking-wide text-[#6d7a77] mb-2">
      Leyenda
    </p>
    <ul className="space-y-1.5">
      {[
        { color: '#ba1a1a', icon: 'person_alert', text: 'Desaparecido' },
        { color: '#00685d', icon: 'person', text: 'Encontrado' },
        { color: '#8e711f', icon: 'person_search', text: 'Sin identificar' },
        { color: '#735802', icon: 'pets', text: 'Mascota' },
        { color: '#436370', icon: 'local_hospital', text: 'Centro de atención' },
      ].map((item) => (
        <li key={item.text} className="flex items-center gap-2 text-xs text-[#3d4947]">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: item.color }}
          >
            <span className="material-symbols-outlined text-white text-[14px]">{item.icon}</span>
          </span>
          {item.text}
        </li>
      ))}
    </ul>
  </div>
);
