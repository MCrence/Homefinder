import React from 'react';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = React.useState(false);

  // Toggle dark mode (example feature)
  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          {/* Removed search input */}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Dark mode toggle button */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={handleToggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary-500"></span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
              {user?.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;