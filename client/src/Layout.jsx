import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { api } from './api.js';

const THEMES = ['system', 'light', 'dark'];

export default function Layout() {
  const { user, setUser, logout } = useAuth();
  const nav = useNavigate();
  const cycleTheme = () => {
    const theme = THEMES[(THEMES.indexOf(user.theme) + 1) % THEMES.length];
    setUser({ ...user, theme });
    api.profile({ theme }).catch(() => {});
  };
  return (
    <main>
      <nav className="topnav" aria-label="Main">
        <div className="tabs">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/board">Board</NavLink>
          <NavLink to="/tasks">All tasks</NavLink>
        </div>
        <div className="usermenu">
          <button className="ghost small" onClick={cycleTheme} title="Switch between system, light and dark">Theme: {user.theme}</button>
          <NavLink to="/profile" className="who">{user.name}</NavLink>
          <button className="ghost small" onClick={async () => { await logout(); nav('/login'); }}>Log out</button>
        </div>
      </nav>
      <Outlet />
    </main>
  );
}
