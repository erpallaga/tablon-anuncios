import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { GridItem, Announcement } from '../types';

interface AppContextType {
  // Estado del panel de administración
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  
  // Elementos de la cuadrícula
  gridItems: GridItem[];
  addGridItem: (item: Omit<GridItem, 'id'>) => void;
  updateGridItem: (id: string, updates: Partial<GridItem>) => void;
  deleteGridItem: (id: string) => void;
  
  // Anuncios
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncement: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Datos iniciales de ejemplo
const initialGridItems: GridItem[] = [
  { id: '1', title: 'Reunión Vida y Ministerio', icon: '📖', pdfUrl: '/pdfs/reunion-vida-ministerio.pdf', order: 1 },
  { id: '2', title: 'Reunión Fin de Semana', icon: '🎤', pdfUrl: '/pdfs/reunion-fin-semana.pdf', order: 2 },
  { id: '3', title: 'Programa de limpieza', icon: '🧹', pdfUrl: '/pdfs/programa-limpieza.pdf', order: 3 },
  { id: '4', title: 'Programa de PPOC', icon: '📅', pdfUrl: '/pdfs/programa-ppoc.pdf', order: 4 },
  { id: '5', title: 'Programa de Salidas', icon: '💼', pdfUrl: '/pdfs/programa-salidas.pdf', order: 5 },
  { id: '6', title: 'Programa de responsabilidades', icon: '📋', pdfUrl: '/pdfs/programa-responsabilidades.pdf', order: 6 },
  { id: '7', title: 'Grupos de Predicación', icon: '👥', pdfUrl: '/pdfs/grupos-predicacion.pdf', order: 7 },
];

const initialAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Recordatorio importante',
    content: 'No olviden traer sus Biblias a las reuniones.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [gridItems, setGridItems] = useState<GridItem[]>(() => {
    // En una aplicación real, aquí cargarías los datos de localStorage o una API
    return initialGridItems;
  });
  
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    // En una aplicación real, aquí cargarías los datos de localStorage o una API
    return initialAnnouncements;
  });

  // Funciones para manejar los elementos de la cuadrícula
  const addGridItem = (item: Omit<GridItem, 'id'>) => {
    setGridItems(prev => {
      const newItem = {
        ...item,
        id: uuidv4(),
        order: item.order !== undefined ? item.order : prev.length > 0 ? Math.max(...prev.map(i => i.order || 0)) + 1 : 0,
      };
      return [...prev, newItem];
    });
  };

  const updateGridItem = (id: string, updates: Partial<GridItem>) => {
    setGridItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      )
    );
  };

  const deleteGridItem = (id: string) => {
    setGridItems(prev => prev.filter(item => item.id !== id));
  };

  // Funciones para manejar los anuncios
  const addAnnouncement = (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'order'>) => {
    const now = new Date().toISOString();
    setAnnouncements(prev => {
      const newOrder = prev.length > 0 ? Math.max(...prev.map(a => a.order || 0)) + 1 : 0;
      return [
        ...prev,
        {
          ...announcement,
          id: uuidv4(),
          isActive: true,
          order: newOrder,
          createdAt: now,
          updatedAt: now,
        },
      ];
    });
  };

  const updateAnnouncement = (id: string, updates: Partial<Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setAnnouncements(prev => {
      const updated = prev.map(announcement =>
        announcement.id === id 
          ? { 
              ...announcement, 
              ...updates, 
              updatedAt: new Date().toISOString() 
            } 
          : announcement
      );
      
      // Si se actualizó el orden, reordenar la lista
      if (updates.order !== undefined) {
        return [...updated].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
      
      return updated;
    });
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements(prev =>
      prev.map(announcement =>
        announcement.id === id
          ? { 
              ...announcement, 
              isActive: !announcement.isActive,
              updatedAt: new Date().toISOString() 
            }
          : announcement
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        isAdmin,
        setIsAdmin,
        gridItems,
        addGridItem,
        updateGridItem,
        deleteGridItem,
        announcements: announcements.filter(a => a.isActive),
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        toggleAnnouncement,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext debe usarse dentro de un AppProvider');
  }
  return context;
}
