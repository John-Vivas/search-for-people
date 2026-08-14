import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { phoneAuthService } from '@/src/features/phone-auth/services/phoneAuth.service';

interface PhoneSessionContextValue {
  /** The verified phone behind the current session, or null if logged out. */
  phone: string | null;
  /** True while the initial session check (GET /phone-sessions/me) is in flight. */
  loading: boolean;
  isLoggedIn: boolean;
  /** Re-checks the session against the backend (e.g. after it may have expired). */
  refresh: () => Promise<void>;
  /** Called by PhoneLoginModal right after a successful OTP login. */
  setPhone: (phone: string) => void;
  logout: () => Promise<void>;
}

const PhoneSessionContext = createContext<PhoneSessionContextValue | null>(null);

export const PhoneSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phone, setPhoneState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await phoneAuthService.me();
    setPhoneState(res.data?.phone ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await phoneAuthService.logout();
    setPhoneState(null);
  }, []);

  const setPhone = useCallback((value: string) => setPhoneState(value), []);

  return (
    <PhoneSessionContext.Provider
      value={{ phone, loading, isLoggedIn: phone !== null, refresh, setPhone, logout }}
    >
      {children}
    </PhoneSessionContext.Provider>
  );
};

export function usePhoneSession(): PhoneSessionContextValue {
  const ctx = useContext(PhoneSessionContext);
  if (!ctx) throw new Error('usePhoneSession debe usarse dentro de <PhoneSessionProvider>');
  return ctx;
}
