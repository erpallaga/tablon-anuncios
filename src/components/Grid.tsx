import { useState } from 'react';
import type { MenuItem } from '../types';
import AdminModal from './AdminModal';

interface GridProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export default function Grid({ items, onItemClick }: GridProps) {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Contraseña de administración (en producción, esto debería estar en una variable de entorno)
  const ADMIN_PASSWORD = 'admin123';

  const handleAdminClick = () => {
    setIsAdminOpen(true);
  };

  const handleAdminClose = () => {
    setIsAdminOpen(false);
  };

  const handleAuthenticate = (password: string) => {
    return password === ADMIN_PASSWORD;
  };
  // Ordenar los elementos por la propiedad 'order'
  const sortedItems = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {sortedItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 border border-gray-100 hover:border-gray-200"
          >
            <span className="text-4xl sm:text-5xl">{item.icon}</span>
            <span className="text-sm sm:text-base font-medium text-gray-700 text-center">
              {item.title}
            </span>
          </button>
        ))}
        
        {/* Botón de administración */}
        <button
          onClick={handleAdminClick}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 border border-gray-100 hover:border-gray-200"
          title="Administrar documentos"
        >
          <span className="text-4xl sm:text-5xl">⚙️</span>
          <span className="text-sm sm:text-base font-medium text-gray-700 text-center">
            Administrar
          </span>
        </button>
      </div>

      {/* Modal de administración */}
      <AdminModal 
        isOpen={isAdminOpen}
        onClose={handleAdminClose}
        onAuthenticate={handleAuthenticate}
      />
    </main>
  );
}
