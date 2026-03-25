import { useState, useEffect } from 'react';
import { Plus, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { profilesService } from '../../lib/supabase/profiles';
import type { Profile, UserRole } from '../../types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  congregante: 'Congregante',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  editor: 'bg-blue-100 text-blue-700',
  congregante: 'bg-gray-100 text-gray-700',
};

export default function UsersPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('congregante');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [inviteError, setInviteError] = useState('');
  const [sentEmail, setSentEmail] = useState('');

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      const data = await profilesService.getAllProfiles();
      setProfiles(data);
    } catch (err) {
      console.error('Error loading profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await profilesService.updateProfile(userId, { role: newRole });
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      await profilesService.updateProfile(userId, { isActive: !currentActive });
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, isActive: !currentActive } : p));
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus('sending');
    setInviteError('');

    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail, displayName: inviteName, role: inviteRole },
      });

      if (error) {
        // For non-2xx responses, the body with our error message is in `data`
        const msg = data?.error || error.message;
        if (msg?.toLowerCase().includes('rate limit')) {
          throw new Error('Demasiados emails enviados. Espera unos minutos e inténtalo de nuevo.');
        }
        throw new Error(msg || 'Error al invitar al usuario.');
      }

      setSentEmail(inviteEmail);
      setInviteStatus('sent');
      setInviteEmail('');
      setInviteName('');
      setInviteRole('congregante');
      await loadProfiles();
    } catch (err: any) {
      setInviteStatus('error');
      setInviteError(err.message || 'Error al invitar al usuario. Inténtalo de nuevo.');
    }
  };

  const resetInviteForm = () => {
    setShowInviteForm(false);
    setInviteStatus('idle');
    setInviteError('');
    setSentEmail('');
    setInviteEmail('');
    setInviteName('');
    setInviteRole('congregante');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Usuarios</h2>
        <div className="flex gap-2">
          <button
            onClick={loadProfiles}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
            title="Actualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowInviteForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invitar usuario
          </button>
        </div>
      </div>

      {/* Invite form */}
      {showInviteForm && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-3">Invitar nuevo usuario</h3>
          {inviteStatus === 'sent' ? (
            <div className="text-center py-2">
              <p className="text-sm text-green-700 font-medium">
                ✓ Invitación enviada a {sentEmail}
              </p>
              <button onClick={resetInviteForm} className="mt-2 text-sm text-blue-600 hover:underline">
                Invitar otro usuario
              </button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="congregante">Congregante</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {inviteError && (
                <p className="text-sm text-red-600">⚠️ {inviteError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={inviteStatus === 'sending'}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviteStatus === 'sending' ? 'Enviando...' : 'Enviar invitación'}
                </button>
                <button
                  type="button"
                  onClick={resetInviteForm}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Users list */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Cargando usuarios...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {profiles.map(p => (
              <li key={p.id} className={`px-4 py-4 flex items-center justify-between gap-4 ${!p.isActive ? 'opacity-50' : ''}`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{p.email}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[p.role]}`}>
                    {ROLE_LABELS[p.role]}
                  </span>

                  <select
                    value={p.role}
                    onChange={e => handleRoleChange(p.id, e.target.value as UserRole)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Cambiar rol"
                  >
                    <option value="congregante">Congregante</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    onClick={() => handleToggleActive(p.id, p.isActive)}
                    className={`p-1.5 rounded-full ${p.isActive ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                    title={p.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                  >
                    {p.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>
              </li>
            ))}
            {profiles.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-gray-500">
                No hay usuarios. Invita al primero usando el botón de arriba.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
