import React, { useState, useEffect } from 'react';
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

type TabType = 'queue' | 'profile';

export default function EmpleadoUser() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [showDeriveModal, setShowDeriveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const currentUser = state.currentUser;
  const currentEmployee = state.currentEmployee;

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

  // Auto-pause employee on login
  useEffect(() => {
    const initializeEmployeePauseState = async () => {
      if (currentEmployee && !currentEmployee.isPaused && !currentEmployee.currentTicketId) {
        try {
          await handleTogglePause();
        } catch (error) {
          console.error('Error setting initial pause state:', error);
        }
      }
    };

    initializeEmployeePauseState();
  }, [currentEmployee?.id]);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

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
    // El estado se actualizará automáticamente a través de los listeners en tiempo real
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
                  {currentEmployee.isPaused ? (
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
                          ? 'Presiona "Reanudar" para tomar el siguiente ticket'
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

              {/* NEW: Manual Ticket Recall Component */}
              <ManualTicketRecall
                currentEmployeeId={currentEmployee.id}
                onTicketRecalled={handleManualTicketRecalled}
              />
            </div>

            {/* Waiting Queue */}
            <QueueList
              tickets={waitingTickets}
              currentTicket={currentTicket}
              isPaused={currentEmployee.isPaused}
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
        isPaused={currentEmployee.isPaused}
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