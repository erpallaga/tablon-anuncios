import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { GridItem } from '../../types';

interface GridItemFormProps {
  item: GridItem | null;
  onSave: (item: Omit<GridItem, 'id' | 'order'>) => void;
  onCancel: () => void;
  isNew?: boolean;
}

const EMOJIS = ['📖', '🎤', '🧹', '📅', '💼', '📋', '👥', '📝', '📌', '🔔', '📢', '📑'];

export default function GridItemForm({ item, onSave, onCancel, isNew = false }: GridItemFormProps) {
  const [formData, setFormData] = useState<Omit<GridItem, 'id' | 'order'>>(
    item || { title: '', icon: '📄', pdfUrl: '' }
  );

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {isNew ? 'Nuevo elemento' : 'Editar elemento'}
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
              Título
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
              Icono
            </label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`text-2xl p-2 rounded-md ${
                    formData.icon === emoji ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del PDF
            </label>
            <input
              type="text"
              name="pdfUrl"
              value={formData.pdfUrl}
              onChange={handleChange}
              placeholder="/pdfs/ejemplo.pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Asegúrate de que el archivo exista en la carpeta public/pdfs
            </p>
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
              {isNew ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
