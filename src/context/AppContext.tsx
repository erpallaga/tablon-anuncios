import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { GridItem, Announcement } from '../types';
import { gridItemsService, announcementsService } from '../lib/supabase/database';

interface AppContextType {
  // Estado del panel de administración
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  
  // Elementos de la cuadrícula
  gridItems: GridItem[];
  addGridItem: (item: Omit<GridItem, 'id'>) => Promise<void>;
  updateGridItem: (id: string, updates: Partial<GridItem>) => Promise<void>;
  deleteGridItem: (id: string) => Promise<void>;
  
  // Anuncios (activos para mostrar, todos para admin)
  announcements: Announcement[]; // Solo activos
  allAnnouncements: Announcement[]; // Todos (para admin panel)
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => Promise<void>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  toggleAnnouncement: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [items, announcements] = await Promise.all([
        gridItemsService.getAll(),
        announcementsService.getAll(),
      ]);
      setGridItems(items);
      setAllAnnouncements(announcements);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar los elementos de la cuadrícula
  const addGridItem = async (item: Omit<GridItem, 'id'>) => {
    try {
      const newOrder = gridItems.length > 0 ? Math.max(...gridItems.map(i => i.order || 0)) + 1 : 0;
      const newItem = await gridItemsService.create({
        ...item,
        order: newOrder,
      });
      setGridItems(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Error adding grid item:', error);
      throw error;
    }
  };

  const updateGridItem = async (id: string, updates: Partial<GridItem>) => {
    try {
      const updated = await gridItemsService.update(id, updates);
      setGridItems(prev =>
        prev.map(item => item.id === id ? updated : item)
      );
    } catch (error) {
      console.error('Error updating grid item:', error);
      throw error;
    }
  };

  const deleteGridItem = async (id: string) => {
    try {
      await gridItemsService.delete(id);
      setGridItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting grid item:', error);
      throw error;
    }
  };

  // Funciones para manejar los anuncios
  const addAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'order'>) => {
    try {
      const newOrder = allAnnouncements.length > 0 ? Math.max(...allAnnouncements.map(a => a.order || 0)) + 1 : 0;
      const newAnnouncement = await announcementsService.create({
        ...announcement,
        order: newOrder,
      });
      setAllAnnouncements(prev => [...prev, newAnnouncement]);
    } catch (error) {
      console.error('Error adding announcement:', error);
      throw error;
    }
  };

  const updateAnnouncement = async (id: string, updates: Partial<Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updated = await announcementsService.update(id, updates);
      setAllAnnouncements(prev =>
        prev.map(announcement => announcement.id === id ? updated : announcement)
      );
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await announcementsService.delete(id);
      setAllAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  };

  const toggleAnnouncement = async (id: string) => {
    const announcement = allAnnouncements.find(a => a.id === id);
    if (!announcement) return;

    try {
      await updateAnnouncement(id, { isActive: !announcement.isActive });
    } catch (error) {
      console.error('Error toggling announcement:', error);
      throw error;
    }
  };

  // Filter active announcements for display
  const activeAnnouncements = allAnnouncements.filter(a => a.isActive);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        isAdmin,
        setIsAdmin,
        gridItems,
        addGridItem,
        updateGridItem,
        deleteGridItem,
        announcements: activeAnnouncements,
        allAnnouncements,
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
