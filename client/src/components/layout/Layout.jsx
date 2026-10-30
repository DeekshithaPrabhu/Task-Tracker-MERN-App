import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <main>
      <nav className="topnav" aria-label="Main">
        <div className="tabs">
          <NavLink to="/" end>Dashboard</NavLink>
        </div>
      </nav>
      <Outlet />
    </main>
  );
}
