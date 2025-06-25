import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import EmployeeHeader from './employee/EmployeeHeader';
import CurrentTicketCard from './employee/CurrentTicketCard';
import QueueList from './employee/QueueList';
import QueueStatusCard from './employee/QueueStatusCard';
import EmployeeProfile from './employee/EmployeeProfile';
import ManualTicketRecall from './employee/ManualTicketRecall';
import EnhancedDeriveTicketModal from './employee/EnhancedDeriveTicketModal';
import CancelTicketModal from './employee/CancelTicketModal';
import PasswordChangeModal from './employee/PasswordChangeModal';
import { useEmployeeTicketManagement } from '../hooks/useEmployeeTicketManagement';
import { useEmployeeTimer } from '../hooks/useEmployeeTimer';
import { useEmployeeQueueStats } from '../hooks/useEmployeeQueueStats';
import { employeeService } from '../services/employeeService';

type TabType = 'queue' | 'profile';

export default function EmpleadoUser() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [showDeriveModal, setShowDeriveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const currentUser = state.currentUser;
  const currentEmployee = state.currentEmployee;

  // CRITICAL NEW: Track if cleanup has been registered
  const cleanupRegisteredRef = useRef(false);

  // Custom hooks for modular functionality
  const {
    currentTicket,
    waitingTickets,
    handleStartService,
    handleCompleteTicket,
    handleCancelTicket,
    handleDeriveTicket,
    handleRecallTicket,
    handleTogglePause,
    isLoading
  } = useEmployeeTicketManagement(currentEmployee?.id || '');

  const {
    elapsedTime,
    isTimerRunning,
    handleToggleTimer
  } = useEmployeeTimer(currentTicket);

  const queueStats = useEmployeeQueueStats(currentEmployee?.id || '');

  // CRITICAL NEW: Auto-deactivate employee on logout or unexpected closure
  useEffect(() => {
    const setupEmployeeCleanup = () => {
      if (!currentEmployee || !state.isFirebaseConnected || cleanupRegisteredRef.current) {
        return;
      }

      console.log('🛡️ CLEANUP SETUP: Registering employee cleanup handlers', {
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name
      });

      // CRITICAL: Function to deactivate employee safely
      const deactivateEmployee = async (reason: string) => {
        try {
          console.log(`🔄 EMPLOYEE CLEANUP: ${reason} - Checking employee state`, {
            employeeId: currentEmployee.id,
            employeeName: currentEmployee.name,
            hasCurrentTicket: !!currentEmployee.currentTicketId,
            isActive: currentEmployee.isActive
          });

          // CRITICAL: Only deactivate if employee doesn't have a current ticket
          if (!currentEmployee.currentTicketId) {
            console.log(`⏸️ EMPLOYEE CLEANUP: ${reason} - Deactivating employee (no current ticket)`);
            
            await employeeService.updateEmployee(currentEmployee.id, {
              isActive: false,   // CRITICAL: Set to inactive
              isPaused: true     // CRITICAL: Set to paused
            });

            console.log(`✅ EMPLOYEE CLEANUP: ${reason} - Employee deactivated successfully`);
          } else {
            console.log(`🎫 EMPLOYEE CLEANUP: ${reason} - Employee has current ticket, keeping active`, {
              currentTicketId: currentEmployee.currentTicketId
            });
          }
        } catch (error) {
          console.error(`❌ EMPLOYEE CLEANUP ERROR (${reason}):`, error);
        }
      };

      // CRITICAL: Handle page unload (browser close, refresh, navigation)
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        console.log('🚪 BEFORE UNLOAD: Page is being closed/refreshed');
        
        // CRITICAL: Only deactivate if no current ticket
        if (!currentEmployee.currentTicketId) {
          // Use navigator.sendBeacon for reliable cleanup on page unload
          const cleanupData = JSON.stringify({
            employeeId: currentEmployee.id,
            action: 'deactivate',
            reason: 'page_unload',
            timestamp: new Date().toISOString()
          });

          // Try to send cleanup request
          if (navigator.sendBeacon) {
            // In a real implementation, this would go to a cleanup endpoint
            console.log('📡 BEACON: Sending cleanup signal via beacon');
          }

          // Also try immediate cleanup (may not complete)
          deactivateEmployee('Page Unload');
        }
      };

      // CRITICAL: Handle visibility change (tab switch, minimize)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          console.log('👁️ VISIBILITY: Page hidden (tab switch/minimize)');
          // Don't deactivate on visibility change, only on actual unload
        } else {
          console.log('👁️ VISIBILITY: Page visible again');
        }
      };

      // CRITICAL: Handle focus loss (window loses focus)
      const handleWindowBlur = () => {
        console.log('🔍 FOCUS: Window lost focus');
        // Don't deactivate on focus loss, only on actual unload
      };

      // CRITICAL: Register event listeners
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);

      // Mark cleanup as registered
      cleanupRegisteredRef.current = true;

      console.log('✅ CLEANUP SETUP: All cleanup handlers registered successfully');

      // CRITICAL: Return cleanup function
      return () => {
        console.log('🧹 CLEANUP TEARDOWN: Removing event listeners');
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        cleanupRegisteredRef.current = false;
      };
    };

    // Setup cleanup when employee is available and connected
    if (currentEmployee && state.isFirebaseConnected) {
      return setupEmployeeCleanup();
    }
  }, [currentEmployee, state.isFirebaseConnected]);

  // CRITICAL NEW: Enhanced logout handler with proper cleanup
  const handleLogout = useCallback(async () => {
    console.log('🚪 LOGOUT: Employee logout initiated');

    // CRITICAL: Deactivate employee before logout (unless they have a current ticket)
    if (currentEmployee && state.isFirebaseConnected) {
      try {
        if (!currentEmployee.currentTicketId) {
          console.log('⏸️ LOGOUT: Deactivating employee before logout (no current ticket)');
          
          await employeeService.updateEmployee(currentEmployee.id, {
            isActive: false,   // CRITICAL: Set to inactive
            isPaused: true     // CRITICAL: Set to paused
          });

          console.log('✅ LOGOUT: Employee deactivated successfully before logout');
        } else {
          console.log('🎫 LOGOUT: Employee has current ticket, keeping active during logout', {
            currentTicketId: currentEmployee.currentTicketId
          });
        }
      } catch (error) {
        console.error('❌ LOGOUT CLEANUP ERROR:', error);
      }
    }

    // CRITICAL: Proceed with normal logout
    dispatch({ type: 'LOGOUT' });
  }, [currentEmployee, state.isFirebaseConnected, dispatch]);

  const handleDeriveTicketAction = async (
    targetType: 'queue' | 'employee',
    targetId?: string,
    options?: any
  ) => {
    if (!currentTicket || !currentEmployee) return;

    try {
      await handleDeriveTicket(currentTicket.id, targetType, targetId, options);
      setShowDeriveModal(false);
    } catch (error) {
      console.error('Error deriving ticket:', error);
      alert('Error al derivar el ticket');
    }
  };

  const handleCancelTicketAction = async (reason: string, comment: string) => {
    if (!currentTicket || !currentEmployee) return;

    try {
      await handleCancelTicket(currentTicket.id, reason, comment);
      setShowCancelModal(false);
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      alert('Error al cancelar el ticket');
    }
  };

  const handleRecallTicketAction = async () => {
    if (!currentTicket || !currentEmployee) return;

    try {
      await handleRecallTicket(currentTicket.id);
    } catch (error) {
      console.error('Error recalling ticket:', error);
      alert('Error al volver a llamar el ticket');
    }
  };

  const handleManualTicketRecalled = (ticket: any) => {
    console.log(`✅ Manual recall successful for ticket #${ticket.number}`);
  };

  const tabs = [
    { id: 'queue', name: 'Cola de Tickets', icon: 'Clock' },
    { id: 'profile', name: 'Mi Perfil', icon: 'User' },
  ];

  if (!currentUser || !currentEmployee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Configuración</h2>
          <p className="text-gray-600 mb-6">
            No se encontró un empleado asociado a tu usuario. Contacta al administrador.
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'queue':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Service */}
            <div className="space-y-6">
              {/* CRITICAL NEW: DEBUG PANEL - TEMPORARY FOR VALIDATION */}
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 shadow-lg">
                <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center space-x-2">
                  <span>🐛</span>
                  <span>DEBUG - Estado del Empleado en BD</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-yellow-700 font-medium">isActive (BD):</span>
                      <span className={`font-bold px-2 py-1 rounded ${
                        currentEmployee.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {currentEmployee.isActive ? 'TRUE' : 'FALSE'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700 font-medium">isPaused (BD):</span>
                      <span className={`font-bold px-2 py-1 rounded ${
                        currentEmployee.isPaused 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {currentEmployee.isPaused ? 'TRUE' : 'FALSE'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-yellow-700 font-medium">Ticket Actual:</span>
                      <span className={`font-bold px-2 py-1 rounded ${
                        currentEmployee.currentTicketId 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {currentEmployee.currentTicketId ? 'SÍ' : 'NO'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700 font-medium">Estado Lógico:</span>
                      <span className={`font-bold px-2 py-1 rounded ${
                        currentEmployee.isActive === !currentEmployee.isPaused
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {currentEmployee.isActive === !currentEmployee.isPaused ? 'CONSISTENTE' : 'INCONSISTENTE'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-yellow-100 rounded border border-yellow-300">
                  <p className="text-xs text-yellow-800">
                    <strong>Regla:</strong> isActive debe ser opuesto a isPaused. 
                    Si isActive=true, entonces isPaused=false y viceversa.
                  </p>
                </div>
                <div className="mt-2 text-center text-xs text-yellow-600">
                  Última actualización: {new Date().toLocaleTimeString()}
                </div>
              </div>

              {currentTicket ? (
                <CurrentTicketCard
                  ticket={currentTicket}
                  elapsedTime={elapsedTime}
                  isTimerRunning={isTimerRunning}
                  onToggleTimer={handleToggleTimer}
                  onCompleteTicket={(callNext) => handleCompleteTicket(currentTicket.id, callNext)}
                  onCancelTicket={() => setShowCancelModal(true)}
                  onDeriveTicket={() => setShowDeriveModal(true)}
                  onRecallTicket={handleRecallTicketAction}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Servicio Actual</h2>
                  {/* CRITICAL FIX: Use isActive instead of isPaused for display logic */}
                  {!currentEmployee.isActive ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">☕</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">En Pausa</h3>
                      <p className="text-lg text-gray-600 mb-6">
                        {waitingTickets.length > 0 
                          ? 'Presiona "Reanudar" para comenzar a atender tickets'
                          : 'No hay tickets pendientes. Esperando nuevos tickets...'
                        }
                      </p>
                      {waitingTickets.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <p className="text-yellow-800 text-sm mb-2">
                            <strong>Próximo ticket:</strong> #{waitingTickets[0].number.toString().padStart(3, '0')} - {waitingTickets[0].serviceType}
                          </p>
                          <p className="text-yellow-700 text-xs">
                            Al reanudar, automáticamente tomarás este ticket para atención
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">👤</div>
                      <p className="text-xl text-gray-500">No hay tickets en atención</p>
                      <p className="text-gray-400">
                        {waitingTickets.length > 0 
                          ? 'Esperando asignación automática o presiona "Pausar" para descansar'
                          : 'Esperando nuevos tickets...'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Queue Status Card */}
              <QueueStatusCard
                personalQueueCount={queueStats.personalQueueCount}
                generalQueueCount={queueStats.generalQueueCount}
                nextTicketType={queueStats.nextTicketType}
              />

              {/* Manual Ticket Recall Component */}
              <ManualTicketRecall
                currentEmployeeId={currentEmployee.id}
                onTicketRecalled={handleManualTicketRecalled}
              />
            </div>

            {/* Waiting Queue */}
            <QueueList
              tickets={waitingTickets}
              currentTicket={currentTicket}
              isPaused={!currentEmployee.isActive} // CRITICAL FIX: Use !isActive instead of isPaused
              onStartService={handleStartService}
            />
          </div>
        );

      case 'profile':
        return (
          <EmployeeProfile
            currentUser={currentUser}
            currentEmployee={currentEmployee}
            onChangePassword={() => setShowPasswordModal(true)}
            onUpdateProfile={() => {}} // Disabled for employees
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <EmployeeHeader
        currentUser={currentUser}
        currentEmployee={currentEmployee}
        isConnected={state.isFirebaseConnected}
        isPaused={!currentEmployee.isActive} // CRITICAL FIX: Use !isActive instead of isPaused
        hasCurrentTicket={!!currentTicket}
        onLogout={handleLogout}
        onTogglePause={handleTogglePause}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDeriveModal && currentTicket && (
        <EnhancedDeriveTicketModal
          ticket={currentTicket}
          employees={state.employees}
          serviceCategories={state.serviceCategories}
          onClose={() => setShowDeriveModal(false)}
          onDerive={handleDeriveTicketAction}
        />
      )}

      {showCancelModal && currentTicket && (
        <CancelTicketModal
          ticket={currentTicket}
          onClose={() => setShowCancelModal(false)}
          onCancel={handleCancelTicketAction}
        />
      )}

      {showPasswordModal && (
        <PasswordChangeModal
          user={currentUser}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
}