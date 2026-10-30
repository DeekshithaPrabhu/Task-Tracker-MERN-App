import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '@/api';
import { applyTheme } from '@/utils';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false); // true when a session ended on its own
  const userRef = useRef(null);
  userRef.current = user;

  const setUser = (u) => { setUserState(u); if (u) { applyTheme(u.theme); setExpired(false); } };

  useEffect(() => {
    api.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
    // Ignore late 401s that arrive after an explicit log out
    const onExpired = () => { if (userRef.current) { setUserState(null); setExpired(true); } };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const value = {
    user, loading, expired, setUser,
    login: async (b) => setUser(await api.login(b)),
    register: async (b) => setUser(await api.register(b)),
    logout: async () => { await api.logout().catch(() => {}); setUserState(null); setExpired(false); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
