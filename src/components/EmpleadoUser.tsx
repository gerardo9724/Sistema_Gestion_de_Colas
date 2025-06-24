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
  Volume2,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { authService } from '../services/authService';
import { ticketService } from '../services/ticketService';
import { employeeService } from '../services/employeeService';
import DeriveTicketModal from './employee/DeriveTicketModal';

type TabType = 'queue' | 'profile';

export default function EmpleadoUser() {
  const { state, dispatch } = useApp();
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
  
  // CRITICAL: Track the original service start time to prevent timer resets on recalls
  const [originalServiceStartTime, setOriginalServiceStartTime] = useState<Date | null>(null);
  // FIXED: Add a flag to track if we've already initialized the timer for this ticket
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);

  const currentUser = state.currentUser;
  const currentEmployee = state.currentEmployee;
  
  // CRITICAL: Get the actual employee state from the context, not local state
  const actualEmployee = state.employees.find(e => e.id === currentEmployee?.id);
  const isPaused = actualEmployee?.isPaused || false;

  // CRITICAL: Find the current ticket being served by this employee
  const currentTicket = state.tickets.find(ticket => 
    ticket.status === 'being_served' && ticket.servedBy === currentEmployee?.id
  );

  // FIXED: Complete state restoration when employee has active ticket - PREVENT TIMER RESET ON RECALLS
  useEffect(() => {
    console.log('🔄 Employee state restoration check...');
    console.log('Current Employee:', currentEmployee?.name);
    console.log('Available tickets:', state.tickets.length);
    
    if (currentEmployee && state.tickets.length > 0) {
      // Find any ticket being served by this employee
      const activeTicket = state.tickets.find(t => 
        t.status === 'being_served' && t.servedBy === currentEmployee.id
      );
      
      if (activeTicket) {
        console.log('✅ Found active ticket for employee:', {
          ticketNumber: activeTicket.number,
          servedAt: activeTicket.servedAt,
          employeeName: currentEmployee.name,
          currentTicketId: currentTicketId,
          activeTicketId: activeTicket.id
        });
        
        // CRITICAL: Only initialize timer if this is a NEW ticket (different from current)
        if (activeTicket.id !== currentTicketId) {
          console.log('🆕 NEW TICKET DETECTED - Initializing timer for ticket:', activeTicket.id);
          
          if (activeTicket.servedAt) {
            const servedTime = new Date(activeTicket.servedAt);
            
            console.log('🕐 Setting ORIGINAL service start time for NEW ticket:', servedTime);
            setCurrentTicketId(activeTicket.id);
            setOriginalServiceStartTime(servedTime);
            setServiceStartTime(servedTime);
            setIsTimerRunning(true);
            
            // Calculate elapsed time from when service started
            const elapsed = Math.floor((new Date().getTime() - servedTime.getTime()) / 1000);
            setElapsedTime(elapsed);
            
            console.log('🔄 Timer initialized for NEW ticket:', {
              ticketId: activeTicket.id,
              serviceStartTime: servedTime,
              elapsedTime: elapsed,
              isTimerRunning: true
            });
          }
        } else {
          // FIXED: Same ticket - this is likely a RECALL, don't reset timer
          console.log('🔄 SAME TICKET - This is likely a RECALL, preserving timer');
          
          if (originalServiceStartTime) {
            // Keep using the original start time for timer calculation
            const elapsed = Math.floor((new Date().getTime() - originalServiceStartTime.getTime()) / 1000);
            setElapsedTime(elapsed);
            
            // Ensure timer is still running
            if (!isTimerRunning) {
              console.log('⏰ Restarting timer for existing ticket');
              setIsTimerRunning(true);
            }
          }
        }
      } else {
        console.log('ℹ️ No active ticket found for employee - Resetting timer state');
        // Reset timer state if no active ticket
        setCurrentTicketId(null);
        setServiceStartTime(null);
        setOriginalServiceStartTime(null);
        setElapsedTime(0);
        setIsTimerRunning(false);
      }
    }
  }, [currentEmployee?.id, state.tickets, currentTicketId, originalServiceStartTime, isTimerRunning]);

  // FIXED: Update employee's currentTicketId when ticket state changes
  useEffect(() => {
    if (currentEmployee && currentTicket) {
      // Ensure employee record has the correct currentTicketId
      if (currentEmployee.currentTicketId !== currentTicket.id) {
        console.log('🔄 Syncing employee currentTicketId with actual ticket');
        employeeService.updateEmployee(currentEmployee.id, {
          ...currentEmployee,
          currentTicketId: currentTicket.id
        }).catch(error => {
          console.error('Error syncing employee ticket ID:', error);
        });
      }
    } else if (currentEmployee && !currentTicket && currentEmployee.currentTicketId) {
      // Clear currentTicketId if no active ticket
      console.log('🔄 Clearing employee currentTicketId - no active ticket');
      employeeService.updateEmployee(currentEmployee.id, {
        ...currentEmployee,
        currentTicketId: undefined
      }).catch(error => {
        console.error('Error clearing employee ticket ID:', error);
      });
    }
  }, [currentEmployee, currentTicket]);

  // FIXED: Timer update effect - use original service start time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && originalServiceStartTime) {
      interval = setInterval(() => {
        // CRITICAL: Always use the original service start time for timer calculation
        setElapsedTime(Math.floor((new Date().getTime() - originalServiceStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, originalServiceStartTime]); // Use originalServiceStartTime instead of serviceStartTime

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // FIXED: Corrected toggle pause logic to use current state from context
  const handleTogglePause = async () => {
    if (!currentEmployee) return;

    if (currentTicket) {
      alert('No puedes pausar mientras tienes un ticket en atención. Finaliza el ticket primero.');
      return;
    }
    
    try {
      // FIXED: Use the current state from the context, not the local state
      const updatedEmployee = state.employees.find(e => e.id === currentEmployee.id);
      if (!updatedEmployee) return;

      console.log('🔄 Toggling pause state from:', updatedEmployee.isPaused, 'to:', !updatedEmployee.isPaused);

      await employeeService.updateEmployee(currentEmployee.id, {
        ...updatedEmployee,
        isPaused: !updatedEmployee.isPaused // Use the current state from context
      });
    } catch (error) {
      console.error('Error toggling pause:', error);
      alert('Error al cambiar estado de pausa');
    }
  };

  const handleStartService = async (ticketId: string) => {
    if (!currentEmployee) return;

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

      // CRITICAL: Set both original and current service start time for new tickets
      console.log('🆕 Starting NEW ticket service - Setting original timer:', now);
      setCurrentTicketId(ticketId);
      setOriginalServiceStartTime(now);
      setServiceStartTime(now);
      setElapsedTime(0);
      setIsTimerRunning(true);
    } catch (error) {
      console.error('Error starting service:', error);
      alert('Error al iniciar la atención del ticket');
    }
  };

  const handleCompleteTicket = async (ticketId: string, callNext: boolean = false) => {
    if (!currentEmployee || !originalServiceStartTime) return; // Use originalServiceStartTime

    const serviceTime = Math.floor((new Date().getTime() - originalServiceStartTime.getTime()) / 1000); // Use originalServiceStartTime
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
      
      // CRITICAL: Reset all timer state
      console.log('✅ Ticket completed - Resetting all timer state');
      setCurrentTicketId(null);
      setOriginalServiceStartTime(null);
      setServiceStartTime(null);
      setElapsedTime(0);
      setIsTimerRunning(false);

      if (callNext) {
        const waitingTickets = state.tickets
          .filter(t => t.status === 'waiting')
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        if (waitingTickets.length > 0) {
          setTimeout(() => handleStartService(waitingTickets[0].id), 500);
        }
      }
    } catch (error) {
      console.error('Error completing ticket:', error);
      alert('Error al completar el ticket');
    }
  };

  // FIXED: Handle ticket recall (call client again in the node) - NO TIMER RESET
  const handleRecallTicket = async () => {
    if (!currentEmployee || !currentTicket) {
      console.warn('No hay ticket en atención para volver a llamar');
      return;
    }

    try {
      console.log('🔊 Recalling ticket:', currentTicket.number);
      console.log('⏰ IMPORTANT: Timer will NOT reset - using original start time:', originalServiceStartTime);
      console.log('🎯 Current ticket ID tracked:', currentTicketId);
      
      // FIXED: Update the ticket's servedAt time to trigger a new announcement
      // The timer logic now prevents resets by using originalServiceStartTime and currentTicketId tracking
      await ticketService.updateTicket(currentTicket.id, {
        servedAt: new Date() // This timestamp change triggers the audio system but won't reset timer
      });

      console.log('✅ Ticket recall triggered successfully - Timer preserved');
    } catch (error) {
      console.error('❌ Error recalling ticket:', error);
    }
  };

  // NEW: Handle ticket derivation
  const handleDeriveTicket = async (targetType: 'queue' | 'employee', targetId?: string, newServiceType?: string) => {
    if (!currentEmployee || !currentTicket) return;

    try {
      if (targetType === 'queue') {
        // Return ticket to general queue
        await ticketService.updateTicket(currentTicket.id, {
          status: 'waiting',
          servedBy: undefined,
          servedAt: undefined,
          serviceType: newServiceType || currentTicket.serviceType
        });
      } else if (targetType === 'employee' && targetId) {
        // Assign to specific employee
        const targetEmployee = state.employees.find(e => e.id === targetId);
        if (!targetEmployee) {
          alert('Empleado destino no encontrado');
          return;
        }

        if (targetEmployee.currentTicketId) {
          alert('El empleado destino ya tiene un ticket asignado');
          return;
        }

        await ticketService.updateTicket(currentTicket.id, {
          servedBy: targetId,
          servedAt: new Date(),
          serviceType: newServiceType || currentTicket.serviceType
        });

        await employeeService.updateEmployee(targetId, {
          ...targetEmployee,
          currentTicketId: currentTicket.id,
          isPaused: false
        });
      }

      // Update current employee
      await employeeService.updateEmployee(currentEmployee.id, {
        ...currentEmployee,
        currentTicketId: undefined,
        isPaused: true
      });

      // CRITICAL: Reset all timer state
      console.log('📤 Ticket derived - Resetting all timer state');
      setCurrentTicketId(null);
      setOriginalServiceStartTime(null);
      setServiceStartTime(null);
      setElapsedTime(0);
      setIsTimerRunning(false);
      setShowDeriveModal(false);

      alert('Ticket derivado exitosamente');
    } catch (error) {
      console.error('Error deriving ticket:', error);
      alert('Error al derivar ticket');
    }
  };

  const handleCancelTicket = async () => {
    if (!currentEmployee || !currentTicket) return;

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

      // CRITICAL: Reset all timer state
      console.log('❌ Ticket cancelled - Resetting all timer state');
      setCurrentTicketId(null);
      setOriginalServiceStartTime(null);
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

  const tabs = [
    { id: 'queue', name: 'Cola de Tickets', icon: Clock },
    { id: 'profile', name: 'Mi Perfil', icon: User },
  ];

  const renderQueue = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Current Service */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Servicio Actual</h2>
        
        {isPaused && !currentTicket ? (
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
              
              {/* FIXED: Added Recall Button - NO TIMER RESET */}
              <div className="mb-4">
                <button
                  onClick={handleRecallTicket}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Volume2 size={20} />
                  <span>Volver a Llamar Cliente</span>
                </button>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  ⏰ El cronómetro NO se reiniciará - El anuncio se reproducirá nuevamente en el módulo nodo
                </p>
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
                
                {/* NEW: Derive Button */}
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
            
            return (
              <div
                key={ticket.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  index === 0 
                    ? 'border-yellow-400 bg-yellow-50' 
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

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h2>
        
        {currentUser && (
          <div className="space-y-6">
            {/* User Info - READ ONLY */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                    {currentUser.name}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Solo lectura - Contacta al administrador para cambios</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                    {currentUser.username}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Solo lectura - Contacta al administrador para cambios</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                    Empleado
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Activo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Info - READ ONLY */}
            {currentEmployee && (
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Información de Empleado</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Posición</label>
                    <div className="p-3 bg-white border border-blue-300 rounded-lg text-blue-800">
                      {currentEmployee.position}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Solo lectura - Contacta al administrador para cambios</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Estado Actual</label>
                    <div className="p-3 bg-white border border-blue-300 rounded-lg">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isPaused ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isPaused ? 'En Pausa' : 'Disponible'}
                      </span>
                    </div>
                  </div>
                  {/* NEW: Current Ticket Status */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-blue-700 mb-1">Ticket Actual</label>
                    <div className="p-3 bg-white border border-blue-300 rounded-lg">
                      {currentTicket ? (
                        <div className="flex items-center justify-between">
                          <span className="text-blue-800 font-semibold">
                            #{currentTicket.number.toString().padStart(3, '0')} - {currentTicket.serviceType.toUpperCase()}
                          </span>
                          <span className="text-xs text-blue-600">
                            {originalServiceStartTime ? `Tiempo: ${formatTime(elapsedTime)}` : 'Iniciando...'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Sin ticket asignado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics - READ ONLY */}
            {currentEmployee && (
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Estadísticas Personales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-green-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{currentEmployee.totalTicketsServed}</div>
                    <div className="text-sm text-green-700">Tickets Atendidos</div>
                  </div>
                  <div className="bg-white border border-green-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{currentEmployee.totalTicketsCancelled}</div>
                    <div className="text-sm text-green-700">Tickets Cancelados</div>
                  </div>
                  <div className="bg-white border border-green-300 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {currentEmployee.totalTicketsServed + currentEmployee.totalTicketsCancelled > 0
                        ? Math.round((currentEmployee.totalTicketsServed / (currentEmployee.totalTicketsServed + currentEmployee.totalTicketsCancelled)) * 100)
                        : 0}%
                    </div>
                    <div className="text-sm text-green-700">Eficiencia</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - ONLY PASSWORD CHANGE */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <Key size={20} />
                <span>Cambiar Contraseña</span>
              </button>
            </div>

            {/* Information Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">ℹ️ Información Importante</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Los datos personales y de empleado son de solo lectura</li>
                <li>• Solo puedes cambiar tu contraseña desde este panel</li>
                <li>• Para modificar otros datos, contacta al administrador</li>
                <li>• Las estadísticas se actualizan automáticamente</li>
                <li>• <strong>El estado del empleado se mantiene al cerrar y abrir el sistema</strong></li>
                <li>• <strong>Si tienes un ticket en atención, se restaurará automáticamente</strong></li>
                <li>• <strong>⏰ El cronómetro NO se reinicia al usar "Volver a llamar"</strong></li>
              </ul>
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
              {/* NEW: Current Ticket Indicator in Header */}
              {currentTicket && (
                <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2">
                  <div className="text-green-800 font-semibold text-sm">
                    Atendiendo: #{currentTicket.number.toString().padStart(3, '0')}
                  </div>
                  <div className="text-green-600 text-xs">
                    {originalServiceStartTime ? formatTime(elapsedTime) : 'Iniciando...'}
                  </div>
                </div>
              )}
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

      {/* NEW: Derive Ticket Modal */}
      {showDeriveModal && currentTicket && (
        <DeriveTicketModal
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