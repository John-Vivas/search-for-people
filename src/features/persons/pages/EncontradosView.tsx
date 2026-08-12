import React, { useState, useMemo } from 'react';
import { PersonItem } from '../types/person';
import { ListEmptyState } from '../../../components/common/AsyncListState';

interface EncontradosViewProps {
  items: PersonItem[];
  onSelectPerson: (person: PersonItem) => void;
}

export const EncontradosView: React.FC<EncontradosViewProps> = ({ items, onSelectPerson }) => {
  const [subFilter, setSubFilter] = useState<'todos' | 'identificados' | 'nn'>('identificados');

  const encontrados = useMemo(() => {
    return items.filter((item) => {
      if (subFilter === 'identificados') {
        return item.type === 'encontrado';
      }
      if (subFilter === 'nn') {
        return item.type === 'nn';
      }
      return item.type === 'encontrado' || item.type === 'nn';
    });
  }, [items, subFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-12 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#191c1d] mb-1">
          Personas Encontradas
        </h1>
        <p className="text-sm text-[#3d4947]">
          Listado de personas que han sido localizadas y se encuentran recibiendo atención en albergues o centros de salud.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSubFilter('todos')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              subFilter === 'todos'
                ? 'bg-[#008376] text-white font-bold'
                : 'bg-white border border-[#bcc9c6] text-[#3d4947] hover:bg-[#f3f4f5]'
            }`}
          >
            Todos
          </button>

          <button
            onClick={() => setSubFilter('identificados')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              subFilter === 'identificados'
                ? 'bg-[#2A9D8F] text-white shadow-xs'
                : 'bg-[#E6F4F1] border border-[#2A9D8F] text-[#2A9D8F] hover:bg-[#2A9D8F] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" data-weight="fill">
              check_circle
            </span>
            Identificados
          </button>

          <button
            onClick={() => setSubFilter('nn')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              subFilter === 'nn'
                ? 'bg-[#436370] text-white font-bold'
                : 'bg-white border border-[#bcc9c6] text-[#3d4947] hover:bg-[#f3f4f5]'
            }`}
          >
            Sin Identificar (NN)
          </button>
        </div>
      </div>

      {/* List / Grid of Found Persons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {encontrados.length === 0 ? (
          <div className="col-span-full">
            <ListEmptyState
              title="No hay personas encontradas registradas"
              description="Los casos de personas localizadas aparecerán aquí cuando estén en la base de datos."
            />
          </div>
        ) : (
          encontrados.map((item) => (
          <article
            key={item.id}
            onClick={() => onSelectPerson(item)}
            className="bg-white rounded-xl overflow-hidden flex flex-col md:flex-row border border-[#e1e3e4] shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-full md:w-2/5 h-48 md:h-auto relative bg-[#e7e8e9] shrink-0">
              <img
                src={item.photo}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div
                className={`absolute top-2 left-2 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-xs ${
                  item.type === 'encontrado'
                    ? 'bg-[#E6F4F1] text-[#2A9D8F]'
                    : 'bg-[#f3f4f5] text-[#6d7a77] border border-[#bcc9c6]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]" data-weight="fill">
                  {item.type === 'encontrado' ? 'check_circle' : 'help'}
                </span>
                {item.type === 'encontrado' ? 'Encontrado' : 'Sin Identificar (NN)'}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#191c1d] group-hover:text-[#00685d] transition-colors mb-1">
                  {item.name}
                </h3>
                <p className="text-xs text-[#3d4947] mb-3">
                  {item.age} {item.clothing ? `• ${item.clothing}` : ''}
                </p>

                {item.hospitalOrRefuge && (
                  <div className="flex items-start gap-2 text-xs font-semibold text-[#436370] mb-2">
                    <span className="material-symbols-outlined text-[18px] mt-0.5 text-[#00685d]">
                      local_hospital
                    </span>
                    <span>
                      {item.hospitalOrRefuge}
                      <br />
                      <span className="text-[11px] font-normal text-[#6d7a77]">
                        {item.location}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2 border-t border-[#e1e3e4] flex justify-between items-center text-xs text-[#6d7a77]">
                <span>Actualizado: {item.updatedAt}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.share) {
                      navigator.share({
                        title: `Persona Encontrada: ${item.name}`,
                        text: `Persona encontrada en ${item.location}: ${item.name}`,
                        url: window.location.href,
                      });
                    }
                  }}
                  className="text-[#00685d] hover:bg-[#f3f4f5] p-1.5 rounded-full transition-colors cursor-pointer"
                  aria-label="Compartir"
                >
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </button>
              </div>
            </div>
          </article>
          ))
        )}
      </div>
    </div>
  );
};
