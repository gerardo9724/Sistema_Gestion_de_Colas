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
  
  // CRITICAL DEBUG: Log the current state and function availability
  console.log('🔍 EMPLOYEE HEADER DEBUG:', {
    employeeName: currentEmployee.name,
    employeeId: currentEmployee.id,
    isPaused,
    hasCurrentTicket,
    currentTicketId: currentEmployee.currentTicketId,
    onTogglePauseType: typeof onTogglePause,
    onTogglePauseExists: !!onTogglePause,
    buttonShouldBeDisabled: hasCurrentTicket,
    buttonShouldWork: !hasCurrentTicket,
    isConnected
  });

  // CRITICAL FIX: Enhanced click handler with comprehensive validation and error handling
  const handleTogglePauseClick = async () => {
    console.log('🔘 HEADER BUTTON CLICKED: Starting toggle pause process', {
      action: isPaused ? 'RESUME' : 'PAUSE',
      currentState: isPaused ? 'PAUSED' : 'ACTIVE',
      hasCurrentTicket,
      willExecute: !hasCurrentTicket,
      functionAvailable: typeof onTogglePause === 'function',
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name
    });

    // CRITICAL: Validate function exists before calling
    if (typeof onTogglePause !== 'function') {
      console.error('❌ CRITICAL ERROR: onTogglePause is not a function!', {
        type: typeof onTogglePause,
        value: onTogglePause,
        employeeId: currentEmployee.id
      });
      alert('Error crítico: Función de pausa no disponible');
      return;
    }

    // CRITICAL: Check if action should be blocked
    if (hasCurrentTicket) {
      console.log('🚫 ACTION BLOCKED: Employee has current ticket', {
        currentTicketId: currentEmployee.currentTicketId,
        employeeId: currentEmployee.id
      });
      alert('No puedes pausar mientras tienes un ticket en atención. Finaliza el ticket primero.');
      return;
    }

    // CRITICAL: Check Firebase connection
    if (!isConnected) {
      console.log('🚫 ACTION BLOCKED: No Firebase connection');
      alert('Sin conexión a Firebase. Verifica tu conexión a internet.');
      return;
    }

    try {
      console.log('🚀 EXECUTING TOGGLE PAUSE: Calling function...');
      
      // CRITICAL FIX: Add loading state and timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La operación tardó demasiado')), 10000);
      });

      await Promise.race([
        onTogglePause(),
        timeoutPromise
      ]);
      
      console.log('✅ TOGGLE PAUSE EXECUTED SUCCESSFULLY');
      
    } catch (error) {
      console.error('❌ TOGGLE PAUSE ERROR in header:', error);
      
      let errorMessage = 'Error desconocido al cambiar estado de pausa';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Error al cambiar estado de pausa: ${errorMessage}`);
    }
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
            
            {/* CRITICAL FIX: Resume/Pause Button with enhanced validation and visual feedback */}
            <button
              onClick={handleTogglePauseClick}
              disabled={hasCurrentTicket || !isConnected} // CRITICAL: Also disable when no connection
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-semibold transform relative overflow-hidden ${
                hasCurrentTicket || !isConnected
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                  : isPaused 
                    ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl' 
                    : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
              }`}
              title={
                !isConnected ? 'Sin conexión a Firebase' :
                hasCurrentTicket ? 'No se puede pausar con ticket activo' : 
                isPaused ? 'Reanudar y buscar tickets disponibles' : 'Pausar atención'
              }
            >
              {/* Visual feedback for button press */}
              <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150"></div>
              
              {isPaused ? (
                <>
                  <Play size={20} className={!hasCurrentTicket && isConnected ? "animate-pulse" : ""} />
                  <span>Reanudar</span>
                </>
              ) : (
                <>
                  <Pause size={20} />
                  <span>Pausar</span>
                </>
              )}
              
              {/* Connection indicator */}
              {!isConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
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