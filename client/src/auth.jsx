import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';
import { applyTheme } from './utils.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const setUser = (u) => { setUserState(u); if (u) applyTheme(u.theme); };

  useEffect(() => {
    api.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
    const expired = () => setUserState(null);
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, []);

  const value = {
    user, loading, setUser,
    login: async (b) => setUser(await api.login(b)),
    register: async (b) => setUser(await api.register(b)),
    logout: async () => { await api.logout().catch(() => {}); setUserState(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
