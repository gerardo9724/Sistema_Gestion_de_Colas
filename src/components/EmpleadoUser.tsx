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
import EnhancedDeriveTicketModal from './employee/EnhancedDeriveTicketModal';

type TabType = 'queue' | 'profile' | 'stats';

export default function EmpleadoUser() {
  const { state, dispatch, deriveTicketToEmployee, deriveTicketToQueue, autoAssignNextTicket } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [serviceStartTime, setServiceStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeriveModal, setShowDeriveModal] = useState(false); // NEW: Derive modal state
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationComment, setCancellationComment] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const currentUser = state.currentUser;
  const currentEmployee = state.currentEmployee;
  const isPaused = currentEmployee?.isPaused || false;

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileUsername(currentUser.username || '');
    }
  }, [currentUser]);

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
  }, [currentEmployee?.id]); // Only run when employee ID changes (login)

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
      .sort((a, b) => {
        // ENHANCED: Sort by queue type (personal first) then by time
        if (a.queueType === 'personal' && a.assignedToEmployee === currentEmployee.id && 
            b.queueType !== 'personal') return -1;
        if (b.queueType === 'personal' && b.assignedToEmployee === currentEmployee.id && 
            a.queueType !== 'personal') return 1;
        
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    
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
        waitTime,
        // CRITICAL: Clear queue fields when ticket is being served
        queueType: undefined,
        assignedToEmployee: undefined,
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

      // ENHANCED: Use the new auto-assignment system
      if (callNext) {
        try {
          const nextTicket = await autoAssignNextTicket(currentEmployee.id);
          if (nextTicket) {
            setServiceStartTime(new Date());
            setElapsedTime(0);
            setIsTimerRunning(true);
          }
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

  // NEW: Handle ticket derivation
  const handleDeriveTicket = async (
    targetType: 'queue' | 'employee',
    targetId?: string,
    options?: {
      newServiceType?: string;
      priority?: 'normal' | 'high' | 'urgent';
      reason?: string;
      comment?: string;
    }
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
        await deriveTicketToEmployee(currentTicket.id, currentEmployee.id, targetId, options);
        alert('Ticket derivado exitosamente al empleado');
      } else {
        await deriveTicketToQueue(currentTicket.id, currentEmployee.id, options);
        alert('Ticket devuelto a la cola general exitosamente');
      }

      setShowDeriveModal(false);
      setServiceStartTime(null);
      setElapsedTime(0);
      setIsTimerRunning(false);
    } catch (error) {
      console.error('Error deriving ticket:', error);
      alert('Error al derivar el ticket');
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

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    if (!profileName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!profileUsername.trim()) {
      setError('El nombre de usuario es requerido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authService.updateProfile(currentUser.id, {
        name: profileName.trim(),
        username: profileUsername.trim(),
      });
      
      if (result.success) {
        dispatch({ 
          type: 'SET_CURRENT_USER', 
          payload: { 
            ...currentUser, 
            name: profileName.trim(),
            username: profileUsername.trim()
          } 
        });
        
        alert('Perfil actualizado correctamente');
        setShowProfileModal(false);
      } else {
        setError(result.error || 'Error al actualizar perfil');
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

  // ENHANCED: Get waiting tickets with proper queue prioritization
  const waitingTickets = state.tickets
    .filter(ticket => ticket.status === 'waiting')
    .sort((a, b) => {
      // CRITICAL: Personal queue tickets for this employee come first
      const aIsPersonal = a.queueType === 'personal' && a.assignedToEmployee === currentEmployee?.id;
      const bIsPersonal = b.queueType === 'personal' && b.assignedToEmployee === currentEmployee?.id;
      
      if (aIsPersonal && !bIsPersonal) return -1;
      if (bIsPersonal && !aIsPersonal) return 1;
      
      // Then by creation time
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const currentTicket = state.tickets.find(ticket => 
    ticket.status === 'being_served' && ticket.servedBy === currentEmployee?.id
  );

  const tabs = [
    { id: 'queue', name: 'Cola de Tickets', icon: Clock },
    { id: 'stats', name: 'Estadísticas', icon: BarChart3 },
    { id: 'profile', name: 'Mi Perfil', icon: User },
  ];

  const renderQueue = () => (
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
                  {waitingTickets[0].queueType === 'personal' && waitingTickets[0].assignedToEmployee === currentEmployee?.id && (
                    <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                      COLA PERSONAL
                    </span>
                  )}
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
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-4xl font-bold text-gray-800 mb-2">
                    #{currentTicket.number.toString().padStart(3, '0')}
                  </div>
                  <div className="text-xl font-semibold text-gray-600">
                    {currentTicket.serviceType.charAt(0).toUpperCase() + currentTicket.serviceType.slice(1)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Creado: {currentTicket.createdAt.toLocaleTimeString()}
                  </div>
                  {currentTicket.waitTime && (
                    <div className="text-sm text-gray-500">
                      Tiempo de espera: {formatTime(currentTicket.waitTime)}
                    </div>
                  )}
                  {/* NEW: Show derivation info */}
                  {currentTicket.derivedFrom && (
                    <div className="text-sm text-purple-600 font-medium mt-1">
                      Derivado desde: {state.employees.find(e => e.id === currentTicket.derivedFrom)?.name || 'Empleado'}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-2xl font-bold text-green-600">
                    <Timer size={32} />
                    <span>{formatTime(elapsedTime)}</span>
                  </div>
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="mt-2 p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                  >
                    {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => handleCompleteTicket(currentTicket.id)}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle size={20} />
                  <span>Finalizar</span>
                </button>
                
                <button
                  onClick={() => handleCompleteTicket(currentTicket.id, true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <SkipForward size={20} />
                  <span>Finalizar y Siguiente</span>
                </button>
                
                {/* NEW: Derive button */}
                <button
                  onClick={() => setShowDeriveModal(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <ArrowRight size={20} />
                  <span>Derivar</span>
                </button>
                
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <X size={20} />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          </div>
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
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Cola de Espera ({waitingTickets.length})
        </h2>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {waitingTickets.map((ticket, index) => {
            const waitTime = Math.floor((new Date().getTime() - ticket.createdAt.getTime()) / 1000);
            const isPersonalTicket = ticket.queueType === 'personal' && ticket.assignedToEmployee === currentEmployee?.id;
            
            return (
              <div
                key={ticket.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  index === 0 
                    ? 'border-yellow-400 bg-yellow-50' 
                    : isPersonalTicket
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl font-bold text-gray-800">
                        #{ticket.number.toString().padStart(3, '0')}
                      </div>
                      {index === 0 && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                          SIGUIENTE
                        </span>
                      )}
                      {isPersonalTicket && (
                        <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                          COLA PERSONAL
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-semibold text-gray-600">
                      {ticket.serviceType.charAt(0).toUpperCase() + ticket.serviceType.slice(1)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {ticket.createdAt.toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-orange-600 font-medium">
                      Esperando: {formatTime(waitTime)}
                    </div>
                    {/* NEW: Show derivation info */}
                    {ticket.derivedFrom && (
                      <div className="text-sm text-purple-600 font-medium">
                        Derivado desde: {state.employees.find(e => e.id === ticket.derivedFrom)?.name || 'Empleado'}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleStartService(ticket.id)}
                    disabled={currentTicket !== undefined || index !== 0 || isPaused}
                    className={`py-2 px-4 rounded-lg font-semibold transition-colors ${
                      index === 0 && !currentTicket && !isPaused
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {index === 0 && isPaused ? 'Reanudar primero' : index === 0 ? 'Atender' : 'Esperar turno'}
                  </button>
                </div>
              </div>
            );
          })}
          
          {waitingTickets.length === 0 && (
            <div className="text-center py-12">
              <Clock size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-xl text-gray-500">No hay tickets en espera</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas Personales</h2>
        
        {currentEmployee && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Tickets Atendidos</p>
                  <p className="text-3xl font-bold text-green-900">{currentEmployee.totalTicketsServed}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Tickets Cancelados</p>
                  <p className="text-3xl font-bold text-red-900">{currentEmployee.totalTicketsCancelled}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <X className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Eficiencia</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {currentEmployee.totalTicketsServed + currentEmployee.totalTicketsCancelled > 0
                      ? Math.round((currentEmployee.totalTicketsServed / (currentEmployee.totalTicketsServed + currentEmployee.totalTicketsCancelled)) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BarChart3 className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h2>
        
        {currentUser && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <div className="p-3 bg-white border border-gray-300 rounded-lg">
                    {currentUser.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <div className="p-3 bg-white border border-gray-300 rounded-lg">
                    {currentUser.username}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <div className="p-3 bg-white border border-gray-300 rounded-lg">
                    Empleado
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <div className="p-3 bg-white border border-gray-300 rounded-lg">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Activo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Info */}
            {currentEmployee && (
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Información de Empleado</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Posición</label>
                    <div className="p-3 bg-white border border-blue-300 rounded-lg">
                      {currentEmployee.position}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Estado Actual</label>
                    <div className="p-3 bg-white border border-blue-300 rounded-lg">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        currentEmployee.isPaused ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {currentEmployee.isPaused ? 'En Pausa' : 'Disponible'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <Key size={20} />
                <span>Cambiar Contraseña</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
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
                onClick={handleTogglePause}
                disabled={currentTicket !== undefined}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-semibold ${
                  currentTicket 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isPaused 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
                <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
              </button>
              
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

      {/* NEW: Enhanced Derive Ticket Modal */}
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