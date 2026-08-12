import React from 'react';

interface ListLoadingStateProps {
  message?: string;
}

export function ListLoadingState({
  message = 'Cargando información...',
}: ListLoadingStateProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-fade-in">
      <span className="material-symbols-outlined text-[48px] text-[#00685d] animate-pulse">
        hourglass_empty
      </span>
      <p className="mt-4 text-sm font-semibold text-[#3d4947]">{message}</p>
    </div>
  );
}

interface ListErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ListErrorState({
  message = 'No fue posible cargar la información. Intenta de nuevo.',
  onRetry,
}: ListErrorStateProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
      <span className="material-symbols-outlined text-[48px] text-[#ba1a1a] mb-2">
        error
      </span>
      <h3 className="text-lg font-bold text-[#191c1d] mb-2">Error al cargar</h3>
      <p className="text-sm text-[#3d4947] mb-6">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-2.5 bg-[#00685d] text-white text-xs font-bold rounded-full hover:bg-[#008376] transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

interface ListEmptyStateProps {
  title: string;
  description?: string;
}

export function ListEmptyState({ title, description }: ListEmptyStateProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center bg-white rounded-2xl border border-[#e1e3e4] my-8">
      <span className="material-symbols-outlined text-[48px] text-[#6d7a77] mb-2">
        person_off
      </span>
      <h3 className="text-lg font-bold text-[#191c1d] mb-1">{title}</h3>
      {description && <p className="text-xs text-[#3d4947]">{description}</p>}
    </div>
  );
}
