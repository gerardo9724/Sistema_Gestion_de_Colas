import React from 'react';
import { Key } from 'lucide-react';
import type { User, Employee } from '../../types';

interface EmployeeProfileProps {
  currentUser: User;
  currentEmployee: Employee;
  onChangePassword: () => void;
  onUpdateProfile: () => void; // This will be disabled for employees
}

export default function EmployeeProfile({
  currentUser,
  currentEmployee,
  onChangePassword,
  onUpdateProfile // Not used - employees can't edit profile
}: EmployeeProfileProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h2>
        
        <div className="space-y-6">
          {/* User Info - READ ONLY */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                  {currentUser.name}
                </div>
                <p className="text-xs text-gray-500 mt-1">Solo lectura - Contacta al administrador para cambios</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                  {currentUser.username}
                </div>
                <p className="text-xs text-gray-500 mt-1">Solo lectura - Contacta al administrador para cambios</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                  Empleado
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Activo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Info - READ ONLY */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Información de Empleado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Posición</label>
                <div className="p-3 bg-white border border-blue-300 rounded-lg text-blue-800">
                  {currentEmployee.position}
                </div>
                <p className="text-xs text-blue-600 mt-1">Solo lectura - Contacta al administrador para cambios</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Estado Actual</label>
                <div className="p-3 bg-white border border-blue-300 rounded-lg">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    currentEmployee.isPaused ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {currentEmployee.isPaused ? 'En Pausa' : 'Disponible'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - ONLY PASSWORD CHANGE */}
          <div className="flex justify-center">
            <button
              onClick={onChangePassword}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <Key size={20} />
              <span>Cambiar Contraseña</span>
            </button>
          </div>

          {/* Information Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">ℹ️ Información Importante</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Los datos personales y de empleado son de solo lectura</li>
              <li>• Solo puedes cambiar tu contraseña desde este panel</li>
              <li>• Para modificar otros datos, contacta al administrador</li>
              <li>• El sistema registra automáticamente tu actividad</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}