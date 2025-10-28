import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  onTitleClick: () => void;
}

export default function Header({ onMenuClick, onTitleClick }: HeaderProps) {
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
          
          {/* Spacer para centrar el título */}
          <div className="w-10"></div>
        </div>
      </div>
    </header>
  );
}
