import { useState } from 'react';
import Header from './components/Header';
import Menu from './components/Menu';
import Grid from './components/Grid';
import type { MenuItem } from './types';

// Datos mock temporales
const mockItems: MenuItem[] = [
  { id: '1', title: 'Reunión Vida y Ministerio', icon: '📖', pdfUrl: '/pdfs/reunion-vida-ministerio.pdf' },
  { id: '2', title: 'Reunión Fin de Semana', icon: '🎤', pdfUrl: '/pdfs/reunion-fin-semana.pdf' },
  { id: '3', title: 'Programa de limpieza', icon: '🧹', pdfUrl: '/pdfs/programa-limpieza.pdf' },
  { id: '4', title: 'Programa de PPOC', icon: '📅', pdfUrl: '/pdfs/programa-ppoc.pdf' },
  { id: '5', title: 'Programa de Salidas', icon: '💼', pdfUrl: '/pdfs/programa-salidas.pdf' },
  { id: '6', title: 'Programa de responsabilidades', icon: '📋', pdfUrl: '/pdfs/programa-responsabilidades.pdf' },
  { id: '7', title: 'Grupos de Predicación', icon: '👥', pdfUrl: '/pdfs/grupos-predicacion.pdf' },
];

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    // En el Milestone 3 implementaremos el visor de PDFs
    console.log('Item seleccionado:', item);
  };

  const handleGoHome = () => {
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={() => setIsMenuOpen(true)} 
        onTitleClick={handleGoHome}
      />
      
      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        items={mockItems}
        onItemClick={handleItemClick}
      />

      {selectedItem ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <span className="text-6xl mb-4 block">{selectedItem.icon}</span>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {selectedItem.title}
            </h2>
            <p className="text-gray-600 mb-4">
              Visor de PDF - Próximamente en Milestone 3
            </p>
            <button
              onClick={handleGoHome}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 active:scale-95"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      ) : (
        <Grid items={mockItems} onItemClick={handleItemClick} />
      )}
    </div>
  );
}

export default App;
