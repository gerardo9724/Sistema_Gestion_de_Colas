import React, { useRef, useCallback } from 'react';
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
  
  // CRITICAL FIX: Simplified click protection
  const isClickInProgressRef = useRef<boolean>(false);

  // CRITICAL FIX: Simplified click handler
  const handleTogglePauseClick = useCallback(async () => {
    console.log('🔘 HEADER BUTTON CLICKED: Starting toggle pause');

    // CRITICAL: Basic protection against rapid clicks
    if (isClickInProgressRef.current) {
      console.log('🚫 CLICK BLOCKED: Already in progress');
      return;
    }

    // CRITICAL: Validate function exists
    if (typeof onTogglePause !== 'function') {
      console.error('❌ CRITICAL ERROR: onTogglePause is not a function!');
      alert('Error crítico: Función de pausa no disponible');
      return;
    }

    // CRITICAL: Check blocking conditions
    if (hasCurrentTicket) {
      console.log('🚫 ACTION BLOCKED: Employee has current ticket');
      alert('No puedes pausar mientras tienes un ticket en atención. Finaliza el ticket primero.');
      return;
    }

    if (!isConnected) {
      console.log('🚫 ACTION BLOCKED: No Firebase connection');
      alert('Sin conexión a Firebase. Verifica tu conexión a internet.');
      return;
    }

    // CRITICAL: Set protection flag
    isClickInProgressRef.current = true;

    try {
      console.log('🚀 EXECUTING TOGGLE PAUSE');
      
      // CRITICAL FIX: Direct function call without complex timeout handling
      await onTogglePause();
      
      console.log('✅ TOGGLE PAUSE EXECUTED SUCCESSFULLY');
      
    } catch (error) {
      console.error('❌ TOGGLE PAUSE ERROR in header:', error);
      
      let errorMessage = 'Error al cambiar estado de pausa';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      // CRITICAL: Reset click protection after short delay
      setTimeout(() => {
        isClickInProgressRef.current = false;
        console.log('🔓 HEADER: Click protection reset');
      }, 1000);
    }
  }, [onTogglePause, hasCurrentTicket, isConnected]);

  // CRITICAL FIX: Use isActive to determine button state instead of isPaused
  const isEmployeeActive = currentEmployee.isActive;
  const isEmployeePaused = currentEmployee.isPaused;

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
            
            {/* CRITICAL FIX: Button state based on isActive property */}
            <button
              onClick={handleTogglePauseClick}
              disabled={hasCurrentTicket || !isConnected}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-semibold transform relative overflow-hidden ${
                hasCurrentTicket || !isConnected
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                  : !isEmployeeActive // If not active (paused), show green resume button
                    ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl' 
                    : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
              }`}
              title={
                !isConnected ? 'Sin conexión a Firebase' :
                hasCurrentTicket ? 'No se puede pausar con ticket activo' :
                isClickInProgressRef.current ? 'Procesando...' :
                !isEmployeeActive ? 'Reanudar y buscar tickets disponibles' : 'Pausar atención'
              }
            >
              {/* CRITICAL: Show loading state when processing */}
              {isClickInProgressRef.current ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : !isEmployeeActive ? ( // If not active, show resume
                <>
                  <Play size={20} className={!hasCurrentTicket && isConnected ? "animate-pulse" : ""} />
                  <span>Reanudar</span>
                </>
              ) : ( // If active, show pause
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