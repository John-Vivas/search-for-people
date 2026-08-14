import React, { useState } from 'react';

/**
 * Protege el panel de moderación con una clave (VITE_ADMIN_PIN).
 * Provisional hasta el login real (Fase 8): NO es seguridad fuerte — un PIN en
 * el front solo controla la UI (queda visible en el bundle), no el acceso a la
 * BD. La clave NO se guarda en el código: se define en VITE_ADMIN_PIN (Vercel /
 * .env.local). Si no está configurada, el panel queda CERRADO (fail-closed).
 */
const ADMIN_PIN = (import.meta.env.VITE_ADMIN_PIN ?? '').toString();
const SESSION_KEY = 'estamos_buscando_admin_ok';

export const AdminGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  // Fail-closed: sin clave configurada no se abre el panel.
  if (!ADMIN_PIN) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-[#e1e3e4] shadow-sm p-6">
          <span className="material-symbols-outlined text-[#8e711f] text-[40px] mb-2">lock</span>
          <h1 className="text-lg font-bold text-[#191c1d] mb-1">Panel no configurado</h1>
          <p className="text-xs text-[#6d7a77]">
            Define <code className="font-mono">VITE_ADMIN_PIN</code> para habilitar el acceso.
          </p>
        </div>
      </div>
    );
  }

  if (authed) return <>{children}</>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setAuthed(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border border-[#e1e3e4] shadow-sm p-6 text-center">
        <span className="material-symbols-outlined text-[#00685d] text-[40px] mb-2">lock</span>
        <h1 className="text-lg font-bold text-[#191c1d] mb-1">Panel de moderación</h1>
        <p className="text-xs text-[#6d7a77] mb-4">Ingresa la clave para continuar.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            placeholder="Clave"
            autoFocus
            className="w-full h-11 px-3 rounded-xl border-2 border-[#e1e3e4] focus:border-[#00685d] focus:outline-none text-sm text-center tracking-widest"
          />
          {error && <p className="text-xs text-[#ba1a1a]">Clave incorrecta.</p>}
          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors cursor-pointer"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};
