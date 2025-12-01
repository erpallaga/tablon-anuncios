import { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Bell, Grid, X, ChevronUp, ChevronDown, Copy, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

// Sortable Grid Item Component
interface SortableGridItemProps {
  item: GridItem;
  index: number;
  totalItems: number;
  onEdit: (item: GridItem) => void;
  onDuplicate: (item: GridItem) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

function SortableGridItem({ item, index, totalItems, onEdit, onDuplicate, onDelete, onMoveUp, onMoveDown }: SortableGridItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="bg-white hover:bg-gray-50">
      <div className="px-4 py-4 flex items-start sm:items-center gap-3">
        {/* Drag handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0 touch-none">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        {/* Move buttons */}
        <div className="flex flex-col flex-shrink-0">
          <button
            onClick={() => onMoveUp(item.id)}
            disabled={index === 0}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
            title="Mover arriba"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMoveDown(item.id)}
            disabled={index === totalItems - 1}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
            title="Mover abajo"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Icon */}
        <span className="text-2xl flex-shrink-0">{item.icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          <p className="text-sm text-gray-500 truncate">
            {getFilenameFromUrl(item.pdfUrl)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
            title="Editar"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDuplicate(item)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full"
            title="Duplicar"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
            title="Eliminar"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </li>
  );
}

// Sortable Announcement Component
interface SortableAnnouncementProps {
  announcement: Announcement;
  index: number;
  totalAnnouncements: number;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

function SortableAnnouncement({ announcement, index, totalAnnouncements, onEdit, onDelete, onMoveUp, onMoveDown }: SortableAnnouncementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: announcement.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="px-4 py-4 flex items-center justify-between group">
      <div className="flex items-center space-x-3">
        {/* Drag handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        <div className="flex flex-col space-y-1">
          <button
            onClick={() => onMoveUp(announcement.id)}
            disabled={index === 0}
            className={`p-1 text-gray-300 hover:text-gray-600 rounded ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}
            title="Mover arriba"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMoveDown(announcement.id)}
            disabled={index === totalAnnouncements - 1}
            className={`p-1 text-gray-300 hover:text-gray-600 rounded ${index === totalAnnouncements - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}
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
          onClick={() => onEdit(announcement)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
          title="Editar"
        >
          <Edit2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(announcement.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
          title="Eliminar"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </li>
  );
}

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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for grid items
  const handleDragEndGridItems = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sortedItems = [...gridItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
      const newIndex = sortedItems.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(sortedItems, oldIndex, newIndex);

      // Update order for all items
      reorderedItems.forEach((item, index) => {
        updateGridItem(item.id, {
          title: item.title,
          icon: item.icon,
          pdfUrl: item.pdfUrl,
          order: index,
        });
      });
    }
  };

  // Handle drag end for announcements
  const handleDragEndAnnouncements = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sortedAnnouncements = [...allAnnouncements].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const oldIndex = sortedAnnouncements.findIndex((announcement) => announcement.id === active.id);
      const newIndex = sortedAnnouncements.findIndex((announcement) => announcement.id === over.id);

      const reorderedAnnouncements = arrayMove(sortedAnnouncements, oldIndex, newIndex);

      // Update order for all announcements
      try {
        await Promise.all(
          reorderedAnnouncements.map((announcement, index) =>
            updateAnnouncement(announcement.id, {
              title: announcement.title,
              content: announcement.content,
              isActive: announcement.isActive,
              order: index,
            })
          )
        );
      } catch (error) {
        console.error('Error reordering announcements:', error);
      }
    }
  };


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

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndGridItems}
            >
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <SortableContext
                  items={[...gridItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="divide-y divide-gray-200">
                    {[...gridItems]
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((item, index, array) => (
                        <SortableGridItem
                          key={item.id}
                          item={item}
                          index={index}
                          totalItems={array.length}
                          onEdit={handleEditGridItem}
                          onDuplicate={handleDuplicateItem}
                          onDelete={deleteGridItem}
                          onMoveUp={(id) => moveItem(id, 'up')}
                          onMoveDown={(id) => moveItem(id, 'down')}
                        />
                      ))}
                  </ul>
                </SortableContext>
              </div>
            </DndContext>
          </div>
        ) : (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Anuncios</h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndAnnouncements}
            >
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <SortableContext
                  items={[...allAnnouncements].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="divide-y divide-gray-200">
                    {[...allAnnouncements]
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((announcement, index, sortedAnnouncements) => (
                        <SortableAnnouncement
                          key={announcement.id}
                          announcement={announcement}
                          index={index}
                          totalAnnouncements={sortedAnnouncements.length}
                          onEdit={handleEditAnnouncement}
                          onDelete={deleteAnnouncement}
                          onMoveUp={(id) => moveAnnouncement(id, 'up')}
                          onMoveDown={(id) => moveAnnouncement(id, 'down')}
                        />
                      ))}
                  </ul>
                </SortableContext>
              </div>
            </DndContext>
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
