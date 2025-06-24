import React, { useState } from 'react';
import { Edit, Key } from 'lucide-react';
import type { User, Employee } from '../../types';

interface EmployeeProfileProps {
  currentUser: User;
  currentEmployee: Employee;
  onChangePassword: () => void;
  onUpdateProfile: () => void;
}

export default function EmployeeProfile({
  currentUser,
  currentEmployee,
  onChangePassword,
  onUpdateProfile
}: EmployeeProfileProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h2>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <div className="p-3 bg-white border border-gray-300 rounded-lg">
                  {currentUser.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <div className="p-3 bg-white border border-gray-300 rounded-lg">
                  {currentUser.username}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <div className="p-3 bg-white border border-gray-300 rounded-lg">
                  Empleado
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <div className="p-3 bg-white border border-gray-300 rounded-lg">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Activo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Información de Empleado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Posición</label>
                <div className="p-3 bg-white border border-blue-300 rounded-lg">
                  {currentEmployee.position}
                </div>
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

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onUpdateProfile}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <Edit size={20} />
              <span>Editar Perfil</span>
            </button>
            
            <button
              onClick={onChangePassword}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <Key size={20} />
              <span>Cambiar Contraseña</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}