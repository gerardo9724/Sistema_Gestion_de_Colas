import React, { useState, useEffect } from 'react';
import { Monitor, Tablet, Users, Settings, Wifi, WifiOff, Computer } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getComputerIdentifier } from '../services/computerProfileService';

const userTypes = [
  {
    type: 'botonera',
    name: 'Usuario Botonera',
    description: 'Pantalla para generar tickets de servicio',
    icon: Tablet,
    color: 'bg-blue-500 hover:bg-blue-600',
    requiresLogin: false,
  },
  {
    type: 'nodo',
    name: 'Usuario Nodo',
    description: 'Pantalla de visualización y publicidad',
    icon: Monitor,
    color: 'bg-green-500 hover:bg-green-600',
    requiresLogin: false,
  },
  {
    type: 'empleado',
    name: 'Usuario Empleado',
    description: 'Panel de atención de tickets',
    icon: Users,
    color: 'bg-orange-500 hover:bg-orange-600',
    requiresLogin: true,
  },
  {
    type: 'administrador',
    name: 'Usuario Administrador',
    description: 'Panel de administración del sistema',
    icon: Settings,
    color: 'bg-red-500 hover:bg-red-600',
    requiresLogin: true,
  },
];

export default function UserSelector() {
  const { state, dispatch, checkComputerProfile } = useApp();
  const [computerIdentifier, setComputerIdentifier] = useState('');

  useEffect(() => {
    const id = getComputerIdentifier();
    setComputerIdentifier(id);
  }, []);

  // Check for auto-assigned profile when Firebase connects
  useEffect(() => {
    if (state.isFirebaseConnected && !state.currentUser) {
      checkComputerProfile();
    }
  }, [state.isFirebaseConnected, state.currentUser, checkComputerProfile]);

  const handleUserSelection = (type: string) => {
    if (type === 'botonera') {
      // Create a simple botonera user
      const botoneraUser = {
        id: 'botonera-user',
        name: 'Usuario Botonera',
        type: 'botonera',
        isActive: true,
        createdAt: new Date(),
      };
      
      dispatch({ type: 'SET_CURRENT_USER', payload: botoneraUser });
    } else if (type === 'nodo') {
      // Create a simple nodo user
      const nodoUser = {
        id: 'nodo-user',
        name: 'Usuario Nodo',
        type: 'nodo',
        isActive: true,
        createdAt: new Date(),
      };
      
      dispatch({ type: 'SET_CURRENT_USER', payload: nodoUser });
    } else if (type === 'empleado' || type === 'administrador') {
      // Create temporary user for login flow
      const tempUser = {
        id: `temp-${type}`,
        name: `Usuario ${type}`,
        type: type as 'empleado' | 'administrador',
        isActive: true,
        createdAt: new Date(),
      };
      
      dispatch({ type: 'SET_CURRENT_USER', payload: tempUser });
    }
  };

  // If there's an auto-assigned profile, show loading or redirect message
  if (state.currentComputerProfile && state.currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Computer size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Perfil Asignado</h1>
            <p className="text-gray-600 mb-6">
              Esta computadora tiene un perfil asignado automáticamente
            </p>
            
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <div className="text-green-800 font-semibold mb-2">Perfil Activo:</div>
              <div className="text-green-900">
                <div className="font-medium">{state.currentComputerProfile.profileName}</div>
                <div className="text-sm capitalize">{state.currentComputerProfile.profileType}</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Redirigiendo automáticamente...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Sistema de Gestión de Colas
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Selecciona el tipo de usuario para continuar
          </p>
          
          {/* Connection Status */}
          <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md mb-4">
            {state.isFirebaseConnected ? (
              <>
                <Wifi size={16} className="text-green-500" />
                <span className="text-sm text-green-700 font-medium">Conectado a Firebase</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-red-500" />
                <span className="text-sm text-red-600 font-medium">Sin conexión a Firebase</span>
              </>
            )}
          </div>

          {/* Computer Identifier */}
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
            <Computer size={16} className="text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">ID: </span>
            <span className="text-sm text-blue-800 font-mono font-bold">{computerIdentifier}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userTypes.map((userType) => {
            const IconComponent = userType.icon;
            
            return (
              <button
                key={userType.type}
                onClick={() => handleUserSelection(userType.type)}
                className={`${userType.color} text-white p-8 rounded-2xl shadow-xl transform transition-all duration-200 hover:scale-105 hover:shadow-2xl relative group`}
              >
                {userType.requiresLogin && (
                  <div className="absolute top-4 right-4 bg-white bg-opacity-20 rounded-full p-2">
                    <Settings size={16} />
                  </div>
                )}
                
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white bg-opacity-20 rounded-full p-4 group-hover:bg-opacity-30 transition-all">
                    <IconComponent size={48} className="mb-2" />
                  </div>
                  <h3 className="text-2xl font-bold">{userType.name}</h3>
                  <p className="text-lg opacity-90 text-center">
                    {userType.description}
                  </p>
                  {userType.requiresLogin && (
                    <span className="text-sm opacity-75 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                      Requiere autenticación
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* System Status */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              🚀 Sistema Completo con Gestión de Perfiles
            </h3>
            <p className="text-gray-600 mb-4">
              Todos los módulos del sistema están disponibles con asignación automática de perfiles por computadora:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="font-semibold text-blue-800">Módulo Botonera ✅</div>
                <div className="text-blue-600">Generación de tickets</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="font-semibold text-green-800">Módulo Nodo ✅</div>
                <div className="text-green-600">Visualización y audio</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="font-semibold text-orange-800">Módulo Empleado ✅</div>
                <div className="text-orange-600">Atención de tickets</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="font-semibold text-red-800">Módulo Admin ✅</div>
                <div className="text-red-600">Gestión completa</div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Credenciales de Acceso:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <div className="font-semibold text-orange-800">Empleado</div>
                  <div>Usuario: <strong>ana.garcia</strong></div>
                  <div>Contraseña: <strong>emp123</strong></div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-semibold text-red-800">Administrador</div>
                  <div>Usuario: <strong>admin</strong></div>
                  <div>Contraseña: <strong>admin123</strong></div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">🆕 Gestión de Perfiles por Computadora:</h4>
              <ul className="text-sm text-purple-700 space-y-1 text-left">
                <li>• <strong>Identificación Automática:</strong> Cada PC genera un ID único automáticamente</li>
                <li>• <strong>Asignación de Perfiles:</strong> Los administradores pueden asignar perfiles específicos a cada computadora</li>
                <li>• <strong>Inicio Automático:</strong> Las computadoras con perfiles asignados inician automáticamente en el módulo correspondiente</li>
                <li>• <strong>Gestión Centralizada:</strong> Control total desde el panel de administración</li>
                <li>• <strong>Flexibilidad:</strong> Cambio de perfiles en tiempo real sin reiniciar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}