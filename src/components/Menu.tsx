import { X } from 'lucide-react';
import type { MenuItem } from '../types';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export default function Menu({ isOpen, onClose, items, onItemClick }: MenuProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Menú lateral */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header del menú */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Menú</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 active:scale-95"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          
          {/* Lista de items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onItemClick(item);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-150 active:scale-98 text-left"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-gray-700 font-medium">{item.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
