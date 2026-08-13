import React, { useState, useMemo } from 'react';
import { PersonItem } from '@/src/features/persons/types/person';
import { PersonCard } from '@/src/features/persons/components/PersonCard';

interface SearchViewProps {
  items: PersonItem[];
  initialFilter?: string;
  onSelectPerson: (person: PersonItem) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  items,
  initialFilter = 'todos',
  onSelectPerson
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>(initialFilter);
  const [selectedZone, setSelectedZone] = useState<string>('todas');
  const [visibleCount, setVisibleCount] = useState(8);

  // Extract unique cities/zones for filter dropdown
  const zones = useMemo(() => {
    const unique = Array.from(new Set(items.map((i) => i.city)));
    return ['todas', ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type filter
      if (selectedType !== 'todos' && item.type !== selectedType) {
        return false;
      }
      // Zone filter
      if (selectedZone !== 'todas' && item.city !== selectedZone) {
        return false;
      }
      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesLocation = item.location.toLowerCase().includes(q);
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesCity = item.city.toLowerCase().includes(q);
        const matchesDesc = (item.additionalDetails || '').toLowerCase().includes(q);
        const matchesTattoo = (item.tattoo || '').toLowerCase().includes(q);
        return matchesName || matchesLocation || matchesCode || matchesCity || matchesDesc || matchesTattoo;
      }
      return true;
    });
  }, [items, selectedType, selectedZone, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-12 animate-fade-in">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1d]">
          Búsqueda de Personas y Mascotas
        </h1>
        <p className="text-sm text-[#3d4947] mt-1">
          Utiliza los filtros o busca palabras clave para ubicar registros.
        </p>
      </div>

      {/* Search and Filters Section */}
      <section className="mb-8 bg-white p-4 rounded-2xl border border-[#e1e3e4] shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6d7a77]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre, zona, código o palabras clave..."
              className="w-full h-12 pl-11 pr-4 bg-[#f8f9fa] border border-[#bcc9c6] rounded-xl text-sm font-medium text-[#191c1d] focus:border-[#00685d] focus:ring-1 focus:ring-[#00685d] outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto hide-scrollbar">
            {/* Zone Filter */}
            <div className="relative shrink-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a77] text-[20px]">
                location_on
              </span>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="h-12 pl-10 pr-8 bg-[#f8f9fa] border border-[#bcc9c6] rounded-xl text-xs md:text-sm font-semibold text-[#3d4947] cursor-pointer appearance-none outline-none focus:border-[#00685d]"
              >
                <option value="todas">Todas las Zonas</option>
                {zones.filter((z) => z !== 'todas').map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar border-t border-[#e1e3e4] pt-3">
          <button
            onClick={() => setSelectedType('todos')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedType === 'todos'
                ? 'bg-[#008376] text-white shadow-xs'
                : 'border border-[#bcc9c6] text-[#3d4947] hover:bg-[#f3f4f5]'
            }`}
          >
            Todos ({items.length})
          </button>

          <button
            onClick={() => setSelectedType('desaparecido')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              selectedType === 'desaparecido'
                ? 'bg-[#ba1a1a] text-white shadow-xs'
                : 'border border-[#bcc9c6] text-[#3d4947] hover:bg-[#f3f4f5]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Desaparecidos ({items.filter((i) => i.type === 'desaparecido').length})
          </button>

          <button
            onClick={() => setSelectedType('encontrado')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              selectedType === 'encontrado'
                ? 'bg-[#00685d] text-white shadow-xs'
                : 'border border-[#bcc9c6] text-[#3d4947] hover:bg-[#f3f4f5]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Encontrados ({items.filter((i) => i.type === 'encontrado').length})
          </button>

          <button
            onClick={() => setSelectedType('nn')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              selectedType === 'nn'
                ? 'bg-[#8e711f] text-white shadow-xs'
                : 'border border-[#bcc9c6] text-[#3d4947] hover:bg-[#f3f4f5]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">help</span>
            NN ({items.filter((i) => i.type === 'nn').length})
          </button>

          <button
            onClick={() => setSelectedType('mascota')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              selectedType === 'mascota'
                ? 'bg-[#735802] text-white shadow-xs'
                : 'border border-[#bcc9c6] text-[#3d4947] hover:bg-[#f3f4f5]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">pets</span>
            Mascotas ({items.filter((i) => i.type === 'mascota').length})
          </button>
        </div>
      </section>

      {/* Results Count Summary */}
      <div className="flex justify-between items-center mb-4 px-1">
        <span className="text-xs font-bold text-[#6d7a77]">
          Mostrando {filteredItems.slice(0, visibleCount).length} de {filteredItems.length} resultados
        </span>
      </div>

      {/* Grid of Results */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#e1e3e4] max-w-md mx-auto my-8">
          <span className="material-symbols-outlined text-[48px] text-[#6d7a77] mb-2">
            search_off
          </span>
          <h3 className="text-lg font-bold text-[#191c1d] mb-1">
            No se encontraron coincidencias
          </h3>
          <p className="text-xs text-[#3d4947] mb-4">
            Intenta cambiar los términos de búsqueda o ajustar los filtros de zona y categoría.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('todos');
              setSelectedZone('todas');
            }}
            className="px-6 py-2.5 bg-[#00685d] text-white text-xs font-bold rounded-full hover:bg-[#008376] transition-colors cursor-pointer"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.slice(0, visibleCount).map((item) => (
            <PersonCard key={item.id} item={item} onSelect={onSelectPerson} />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {visibleCount < filteredItems.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 8)}
            className="h-12 px-8 bg-white border border-[#bcc9c6] text-[#191c1d] font-bold text-xs rounded-full hover:bg-[#f3f4f5] transition-colors shadow-xs cursor-pointer"
          >
            Cargar más resultados
          </button>
        </div>
      )}
    </div>
  );
};
