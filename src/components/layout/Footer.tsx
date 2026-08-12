import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#e1e3e4] py-8 px-4 text-center text-xs text-[#6d7a77] mb-16 md:mb-0">
      <div className="max-w-5xl mx-auto space-y-3">
        <div className="flex items-center justify-center gap-2 text-[#00685d] font-bold text-sm">
          <span className="material-symbols-outlined text-[20px]" data-weight="fill">
            volunteer_activism
          </span>
          <span>Estamos Buscando</span>
        </div>
        <p>
          Plataforma comunitaria e independiente de búsqueda de personas desaparecidas, encontradas, NN y mascotas.
        </p>
        <p className="text-[11px] text-[#8e711f]">
          En caso de emergencia con riesgo inminente, comunícate siempre con la línea oficial 123 (Policía Nacional) o la Fiscalía General de la Nación.
        </p>
        <div className="pt-2 text-[10px] text-[#bcc9c6]">
          © {new Date().getFullYear()} Estamos Buscando • Red Comunitarias de Apoyo
        </div>
      </div>
    </footer>
  );
};
