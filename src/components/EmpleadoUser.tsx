import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  CheckCircle, 
  SkipForward, 
  Play, 
  Pause, 
  LogOut, 
  Coffee, 
  X, 
  AlertTriangle,
  Users,
  Timer,
  Key,
  Edit,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { authService } from '../services/authService';
import { ticketService } from '../services/ticketService';
import { employeeService } from '../services/employeeService';
import { derivationWorkflowService } from '../services/derivationWorkflowService';
import EmployeeHeader from './employee/EmployeeHeader';
import CurrentTicketCard from './employee/CurrentTicketCard';
import QueueList from './employee/QueueList';
import QueueStatusCard from './employee/QueueStatusCard';
import EmployeeStats from './employee/EmployeeStats';
import EmployeeProfile from './employee/EmployeeProfile';
import EnhancedDeriveTicketModal from './employee/EnhancedDeriveTicketModal';

type TabType = 'queue' | 'profile' | 'stats';

export default function EmpleadoUser() {
  const { state, dispatch, getEmployeeQueueStats, autoAssignNextTicket } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [serviceStartTime, setServiceStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeriveModal, setShowDeriveModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationComment, setCancellationComment] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [queueStats, setQueueStats] = useState({
    personalQueueCount: 0,
    generalQueueCount: 0,
    totalWaitingCount: 0,
    nextTicketType: 'none' as 'personal' | 'general' | 'none'
  });

  const currentUser = state.currentUser;
  const currentEmployee = state.currentEmployee;
  const isPaused = currentEmployee?.isPaused || false;

  // Load queue statistics
  useEffect(() => {
    const loadQueueStats = async () => {
      if (currentEmployee) {
        try {
          const stats = await getEmployeeQueueStats(currentEmployee.id);
          setQueueStats(stats);
        } catch (error) {
          console.error('Error loading queue stats:', error);
        }
      }
    };

    loadQueueStats();
    // Refresh stats every 10 seconds
    const interval = setInterval(loadQueueStats, 10000);
    return () => clearInterval(interval);
  }, [currentEmployee?.id, getEmployeeQueueStats]);

  // Auto-pause employee on login
  useEffect(() => {
    const initializeEmployeePauseState = async () => {
      if (currentEmployee && !currentEmployee.isPaused) {
        try {
          await employeeService.updateEmployee(currentEmployee.id, {
            ...currentEmployee,
            isPaused: true
          });
        } catch (error) {
          console.error('Error setting initial pause state:', error);
        }
      }
    };

    initializeEmployeePauseState();
  }, [currentEmployee?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && serviceStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - serviceStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, serviceStartTime]);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleTogglePause = async () => {
    if (!currentEmployee) return;

    const currentTicket = state.tickets.find(t => 
      t.status === 'being_served' && t.servedBy === currentEmployee.id
    );

    if (currentTicket) {
      alert('No puedes pausar mientras tienes un ticket en atención. Finaliza el ticket primero.');
      return;
    }
    
    try {
      await employeeService.updateEmployee(currentEmployee.id, {
        ...currentEmployee,
        isPaused: !currentEmployee.isPaused
      });
    } catch (error) {
      console.error('Error toggling pause:', error);
      alert('Error al cambiar estado de pausa');
    }
  };

  const handleStartService = async (ticketId: string) => {
    if (!currentEmployee) return;

    // Check if this is the next ticket in sequence
    const waitingTickets = state.tickets
      .filter(t => t.status === 'waiting')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    if (waitingTickets.length === 0) {
      alert('No hay tickets en espera');
      return;
    }

    const nextTicket = waitingTickets[0];
    if (nextTicket.id !== ticketId) {
      alert('Solo puedes atender el siguiente ticket en la secuencia');
      return;
    }

    try {
      const now = new Date();
      const waitTime = Math.floor((now.getTime() - nextTicket.createdAt.getTime()) / 1000);
      
      await ticketService.updateTicket(ticketId, {
        status: 'being_served',
        servedBy: currentEmployee.id,
        servedAt: now,
        waitTime
      });

      await employeeService.updateEmployee(currentEmployee.id, {
        ...currentEmployee,
        currentTicketId: ticketId,
        isPaused: false
      });

      setServiceStartTime(now);
      setElapsedTime(0);
      setIsTimerRunning(true);
    } catch (error) {
      console.error('Error starting service:', error);
      alert('Error al iniciar la atención del ticket');
    }
  };

  const handleCompleteTicket = async (ticketId: string, callNext: boolean = false) => {
    if (!currentEmployee || !serviceStartTime) return;

    const serviceTime = Math.floor((new Date().getTime() - serviceStartTime.getTime()) / 1000);
    const ticket = state.tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const totalTime = Math.floor((new Date().getTime() - ticket.createdAt.getTime()) / 1000);
    
    try {
      await ticketService.updateTicket(ticketId, {
        status: 'completed',
        completedAt: new Date(),
        serviceTime,
        totalTime
      });

      await employeeService.updateEmployee(currentEmployee.id, {
        ...currentEmployee,
        currentTicketId: undefined,
        totalTicketsServed: currentEmployee.totalTicketsServed + 1,
        isPaused: !callNext
      });
      
      setServiceStartTime(null);
      setElapsedTime(0);
      setIsTimerRunning(false);

      if (callNext) {
        // Use the auto-assign function from context
        try {
          await autoAssignNextTicket(currentEmployee.id);
        } catch (error) {
          console.error('Error auto-assigning next ticket:', error);
        }
      }
    } catch (error) {
      console.error('Error completing ticket:', error);
      alert('Error al completar el ticket');
    }
  };

  const handleCancelTicket = async () => {
    if (!currentEmployee) return;

    const currentTicket = state.tickets.find(t => 
      t.status === 'being_served' && t.servedBy === currentEmployee.id
    );

    if (!currentTicket) return;

    if (!cancellationReason.trim()) {
      setError('Debe seleccionar un motivo de cancelación');
      return;
    }

    if (!cancellationComment.trim()) {
      setError('Debe especificar un comentario explicando el motivo de la cancelación');
      return;
    }

    try {
      const totalTime = Math.floor((new Date().getTime() - currentTicket.createdAt.getTime()) / 1000);
      
      await ticketService.updateTicket(currentTicket.id, {
        status: 'cancelled',
        cancelledAt: new Date(),
        totalTime,
        cancellationReason,
        cancellationComment,
        cancelledBy: currentEmployee.id
      });

      await employeeService.updateEmployee(currentEmployee.id, {
        ...currentEmployee,
        currentTicketId: undefined,
        totalTicketsCancelled: currentEmployee.totalTicketsCancelled + 1,
        isPaused: true
      });

      setServiceStartTime(null);
      setElapsedTime(0);
      setIsTimerRunning(false);
      setShowCancelModal(false);
      setCancellationReason('');
      setCancellationComment('');
      setError('');
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      alert('Error al cancelar el ticket');
    }
  };

  const handleDeriveTicket = async (
    targetType: 'queue' | 'employee',
    targetId?: string,
    options?: any
  ) => {
    if (!currentEmployee) return;

    const currentTicket = state.tickets.find(t => 
      t.status === 'being_served' && t.servedBy === currentEmployee.id
    );

    if (!currentTicket) {
      alert('No hay ticket en atención para derivar');
      return;
    }

    setIsLoading(true);
    try {
      if (targetType === 'employee' && targetId) {
        // Derive to specific employee
        await derivationWorkflowService.deriveTicketComplete(
          currentTicket.id,
          currentEmployee.id,
          targetId,
          options
        );
      } else {
        // Derive to general queue
        await derivationWorkflowService.deriveTicketToGeneralQueue(
          currentTicket.id,
          currentEmployee.id,
          options
        );
      }

      setShowDeriveModal(false);
      setServiceStartTime(null);
      setElapsedTime(0);
      setIsTimerRunning(false);
      
      alert('Ticket derivado exitosamente');
    } catch (error) {
      console.error('Error deriving ticket:', error);
      alert('Error al derivar ticket: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 3) {
      setError('La contraseña debe tener al menos 3 caracteres');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authService.updatePassword(currentUser.id, newPassword);
      
      if (result.success) {
        alert('Contraseña actualizada correctamente');
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Error al actualizar contraseña');
      }
    } catch (error) {
      setError('Error interno del servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const waitingTickets = state.tickets
    .filter(ticket => ticket.status === 'waiting')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const currentTicket = state.tickets.find(ticket => 
    ticket.status === 'being_served' && ticket.servedBy === currentEmployee?.id
  );

  const tabs = [
    { id: 'queue', name: 'Cola de Tickets', icon: Clock },
    { id: 'stats', name: 'Estadísticas', icon: BarChart3 },
    { id: 'profile', name: 'Mi Perfil', icon: User },
  ];

  const renderQueue = () => (
    <div className="space-y-6">
      {/* Queue Status Card */}
      <QueueStatusCard
        personalQueueCount={queueStats.personalQueueCount}
        generalQueueCount={queueStats.generalQueueCount}
        nextTicketType={queueStats.nextTicketType}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Service */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Servicio Actual</h2>
          
          {isPaused ? (
            <div className="text-center py-12">
              <Coffee size={64} className="mx-auto text-orange-400 mb-4" />
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
              <button
                onClick={handleTogglePause}
                disabled={waitingTickets.length === 0}
                className={`py-3 px-8 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 mx-auto ${
                  waitingTickets.length > 0
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Play size={20} />
                <span>Reanudar</span>
              </button>
            </div>
          ) : currentTicket ? (
            <CurrentTicketCard
              ticket={currentTicket}
              elapsedTime={elapsedTime}
              isTimerRunning={isTimerRunning}
              onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
              onCompleteTicket={(callNext) => handleCompleteTicket(currentTicket.id, callNext)}
              onCancelTicket={() => setShowCancelModal(true)}
              onDeriveTicket={() => setShowDeriveModal(true)}
            />
          ) : (
            <div className="text-center py-12">
              <User size={64} className="mx-auto text-gray-300 mb-4" />
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

        {/* Waiting Queue */}
        <QueueList
          tickets={waitingTickets}
          currentTicket={currentTicket}
          isPaused={isPaused}
          onStartService={handleStartService}
        />
      </div>
    </div>
  );

  const renderStats = () => (
    currentEmployee ? <EmployeeStats employee={currentEmployee} /> : null
  );

  const renderProfile = () => (
    currentUser && currentEmployee ? (
      <EmployeeProfile
        currentUser={currentUser}
        currentEmployee={currentEmployee}
        onChangePassword={() => setShowPasswordModal(true)}
        onUpdateProfile={() => {}} // Disabled for employees
      />
    ) : null
  );

  if (!currentUser || !currentEmployee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <User size={64} className="mx-auto" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <EmployeeHeader
        currentUser={currentUser}
        currentEmployee={currentEmployee}
        isConnected={state.isFirebaseConnected}
        isPaused={isPaused}
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
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent size={20} />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'queue' && renderQueue()}
            {activeTab === 'stats' && renderStats()}
            {activeTab === 'profile' && renderProfile()}
          </div>
        </div>
      </div>

      {/* Cancel Ticket Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle size={32} className="text-red-500" />
              <h3 className="text-2xl font-bold text-gray-800">Cancelar Ticket</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas cancelar el ticket #{currentTicket?.number.toString().padStart(3, '0')}?
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de cancelación *
                  </label>
                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona un motivo</option>
                    <option value="Cliente no se presentó">Cliente no se presentó</option>
                    <option value="Documentación incompleta">Documentación incompleta</option>
                    <option value="Problema técnico">Problema técnico</option>
                    <option value="Solicitud del cliente">Solicitud del cliente</option>
                    <option value="Tiempo de espera excedido">Tiempo de espera excedido</option>
                    <option value="Emergencia">Emergencia</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentario adicional *
                  </label>
                  <textarea
                    value={cancellationComment}
                    onChange={(e) => setCancellationComment(e.target.value)}
                    placeholder="Especifica el motivo detallado de la cancelación..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                  setCancellationComment('');
                  setError('');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCancelTicket}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Key size={32} className="text-orange-500" />
              <h3 className="text-2xl font-bold text-gray-800">Cambiar Contraseña</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ingresa tu nueva contraseña"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Confirma tu nueva contraseña"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setError('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isLoading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Actualizando...' : 'Cambiar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Derive Ticket Modal */}
      {showDeriveModal && currentTicket && (
        <EnhancedDeriveTicketModal
          ticket={currentTicket}
          employees={state.employees}
          serviceCategories={state.serviceCategories}
          onClose={() => setShowDeriveModal(false)}
          onDerive={handleDeriveTicket}
        />
      )}
    </div>
  );
}