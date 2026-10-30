import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <main>
      <nav className="topnav" aria-label="Main">
        <div className="tabs">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/board">Board</NavLink>
          <NavLink to="/tasks">All tasks</NavLink>
        </div>
      </nav>
      <Outlet />
    </main>
  );
}
