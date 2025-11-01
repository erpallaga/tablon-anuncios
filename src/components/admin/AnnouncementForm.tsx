import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Announcement } from '../../types';

interface AnnouncementFormProps {
  announcement: Announcement | null;
  onSave: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => void;
  onCancel: () => void;
  isNew?: boolean;
}

export default function AnnouncementForm({ 
  announcement, 
  onSave, 
  onCancel, 
  isNew = false 
}: AnnouncementFormProps) {
  const [formData, setFormData] = useState<Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>>(
    announcement || { title: '', content: '' }
  );

  useEffect(() => {
    if (announcement) {
      const { id, isActive, createdAt, updatedAt, ...rest } = announcement;
      setFormData(rest);
    }
  }, [announcement]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {isNew ? 'Nuevo anuncio' : 'Editar anuncio'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-gray-100"
            type="button"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título del anuncio
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenido
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isNew ? 'Crear anuncio' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
