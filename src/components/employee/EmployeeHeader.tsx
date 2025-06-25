import React, { useRef, useCallback, useMemo } from 'react';
import { LogOut, Play, Pause, Clock, Wifi, WifiOff, Bug } from 'lucide-react';
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
  
  // CRITICAL FIX: Debounce click protection with simpler approach
  const isClickInProgressRef = useRef<boolean>(false);
  const lastClickTimeRef = useRef<number>(0);

  // CRITICAL FIX: Use ONLY database state for button logic (ignore prop isPaused)
  const buttonState = useMemo(() => {
    const dbIsActive = currentEmployee.isActive;
    const dbIsPaused = currentEmployee.isPaused;
    
    // CRITICAL: Log state for debugging
    const currentTime = Date.now();
    if (currentTime - lastClickTimeRef.current > 2000) { // Log only every 2 seconds max
      console.log('🎨 HEADER STATE: Button state calculated from DB', {
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        dbIsActive,
        dbIsPaused,
        hasCurrentTicket,
        buttonAction: dbIsActive ? 'PAUSE' : 'RESUME',
        propIsPaused: isPaused, // For comparison only
        stateConsistency: dbIsActive === !dbIsPaused ? 'CONSISTENT' : 'INCONSISTENT'
      });
      lastClickTimeRef.current = currentTime;
    }

    return {
      isActive: dbIsActive,
      isPaused: dbIsPaused,
      shouldShowResume: !dbIsActive, // If not active in DB, show resume
      shouldShowPause: dbIsActive,   // If active in DB, show pause
      isDisabled: hasCurrentTicket || !isConnected || isClickInProgressRef.current
    };
  }, [currentEmployee.isActive, currentEmployee.isPaused, hasCurrentTicket, isConnected, currentEmployee.id, currentEmployee.name, isPaused]);

  // CRITICAL FIX: Optimized click handler with better debouncing
  const handleTogglePauseClick = useCallback(async () => {
    const now = Date.now();
    
    // CRITICAL: Prevent rapid clicks (minimum 2 seconds between clicks)
    if (now - lastClickTimeRef.current < 2000) {
      console.log('🚫 CLICK BLOCKED: Too rapid, ignoring click');
      return;
    }

    // CRITICAL: Prevent multiple simultaneous executions
    if (isClickInProgressRef.current) {
      console.log('🚫 CLICK BLOCKED: Already in progress');
      return;
    }

    // CRITICAL: Validate function exists
    if (typeof onTogglePause !== 'function') {
      console.error('❌ CRITICAL ERROR: onTogglePause is not a function!');
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

    // CRITICAL: Set protection flags
    isClickInProgressRef.current = true;
    lastClickTimeRef.current = now;

    console.log('🚀 EXECUTING TOGGLE PAUSE', {
      currentState: buttonState,
      timestamp: new Date().toISOString()
    });

    try {
      // CRITICAL: Execute the toggle function
      await onTogglePause();
      
      console.log('✅ TOGGLE PAUSE COMPLETED SUCCESSFULLY');
      
    } catch (error) {
      console.error('❌ TOGGLE PAUSE ERROR:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error: ${errorMessage}`);
      
    } finally {
      // CRITICAL: Reset click protection after delay
      setTimeout(() => {
        isClickInProgressRef.current = false;
        console.log('🔓 HEADER: Click protection reset');
      }, 1500); // Increased delay to prevent rapid clicks
    }
  }, [onTogglePause, hasCurrentTicket, isConnected, buttonState]);

  // CRITICAL FIX: Memoize button styling to prevent re-calculations
  const buttonStyling = useMemo(() => {
    const baseClasses = "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-semibold transform relative overflow-hidden";
    
    if (buttonState.isDisabled) {
      return `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed opacity-50`;
    }
    
    if (buttonState.shouldShowResume) {
      return `${baseClasses} bg-green-500 hover:bg-green-600 active:bg-green-700 text-white hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`;
    } else {
      return `${baseClasses} bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`;
    }
  }, [buttonState.isDisabled, buttonState.shouldShowResume]);

  // CRITICAL FIX: Memoize button content to prevent re-renders
  const buttonContent = useMemo(() => {
    if (isClickInProgressRef.current) {
      return (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Procesando...</span>
        </>
      );
    }
    
    if (buttonState.shouldShowResume) {
      return (
        <>
          <Play size={20} className={!hasCurrentTicket && isConnected ? "animate-pulse" : ""} />
          <span>Reanudar</span>
        </>
      );
    } else {
      return (
        <>
          <Pause size={20} />
          <span>Pausar</span>
        </>
      );
    }
  }, [buttonState.shouldShowResume, hasCurrentTicket, isConnected]);

  // CRITICAL FIX: Memoize button title to prevent re-calculations
  const buttonTitle = useMemo(() => {
    if (!isConnected) return 'Sin conexión a Firebase';
    if (hasCurrentTicket) return 'No se puede pausar con ticket activo';
    if (isClickInProgressRef.current) return 'Procesando...';
    if (buttonState.shouldShowResume) return 'Reanudar y buscar tickets disponibles';
    return 'Pausar atención';
  }, [isConnected, hasCurrentTicket, buttonState.shouldShowResume]);

  // CRITICAL NEW: Debug state for validation
  const debugState = useMemo(() => {
    return {
      dbIsActive: currentEmployee.isActive,
      dbIsPaused: currentEmployee.isPaused,
      propIsPaused: isPaused,
      hasTicket: hasCurrentTicket,
      buttonAction: buttonState.shouldShowResume ? 'RESUME' : 'PAUSE',
      isConsistent: currentEmployee.isActive === !currentEmployee.isPaused,
      timestamp: new Date().toLocaleTimeString()
    };
  }, [currentEmployee.isActive, currentEmployee.isPaused, isPaused, hasCurrentTicket, buttonState.shouldShowResume]);

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
            
            {/* CRITICAL NEW: DEBUG STATE LABEL - TEMPORARY FOR VALIDATION */}
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
                  <span className="text-yellow-700">Botón:</span>
                  <span className={`font-bold ${debugState.buttonAction === 'RESUME' ? 'text-green-600' : 'text-orange-600'}`}>
                    {debugState.buttonAction}
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
            
            {/* CRITICAL FIX: Optimized button with memoized properties */}
            <button
              onClick={handleTogglePauseClick}
              disabled={buttonState.isDisabled}
              className={buttonStyling}
              title={buttonTitle}
            >
              {buttonContent}
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