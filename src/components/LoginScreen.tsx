import React, { useState } from 'react';
import { ArrowLeft, Lock, User, Eye, EyeOff, AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { authService } from '../services/authService';

interface LoginScreenProps {
  userType: 'empleado' | 'administrador';
  onBack: () => void;
}

export default function LoginScreen({ userType, onBack }: LoginScreenProps) {
  const { state, dispatch } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await authService.login({ username, password });

      if (result.success && result.user) {
        // Verify user type matches what was requested
        if (result.user.type !== userType) {
          setError(`Este usuario no tiene permisos de ${userType}`);
          setIsLoading(false);
          return;
        }

        // Set user and mark as authenticated
        dispatch({ type: 'SET_CURRENT_USER', payload: result.user });
        dispatch({ type: 'SET_CURRENT_EMPLOYEE', payload: result.employee || null });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      } else {
        setError(result.error || 'Error de autenticación');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Error de conexión. Verifique su conexión a Firebase.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = userType === 'administrador' 
    ? { username: 'admin', password: 'admin123' }
    : { username: 'ana.garcia', password: 'emp123' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-8"
        >
          <ArrowLeft size={24} />
          <span className="text-lg">Volver</span>
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={40} className="text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Iniciar Sesión</h1>
            <p className="text-gray-600">
              {userType === 'administrador' ? 'Panel de Administración' : 'Panel de Empleado'}
            </p>
          </div>

          {/* Connection Status */}
          <div className="mb-6 p-3 rounded-lg bg-gray-50 flex items-center space-x-3">
            {state.isFirebaseConnected ? (
              <>
                <Wifi size={16} className="text-green-500" />
                <span className="text-sm text-green-700">Conectado a Firebase</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-red-500" />
                <span className="text-sm text-red-600">Sin conexión a Firebase</span>
              </>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Ingresa tu usuario"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Ingresa tu contraseña"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-600 text-sm font-medium">Error de autenticación</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Lock size={20} />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">Credenciales de prueba:</p>
            <div className="text-sm font-mono bg-white p-2 rounded border">
              <div>Usuario: <span className="font-semibold">{demoCredentials.username}</span></div>
              <div>Contraseña: <span className="font-semibold">{demoCredentials.password}</span></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * Estas credenciales se validan contra Firebase Firestore
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}