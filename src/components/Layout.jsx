import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Map as MapIcon, ClipboardList, User, Briefcase } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const getActiveIndex = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path.startsWith('/map')) return 1;
    if (path.startsWith('/reports')) return 2;
    if (path.startsWith('/profile')) return 3;
    return 0;
  };

  const activeIndex = getActiveIndex();
  const isStaff = localStorage.getItem('userRole') === 'staff';

  return (
    <div className="mobile-app-container">
      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav" style={{ "--active-index": activeIndex }}>
        <div className="nav-slider"></div>
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={24} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MapIcon size={24} />
          <span>Map</span>
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ClipboardList size={24} />
          <span>Reports</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={24} />
          <span>Profile</span>
        </NavLink>
        {isStaff && (
          <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Briefcase size={24} />
            <span>Staff</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
};

export default Layout;
