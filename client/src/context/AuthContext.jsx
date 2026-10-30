import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/api';
import { applyTheme } from '@/utils';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const setUser = (u) => { setUserState(u); if (u) applyTheme(u.theme); };

  useEffect(() => {
    api.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
    // A 401 from any request means the session ended
    const onExpired = () => setUserState(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const value = {
    user, loading, setUser,
    login: async (b) => setUser(await api.login(b)),
    register: async (b) => setUser(await api.register(b)),
    logout: async () => { await api.logout().catch(() => {}); setUserState(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
