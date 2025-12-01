import { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Bell, Grid, X, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import GridItemForm from './GridItemForm';
import AnnouncementForm from './AnnouncementForm';
import type { GridItem, Announcement } from '../../types';

// Helper function to extract filename from URL
const getFilenameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split('/').pop() || url; // Return last part of path or original URL if parsing fails
  } catch (e) {
    // If URL parsing fails, try to extract the last part after the last slash
    const parts = url.split('/');
    return parts[parts.length - 1] || url;
  }
};

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const {
    gridItems,
    addGridItem,
    updateGridItem,
    deleteGridItem,
    allAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'grid' | 'announcements'>('grid');
  const [editingItem, setEditingItem] = useState<GridItem | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showGridItemForm, setShowGridItemForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  const handleSaveGridItem = async (itemData: Omit<GridItem, 'id'>) => {
    try {
      if (editingItem) {
        await updateGridItem(editingItem.id, itemData);
      } else {
        // Al agregar un nuevo elemento, se le asigna un orden al final de la lista
        const newOrder = gridItems.length > 0 ? Math.max(...gridItems.map(i => i.order ?? 0)) + 1 : 0;
        await addGridItem({
          ...itemData,
          order: newOrder
        });
      }
      setShowGridItemForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving grid item:', error);
      // You might want to show an error message to the user here
    }
  };

  // Función para mover un elemento del grid hacia arriba o abajo
  const moveItem = (id: string, direction: 'up' | 'down') => {
    const items = [...gridItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const currentIndex = items.findIndex(item => item.id === id);

    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Verificar que el nuevo índice sea válido
    if (newIndex < 0 || newIndex >= items.length) return;

    // Intercambiar los elementos
    [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];

    // Actualizar el orden de los elementos
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    // Actualizar el estado global
    updatedItems.forEach(item => {
      updateGridItem(item.id, {
        title: item.title,
        icon: item.icon,
        pdfUrl: item.pdfUrl,
        order: item.order
      });
    });
  };

  // Función para mover un anuncio hacia arriba o abajo
  const moveAnnouncement = async (id: string, direction: 'up' | 'down') => {
    const sortedAnnouncements = [...allAnnouncements].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const currentIndex = sortedAnnouncements.findIndex(announcement => announcement.id === id);

    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Verificar que el nuevo índice sea válido
    if (newIndex < 0 || newIndex >= sortedAnnouncements.length) return;

    // Intercambiar los elementos
    [sortedAnnouncements[currentIndex], sortedAnnouncements[newIndex]] =
      [sortedAnnouncements[newIndex], sortedAnnouncements[currentIndex]];

    // Actualizar el orden de los elementos
    const updatedAnnouncements = sortedAnnouncements.map((announcement, index) => ({
      ...announcement,
      order: index
    }));

    // Actualizar el estado global
    try {
      await Promise.all(updatedAnnouncements.map(announcement =>
        updateAnnouncement(announcement.id, {
          title: announcement.title,
          content: announcement.content,
          isActive: announcement.isActive,
          order: announcement.order
        })
      ));
    } catch (error) {
      console.error('Error moving announcement:', error);
    }
  };

  const handleSaveAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => {
    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, announcementData);
      } else {
        await addAnnouncement(announcementData);
      }
      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
    } catch (error) {
      console.error('Error saving announcement:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleEditGridItem = (item: GridItem) => {
    setEditingItem(item);
    setShowGridItemForm(true);
  };

  const handleDuplicateItem = async (item: GridItem) => {
    try {
      // Create a copy of the item with a new ID and incremented order
      const newOrder = gridItems.length > 0 ? Math.max(...gridItems.map(i => i.order ?? 0)) + 1 : 0;
      const newItem = {
        ...item,
        title: `${item.title} (copia)`,
        order: newOrder,
        // The ID will be generated by the database
        id: ''
      };

      // Add the duplicated item
      await addGridItem(newItem);
    } catch (error) {
      console.error('Error duplicating item:', error);
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowAnnouncementForm(true);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={onClose}
                className="mr-4 p-2 rounded-full hover:bg-gray-100"
                title="Volver al tablón"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
              title="Cerrar"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('grid')}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'grid'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Grid className="w-5 h-5 mr-2" />
                Elementos del Tablón
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'announcements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Bell className="w-5 h-5 mr-2" />
                Anuncios
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'grid' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Elementos del Tablón</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowGridItemForm(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Elemento
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {[...gridItems]
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((item, index, array) => (
                    <li key={item.id} className="bg-white hover:bg-gray-50">
                      <div className="px-4 py-4 flex items-start sm:items-center gap-3">
                        {/* Move buttons */}
                        <div className="flex flex-col flex-shrink-0">
                          <button
                            onClick={() => moveItem(item.id, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                            title="Mover arriba"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveItem(item.id, 'down')}
                            disabled={index === array.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                            title="Mover abajo"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Icon */}
                        <span className="text-2xl flex-shrink-0">{item.icon}</span>

                        {/* Content - can grow and shrink */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {getFilenameFromUrl(item.pdfUrl)}
                          </p>
                        </div>

                        {/* Action buttons - always visible */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEditGridItem(item)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                            title="Editar"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateItem(item)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full"
                            title="Duplicar"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteGridItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Anuncios</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {[...allAnnouncements]
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((announcement, index, sortedAnnouncements) => (
                    <li key={announcement.id} className="px-4 py-4 flex items-center justify-between group">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => moveAnnouncement(announcement.id, 'up')}
                            disabled={index === 0}
                            className={`p-1 text-gray-300 hover:text-gray-600 rounded ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                            title="Mover arriba"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveAnnouncement(announcement.id, 'down')}
                            disabled={index === sortedAnnouncements.length - 1}
                            className={`p-1 text-gray-300 hover:text-gray-600 rounded ${index === sortedAnnouncements.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                            title="Mover abajo"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                          <p className="text-sm text-gray-500">{announcement.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditAnnouncement(announcement)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                          title="Editar"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(announcement.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setShowAnnouncementForm(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Anuncio
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Forms */}
      {showGridItemForm && (
        <GridItemForm
          item={editingItem}
          onSave={handleSaveGridItem}
          onCancel={() => {
            setShowGridItemForm(false);
            setEditingItem(null);
          }}
          isNew={!editingItem}
        />
      )}

      {showAnnouncementForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onSave={handleSaveAnnouncement}
          onCancel={() => {
            setShowAnnouncementForm(false);
            setEditingAnnouncement(null);
          }}
          isNew={!editingAnnouncement}
        />
      )}
    </div>
  );
}
