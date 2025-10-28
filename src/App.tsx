import { useState } from 'react';
import Header from './components/Header';
import Menu from './components/Menu';
import Grid from './components/Grid';
import PDFViewer from './components/PDFViewer';
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
        <PDFViewer
          pdfUrl={selectedItem.pdfUrl || ''}
          title={selectedItem.title}
          icon={selectedItem.icon}
          onClose={handleGoHome}
        />
      ) : (
        <Grid items={mockItems} onItemClick={handleItemClick} />
      )}
    </div>
  );
}

export default App;
