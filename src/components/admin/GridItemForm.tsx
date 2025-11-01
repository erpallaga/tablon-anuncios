import { useState, useEffect } from 'react';
import { X, Save, Upload, Loader2 } from 'lucide-react';
import type { GridItem } from '../../types';
import { storageService } from '../../lib/supabase/storage';

interface GridItemFormProps {
  item: GridItem | null;
  onSave: (item: Omit<GridItem, 'id' | 'order'>) => Promise<void> | void;
  onCancel: () => void;
  isNew?: boolean;
}

const EMOJIS = ['📖', '🎤', '🧹', '📅', '💼', '📋', '👥', '📝', '📌', '🔔', '📢', '📑'];

export default function GridItemForm({ item, onSave, onCancel, isNew = false }: GridItemFormProps) {
  const [formData, setFormData] = useState<Omit<GridItem, 'id' | 'order'>>(
    item || { title: '', icon: '📄', pdfUrl: '' }
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData(item);
      setUseFileUpload(false);
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Por favor selecciona un archivo PDF');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let pdfUrl = formData.pdfUrl;

      // If uploading a new file
      if (useFileUpload && selectedFile) {
        setUploading(true);
        pdfUrl = await storageService.uploadPDF(selectedFile, selectedFile.name);
      }

      // If editing and deleting old file, we'd need to track the old URL
      // For simplicity, we'll skip that for now - just upload new file

      await onSave({
        ...formData,
        pdfUrl,
      });
    } catch (err: any) {
      console.error('Error saving grid item:', err);
      setError(err.message || 'Error al guardar el elemento');
    } finally {
      setUploading(false);
    }
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
            <div className="flex items-center gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="radio"
                  checked={!useFileUpload}
                  onChange={() => setUseFileUpload(false)}
                  className="text-blue-600"
                />
                URL del PDF
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="radio"
                  checked={useFileUpload}
                  onChange={() => setUseFileUpload(true)}
                  className="text-blue-600"
                />
                Subir archivo PDF
              </label>
            </div>

            {useFileUpload ? (
              <div>
                <label 
                  htmlFor="pdf-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Clic para subir</span> o arrastra el archivo
                    </p>
                    <p className="text-xs text-gray-500">PDF únicamente</p>
                  </div>
                  <input
                    id="pdf-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Archivo seleccionado: {selectedFile.name}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  name="pdfUrl"
                  value={formData.pdfUrl}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/documento.pdf o URL de Supabase"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!useFileUpload}
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL completa del PDF (puede ser de Supabase o externa)
                </p>
              </div>
            )}

            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
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
              disabled={uploading || (useFileUpload && !selectedFile)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isNew ? 'Crear' : 'Guardar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
