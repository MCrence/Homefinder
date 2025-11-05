import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Building2, Calendar, User, LogOut, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Apartments', path: '/apartments', icon: <Building2 size={20} /> },
    { label: 'Appointments', path: '/appointments', icon: <Calendar size={20} /> },
    { label: 'My Profile', path: '/profile', icon: <User size={20} /> },
  ];

  return (
    <>
      {/* Overlay for mobile only */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-300 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-neutral-900 shadow-lg flex flex-col
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-0
        `}
        style={{ maxWidth: '90vw' }}
      >
        <div className="flex items-center gap-3 p-4 border-b border-neutral-700 relative">
          <Home size={24} className="text-white" />
          <h1 className="text-xl font-bold text-white">Home Finder</h1>
          {/* Close button for mobile only */}
          {onClose && (
            <button
              className="absolute right-4 top-4 text-white md:hidden"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X size={24} />
            </button>
          )}
        </div>
        <nav className="mt-6 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-neutral-700 transition-colors text-white ${
                    location.pathname === item.path ? 'bg-neutral-700 border-l-4 border-primary-500' : ''
                  }`}
                  onClick={onClose}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            <li className="mt-8">
              <button
                onClick={() => {
                  logout();
                  if (onClose) onClose();
                }}
                className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-neutral-700 transition-colors text-white"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;