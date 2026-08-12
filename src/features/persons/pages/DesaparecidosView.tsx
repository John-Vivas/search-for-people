import React, { useState } from 'react';
import { PersonItem } from '../types/person';
import { PersonCard } from '../components/PersonCard';

interface DesaparecidosViewProps {
  items: PersonItem[];
  onSelectPerson: (person: PersonItem) => void;
  onNavigateReport: () => void;
}

export const DesaparecidosView: React.FC<DesaparecidosViewProps> = ({
  items,
  onSelectPerson,
  onNavigateReport
}) => {
  const [filterCity, setFilterCity] = useState('todas');

  const desaparecidos = items.filter(
    (i) => i.type === 'desaparecido' && (filterCity === 'todas' || i.city === filterCity)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-12 animate-fade-in relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1d]">
            Personas Desaparecidas
          </h1>
          <p className="text-xs md:text-sm text-[#3d4947] mt-1">
            Listado urgente de búsquedas activas en la comunidad.
          </p>
        </div>

        <button
          onClick={() => {
            const cities = ['todas', 'Bogotá', 'Cali', 'Medellín'];
            const nextIdx = (cities.indexOf(filterCity) + 1) % cities.length;
            setFilterCity(cities[nextIdx]);
          }}
          className="px-4 py-2 border-2 border-[#6d7a77] rounded-full text-xs font-bold text-[#436370] flex items-center gap-1.5 hover:bg-[#f3f4f5] transition-colors shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          {filterCity === 'todas' ? 'Filtros' : filterCity}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {desaparecidos.map((person) => (
          <PersonCard
            key={person.id}
            item={person}
            onSelect={onSelectPerson}
            layout="horizontal"
          />
        ))}
      </div>

      {/* Floating Action Button (FAB) for reporting */}
      <button
        onClick={onNavigateReport}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-[#00685d] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#008376] hover:scale-105 active:scale-95 transition-all z-40 group cursor-pointer"
        title="Reportar información de desaparecido"
      >
        <span className="material-symbols-outlined text-[28px] group-hover:rotate-12 transition-transform">
          add_alert
        </span>
      </button>
    </div>
  );
};
