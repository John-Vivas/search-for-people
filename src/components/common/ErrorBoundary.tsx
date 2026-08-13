import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback; defaults to a friendly full-screen message. */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render errors anywhere below it so a single failing component doesn't
 * blank the whole app. Shows a recoverable message with a reload action.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Keep a trace for diagnostics; swap for a real reporter later.
    console.error('[ErrorBoundary]', error);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#e1e3e4] shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-[36px]">error</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#191c1d] mb-2">Algo salió mal</h1>
          <p className="text-sm text-[#3d4947] mb-6">
            Ocurrió un error inesperado en la aplicación. Puedes recargar para volver a intentarlo.
            Si el problema persiste, comunícate con el equipo.
          </p>
          <button
            onClick={this.handleReload}
            className="h-12 px-6 bg-[#00685d] text-white font-bold text-sm rounded-full hover:bg-[#008376] transition-colors cursor-pointer"
          >
            Recargar la aplicación
          </button>
        </div>
      </div>
    );
  }
}
