import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';

// Only for logged-in users; others go to /login and come back afterwards
export function Protected({ children }) {
  const { user, loading } = useAuth(); const loc = useLocation();
  if (loading) return <p className="state">Loading…</p>;
  return user ? children : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}

// Only for logged-out users (login, register ...); logged-in users are sent on
export function Guest({ children }) {
  const { user, loading } = useAuth(); const loc = useLocation();
  if (loading) return <p className="state">Loading…</p>;
  return user ? <Navigate to={loc.state?.from || '/'} replace /> : children;
}
