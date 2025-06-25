import React from 'react';
import { LogOut, Play, Pause, Clock, Wifi, WifiOff } from 'lucide-react';
import type { User, Employee } from '../../types';

interface EmployeeHeaderProps {
  currentUser: User;
  currentEmployee: Employee;
  isConnected: boolean;
  isPaused: boolean;
  hasCurrentTicket: boolean;
  onLogout: () => void;
  onTogglePause: () => void;
}

export default function EmployeeHeader({
  currentUser,
  currentEmployee,
  isConnected,
  isPaused,
  hasCurrentTicket,
  onLogout,
  onTogglePause
}: EmployeeHeaderProps) {
  
  // CRITICAL FIX: Log the current state for debugging
  console.log('🔍 EMPLOYEE HEADER STATE:', {
    employeeName: currentEmployee.name,
    isPaused,
    hasCurrentTicket,
    currentTicketId: currentEmployee.currentTicketId,
    buttonShouldBeDisabled: hasCurrentTicket,
    buttonShouldWork: !hasCurrentTicket
  });

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
            
            {/* CRITICAL FIX: Resume/Pause Button - ONLY disable when has current ticket */}
            <button
              onClick={() => {
                console.log('🔘 BUTTON CLICKED:', {
                  action: isPaused ? 'RESUME' : 'PAUSE',
                  currentState: isPaused ? 'PAUSED' : 'ACTIVE',
                  hasCurrentTicket,
                  willExecute: !hasCurrentTicket
                });
                onTogglePause();
              }}
              disabled={hasCurrentTicket} // CRITICAL: ONLY disable when has current ticket
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-semibold transform ${
                hasCurrentTicket 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                  : isPaused 
                    ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl' 
                    : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
              }`}
              title={hasCurrentTicket ? 'No se puede pausar con ticket activo' : 
                     isPaused ? 'Reanudar y buscar tickets disponibles' : 'Pausar atención'}
            >
              {isPaused ? (
                <>
                  <Play size={20} className="animate-pulse" />
                  <span>Reanudar</span>
                </>
              ) : (
                <>
                  <Pause size={20} />
                  <span>Pausar</span>
                </>
              )}
            </button>
            
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