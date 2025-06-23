import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import AdminLayout from './admin/AdminLayout';
import EmployeesManagement from './admin/EmployeesManagement';
import UsersManagement from './admin/UsersManagement';
import ServicesManagement from './admin/ServicesManagement';
import NodeConfiguration from './admin/NodeConfiguration';
import ComputerProfilesManagement from './admin/ComputerProfilesManagement';
import SystemConfigurations from './admin/SystemConfigurations';

export default function AdministradorUser() {
  const { state } = useApp();
  const [activeSection, setActiveSection] = useState('employees');

  const renderContent = () => {
    switch (activeSection) {
      case 'employees':
        return <EmployeesManagement />;
      case 'users':
        return <UsersManagement />;
      case 'services':
        return <ServicesManagement />;
      case 'carousel':
        return <NodeConfiguration />;
      case 'profiles':
        return <ComputerProfilesManagement />;
      case 'configurations':
        return <SystemConfigurations />;
      default:
        return <EmployeesManagement />;
    }
  };

  if (!state.currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder al panel de administración.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </AdminLayout>
  );
}