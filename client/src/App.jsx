import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import { Login, Register, Forgot, Reset } from './AuthPages.jsx';
import Layout from './Layout.jsx';
import Dashboard from './Dashboard.jsx';
import Board from './Board.jsx';
import Tasks from './Tasks.jsx';
import Profile from './Profile.jsx';
import NotFound from './NotFound.jsx';

function Protected({ children }) {
  const { user, loading, expired } = useAuth(); const loc = useLocation();
  if (loading) return <p className="state">Loading…</p>;
  return user ? children : <Navigate to="/login" replace state={{ from: loc.pathname + loc.search, expired }} />;
}

function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="state">Loading…</p>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Guest><Login /></Guest>} />
        <Route path="/register" element={<Guest><Register /></Guest>} />
        <Route path="/forgot-password" element={<Guest><Forgot /></Guest>} />
        <Route path="/reset-password/:token" element={<Reset />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="board" element={<Board />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
