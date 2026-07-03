import { useState, useRef, useEffect } from 'react';
import { Menu, UserCircle, Settings, LogOut } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
  onTitleClick: () => void;
  onAdminClick: () => void;
}

export default function Header({ onMenuClick, onTitleClick, onAdminClick }: HeaderProps) {
  const { profile, userRole, signOut } = useAuthContext();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdminClick = () => {
    setIsProfileOpen(false);
    onAdminClick();
  };

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await signOut();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 active:scale-95"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          <button
            onClick={onTitleClick}
            className="flex-1 text-center hover:opacity-80 transition-opacity duration-150"
          >
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
              Tablón de Anuncios
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Congregación Sarrià-Les Corts
            </p>
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 active:scale-95"
              aria-label="Menú de usuario"
            >
              <UserCircle className="w-6 h-6 text-gray-700" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {profile?.displayName || profile?.email}
                  </p>
                </div>

                {(userRole === 'admin' || userRole === 'editor') && (
                  <button
                    onClick={handleAdminClick}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    Panel de administración
                  </button>
                )}

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
