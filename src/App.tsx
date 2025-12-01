import { useState } from 'react';
import { useAppContext } from './context/AppContext';
import Header from './components/Header';
import Menu from './components/Menu';
import Grid from './components/Grid';
import PDFViewer from './components/PDFViewer';
import PasswordProtection from './components/PasswordProtection';
import type { MenuItem } from './types';

function App() {
  const { announcements, gridItems } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleGoHome = () => {
    setSelectedItem(null);
  };

  return (
    <PasswordProtection>
      <div className="min-h-screen bg-gray-50">
        <Header
          onMenuClick={() => setIsMenuOpen(true)}
          onTitleClick={handleGoHome}
        />

        <Menu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          items={gridItems}
          onItemClick={handleItemClick}
        />

        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Mostrar anuncios activos */}
          {announcements.length > 0 && (
            <div className="mb-4 space-y-3">
              {[...announcements]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map(announcement => (
                  <div
                    key={announcement.id}
                    className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {announcement.title}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line">
                      {announcement.content}
                    </p>
                  </div>
                ))}
            </div>
          )}

          {selectedItem ? (
            <div className="fixed inset-0 z-50">
              <PDFViewer
                pdfUrl={selectedItem.pdfUrl}
                title={selectedItem.title}
                icon={selectedItem.icon}
                onClose={handleGoHome}
              />
            </div>
          ) : (
            <Grid items={gridItems} onItemClick={handleItemClick} />
          )}
        </main>
      </div>
    </PasswordProtection>
  );
}

export default App;
