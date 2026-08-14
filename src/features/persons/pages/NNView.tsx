import React, { useState } from 'react';
import { PersonItem } from '@/src/features/persons/types/person';
import { ListEmptyState } from '@/src/components/common/AsyncListState';

interface NNViewProps {
  items: PersonItem[];
  onIdentifyPerson: (item: PersonItem) => void;
}

export const NNView: React.FC<NNViewProps> = ({ items, onIdentifyPerson }) => {
  const [filterGender, setFilterCity] = useState<'todos' | 'masculino' | 'femenino' | 'tatuaje'>('todos');

  const nnList = items.filter((i) => {
    if (i.type !== 'nn') return false;
    if (filterGender === 'masculino') return i.gender === 'Masculino';
    if (filterGender === 'femenino') return i.gender === 'Femenino';
    if (filterGender === 'tatuaje') return !!i.tattoo;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-12 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1d] mb-2">
          Personas Sin Identificar
        </h1>
        <p className="text-sm text-[#3d4947] max-w-2xl leading-relaxed">
          Ayúdanos a identificar a estas personas. Revisa las características físicas, ropa o tatuajes. Si reconoces a alguien, haz clic en el botón de la tarjeta.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        <button
          onClick={() => setFilterCity('todos')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filterGender === 'todos'
              ? 'bg-[#436370] text-white shadow-xs'
              : 'border border-[#bcc9c6] text-[#191c1d] hover:bg-[#f3f4f5]'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterCity('masculino')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filterGender === 'masculino'
              ? 'bg-[#008376] text-white shadow-xs'
              : 'border border-[#bcc9c6] text-[#191c1d] hover:bg-[#f3f4f5]'
          }`}
        >
          Hombres
        </button>
        <button
          onClick={() => setFilterCity('femenino')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filterGender === 'femenino'
              ? 'bg-[#008376] text-white shadow-xs'
              : 'border border-[#bcc9c6] text-[#191c1d] hover:bg-[#f3f4f5]'
          }`}
        >
          Mujeres
        </button>
        <button
          onClick={() => setFilterCity('tatuaje')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filterGender === 'tatuaje'
              ? 'bg-[#8e711f] text-white shadow-xs'
              : 'border border-[#bcc9c6] text-[#191c1d] hover:bg-[#f3f4f5]'
          }`}
        >
          Con Tatuajes
        </button>
      </div>

      {/* Grid for NN Persons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nnList.length === 0 ? (
          <div className="col-span-full">
            <ListEmptyState
              title="No hay personas sin identificar registradas"
              description="Estos casos aparecerán aquí para que la comunidad ayude a identificarlos."
            />
          </div>
        ) : (
          nnList.map((nn) => (
          <article
            key={nn.id}
            className="bg-white rounded-xl overflow-hidden shadow-xs border border-[#e1e3e4] flex flex-col group hover:shadow-md transition-shadow duration-300"
          >
            <div className="relative aspect-square md:aspect-[4/3] w-full overflow-hidden bg-[#d9dadb]">
              <img
                src={nn.photo}
                alt={nn.name}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-[#ba1a1a] text-white px-3 py-1 rounded-full text-xs font-bold shadow-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">help</span>
                {nn.code}
              </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
              <div className="mb-3">
                <p className="text-[11px] font-bold text-[#6d7a77] uppercase tracking-wider mb-1">
                  Encontrado en: {nn.location}
                </p>
                <h3 className="text-xl font-bold text-[#191c1d]">{nn.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-5 text-sm text-[#3d4947] flex-grow">
                {nn.skinColor && (
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#191c1d]">Tez:</span> {nn.skinColor}
                  </div>
                )}
                {nn.hairColor && (
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#191c1d]">Cabello:</span> {nn.hairColor}
                  </div>
                )}
                {(nn.tattoo || nn.distinctiveFeatures) && (
                  <div className="flex flex-col col-span-2">
                    <span className="text-xs font-bold text-[#191c1d]">Seña particular:</span>{' '}
                    {nn.tattoo || nn.distinctiveFeatures}
                  </div>
                )}
                {nn.clothing && (
                  <div className="flex flex-col col-span-2">
                    <span className="text-xs font-bold text-[#191c1d]">Vestimenta:</span>{' '}
                    {nn.clothing}
                  </div>
                )}
              </div>

              <button
                onClick={() => onIdentifyPerson(nn)}
                className="w-full bg-[#00685d] text-white py-3 rounded-lg text-xs font-bold hover:bg-[#008376] transition-colors flex justify-center items-center gap-2 active:scale-98 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                ¿Reconoces a esta persona?
              </button>
            </div>
          </article>
          ))
        )}
      </div>
    </div>
  );
};
