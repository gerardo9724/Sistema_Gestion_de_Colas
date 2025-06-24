import React, { useState } from 'react';
import { LogOut, Users, User, Settings, Cog, Monitor, Tablet, Building, UserCheck } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function AdminLayout({ children, activeSection, onSectionChange }: AdminLayoutProps) {
  const { state, dispatch } = useApp();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const menuItems = [
    { id: 'employees', name: 'Empleados', icon: Users },
    { id: 'employee-management', name: 'Gestión Empleados', icon: UserCheck }, // NEW: Real-time employee management
    { id: 'users', name: 'Usuarios', icon: User },
    { id: 'services', name: 'Servicios', icon: Cog },
    { id: 'carousel', name: 'Configuración Nodo', icon: Monitor },
    { id: 'profiles', name: 'Perfiles PC', icon: Building },
    { id: 'configurations', name: 'Configuraciones', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <div className="bg-white bg-opacity-90 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
              <div className="flex flex-col">
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {state.currentUser?.name}
                </span>
                <span className="text-xs text-gray-600 mt-1">Administrador</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-lg text-gray-600">
                {new Date().toLocaleTimeString()}
              </div>
              
              {/* Connection Status */}
              <div className="bg-white rounded-lg px-4 py-2 shadow-md">
                <div className="flex items-center space-x-2">
                  {state.isFirebaseConnected ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-700 font-medium">Firebase</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-red-700 font-medium">Sin conexión</span>
                    </>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSectionChange(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeSection === item.id
                          ? 'bg-red-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent size={20} />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}