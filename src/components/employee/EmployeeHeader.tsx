import React from 'react';
import { LogOut, Wifi, WifiOff, Bug } from 'lucide-react';
import type { User, Employee } from '../../types';

interface EmployeeHeaderProps {
  currentUser: User;
  currentEmployee: Employee;
  isConnected: boolean;
  hasCurrentTicket: boolean;
  onLogout: () => void;
}

export default function EmployeeHeader({
  currentUser,
  currentEmployee,
  isConnected,
  hasCurrentTicket,
  onLogout
}: EmployeeHeaderProps) {

  // Debug state for validation
  const debugState = {
    dbIsActive: currentEmployee.isActive,
    dbIsPaused: currentEmployee.isPaused,
    hasTicket: hasCurrentTicket,
    isConsistent: currentEmployee.isActive === !currentEmployee.isPaused,
    timestamp: new Date().toLocaleTimeString()
  };

  return (
    <div className="bg-white bg-opacity-90 backdrop-blur-sm shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-800">Panel de Empleado</h1>
            <div className="flex flex-col">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {currentUser.name}
              </span>
              <span className="text-xs text-gray-600 mt-1">
                {currentEmployee.position}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-lg text-gray-600">
              {new Date().toLocaleTimeString()}
            </div>
            
            {/* DEBUG STATE LABEL - TEMPORARY FOR VALIDATION */}
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg px-3 py-2 shadow-md">
              <div className="flex items-center space-x-2 mb-1">
                <Bug size={16} className="text-yellow-600" />
                <span className="text-xs font-bold text-yellow-800">DEBUG - Estado DB</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between space-x-2">
                  <span className="text-yellow-700">isActive:</span>
                  <span className={`font-bold ${debugState.dbIsActive ? 'text-green-600' : 'text-red-600'}`}>
                    {debugState.dbIsActive ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
                <div className="flex justify-between space-x-2">
                  <span className="text-yellow-700">isPaused:</span>
                  <span className={`font-bold ${debugState.dbIsPaused ? 'text-red-600' : 'text-green-600'}`}>
                    {debugState.dbIsPaused ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
                <div className="flex justify-between space-x-2">
                  <span className="text-yellow-700">Consistente:</span>
                  <span className={`font-bold ${debugState.isConsistent ? 'text-green-600' : 'text-red-600'}`}>
                    {debugState.isConsistent ? 'SÍ' : 'NO'}
                  </span>
                </div>
                <div className="text-center text-yellow-600 text-xs border-t border-yellow-300 pt-1">
                  {debugState.timestamp}
                </div>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="bg-white rounded-lg px-4 py-2 shadow-md">
              <div className="flex items-center space-x-2">
                {isConnected ? (
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
              onClick={onLogout}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}