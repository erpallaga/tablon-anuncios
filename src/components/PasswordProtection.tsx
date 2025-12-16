import { useState, useEffect } from 'react';
import { Lock, Bell } from 'lucide-react';
import { authService } from '../lib/supabase/auth';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('congregacion');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Simulate splash screen loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));

    const isValid = await authService.verifyAccessPassword(password);

    if (isValid) {
      setIsAuthenticated(true);
    } else {
      setError('Contraseña incorrecta');
      setPassword(''); // Clear password on error
    }
    setIsVerifying(false);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-ping absolute opacity-75"></div>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute text-blue-500">
            <Bell className="w-8 h-8" />
          </div>
        </div>
        <h1 className="mt-8 text-2xl font-bold text-gray-800 tracking-wider animate-pulse">
          TABLÓN DE ANUNCIOS
        </h1>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-blue-600 p-6 text-center">
            <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Congregación Sarrià-Les Corts
            </h2>
            <p className="text-blue-100 mt-2">
              Introduce la contraseña para ver el contenido
            </p>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              {/* Username field - Safari needs this to be editable for reliable password saving */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña de acceso
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {error}
                  </p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isVerifying}
                type="button"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verificando...</span>
                  </>
                ) : (
                  <span>Entrar al Tablón</span>
                )}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Tablón de Anuncios. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}