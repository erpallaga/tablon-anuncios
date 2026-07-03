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

const EMOJIS = [
  // Documents
  '📄', '📑', '📃', '📜', '📋', '📇', '📁', '📂', '📝',
  // Books & Notes
  '📕', '📗', '📒', '📚', '📖', '🔖', '📰', '📓',
  // Office
  '💼', '🗂️', '📆', '🖇️',
  // Communication
  '📢', '📣', '📮',
  // Objects
  '🔍', '📌', '📍',
  // People
  '👥', '👨‍💼',
  // Symbols
  '⭐', '✨', '💡', '🔔', '🎯'
];

export default function GridItemForm({ item, onSave, onCancel, isNew = false }: GridItemFormProps) {
  const [formData, setFormData] = useState<Omit<GridItem, 'id' | 'order'>>(
    item || { title: '', icon: '📄', fileUrl: '', fileType: undefined, extractAssignments: false }
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [useFileUpload, setUseFileUpload] = useState(true);
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

  const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Por favor selecciona un PDF o una imagen (JPG, PNG, GIF, WEBP, SVG)');
        return;
      }
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        fileType: file.type.startsWith('image/') ? 'image' : 'pdf',
      }));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let fileUrl = formData.fileUrl;

      if (useFileUpload && selectedFile) {
        setUploading(true);
        fileUrl = await storageService.uploadFile(selectedFile, selectedFile.name);
      }

      await onSave({
        ...formData,
        fileUrl,
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
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

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icono
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className={`text-2xl p-1 rounded-md transition-colors ${
                        formData.icon === emoji
                          ? 'bg-blue-100 ring-2 ring-blue-400'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                      title={`Seleccionar ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      checked={useFileUpload}
                      onChange={() => setUseFileUpload(true)}
                      className="text-blue-600"
                    />
                    Subir archivo
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      checked={!useFileUpload}
                      onChange={() => setUseFileUpload(false)}
                      className="text-blue-600"
                    />
                    URL del archivo
                  </label>
                </div>

                {useFileUpload ? (
                  <div>
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Clic para subir</span> o arrastra el archivo
                        </p>
                        <p className="text-xs text-gray-500">PDF, JPG, PNG, GIF, WEBP, SVG</p>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,application/pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,image/*"
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
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="fileUrl"
                      value={formData.fileUrl}
                      onChange={handleChange}
                      placeholder="https://ejemplo.com/archivo.pdf o URL de imagen"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!useFileUpload}
                    />
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">Tipo:</span>
                      <label className="flex items-center gap-1.5 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="fileType"
                          value="pdf"
                          checked={formData.fileType === 'pdf' || formData.fileType === undefined}
                          onChange={() => setFormData(prev => ({ ...prev, fileType: 'pdf' }))}
                        />
                        PDF
                      </label>
                      <label className="flex items-center gap-1.5 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="fileType"
                          value="image"
                          checked={formData.fileType === 'image'}
                          onChange={() => setFormData(prev => ({ ...prev, fileType: 'image' }))}
                        />
                        Imagen
                      </label>
                    </div>
                  </div>
                )}

                {isNew && (
                  <div className="rounded-md bg-blue-50 p-3 mt-3">
                    <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.extractAssignments ?? false}
                        onChange={(e) => setFormData(prev => ({ ...prev, extractAssignments: e.target.checked }))}
                        className="mt-0.5 text-blue-600"
                      />
                      <span>
                        <span className="font-medium">📅 Análisis Automático de Asignaciones</span>
                        <br />
                        <span className="text-xs text-gray-500">
                          Al crearlo se analizará el documento y se notificará por email
                          a los usuarios registrados que tengan asignaciones.
                        </span>
                      </span>
                    </label>
                  </div>
                )}

                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t flex-shrink-0">
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
