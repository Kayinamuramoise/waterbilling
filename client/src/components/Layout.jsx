import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Droplet, LayoutDashboard, Users, Activity, FileText, LogOut } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/customers', label: 'Customers', icon: <Users size={20} /> },
    { path: '/meters', label: 'Meter Readings', icon: <Activity size={20} /> },
    { path: '/bills', label: 'Bills & Reports', icon: <FileText size={20} /> },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Droplet color="var(--primary-color)" size={28} />
          <span>KigaliWater</span>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
