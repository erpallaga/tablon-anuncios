import { useState } from 'react';
import { Bell, Mail } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

export default function LoginPage() {
  const { signIn, isLoading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const { error } = await signIn(email);

    if (error) {
      setStatus('error');
      setErrorMsg('Este email no está autorizado. Contacta con el administrador.');
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Congregación Sarrià-Les Corts
          </h2>
          <p className="text-blue-100 mt-2">
            Acceso exclusivo para miembros invitados
          </p>
        </div>

        <div className="p-8">
          {status === 'sent' ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Revisa tu correo</h3>
              <p className="text-gray-600 text-sm">
                Te hemos enviado un enlace de acceso a <strong>{email}</strong>.
                Haz clic en él para entrar al Tablón.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="text-sm text-blue-600 hover:underline"
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  autoFocus
                  required
                />
                {errorMsg && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errorMsg}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'sending' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar enlace de acceso</span>
                )}
              </button>
            </form>
          )}
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
