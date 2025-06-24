import React, { useState, useEffect } from 'react';
import { Users, Settings, BarChart3, Clock, User, CheckCircle, XCircle, Pause, Play, ArrowRight, Star, AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { employeeService } from '../../services/employeeService';
import { ticketService } from '../../services/ticketService';
import { ticketQueueService } from '../../services/ticketQueueService';
import type { Employee, Ticket } from '../../types';

export default function EmployeeManagement() {
  const { state } = useApp();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDeriveModal, setShowDeriveModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeStats, setEmployeeStats] = useState<Record<string, {
    personalQueueCount: number;
    generalQueueCount: number;
    totalWaitingCount: number;
    nextTicketType: 'personal' | 'general' | 'none';
  }>>({});

  // Load queue stats for all employees
  useEffect(() => {
    const loadAllEmployeeStats = async () => {
      const stats: Record<string, any> = {};
      
      for (const employee of state.employees) {
        if (employee.isActive) {
          try {
            const employeeStats = await ticketQueueService.getEmployeeQueueStats(employee.id);
            stats[employee.id] = employeeStats;
          } catch (error) {
            console.error(`Error loading stats for employee ${employee.id}:`, error);
          }
        }
      }
      
      setEmployeeStats(stats);
    };
    
    loadAllEmployeeStats();
    // Refresh stats every 15 seconds
    const interval = setInterval(loadAllEmployeeStats, 15000);
    return () => clearInterval(interval);
  }, [state.employees]);

  const handleToggleEmployeePause = async (employee: Employee) => {
    if (employee.currentTicketId) {
      alert('No se puede pausar un empleado que tiene un ticket en atención');
      return;
    }

    setIsLoading(true);
    try {
      await employeeService.updateEmployee(employee.id, {
        ...employee,
        isPaused: !employee.isPaused
      });
    } catch (error) {
      console.error('Error toggling employee pause:', error);
      alert('Error al cambiar estado del empleado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceCompleteTicket = async (ticket: Ticket) => {
    if (!confirm('¿Estás seguro de que deseas forzar la finalización de este ticket?')) {
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const serviceTime = ticket.servedAt 
        ? Math.floor((now.getTime() - new Date(ticket.servedAt).getTime()) / 1000)
        : 0;
      const totalTime = Math.floor((now.getTime() - ticket.createdAt.getTime()) / 1000);

      await ticketService.updateTicket(ticket.id, {
        status: 'completed',
        completedAt: now,
        serviceTime,
        totalTime
      });

      // Update employee
      if (ticket.servedBy) {
        const employee = state.employees.find(e => e.id === ticket.servedBy);
        if (employee) {
          await employeeService.updateEmployee(employee.id, {
            ...employee,
            currentTicketId: undefined,
            totalTicketsServed: employee.totalTicketsServed + 1,
            isPaused: true
          });
        }
      }

      alert('Ticket finalizado exitosamente');
    } catch (error) {
      console.error('Error force completing ticket:', error);
      alert('Error al finalizar ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeriveTicket = async (ticket: Ticket, targetEmployeeId: string) => {
    setIsLoading(true);
    try {
      const sourceEmployeeId = ticket.servedBy;
      if (!sourceEmployeeId) {
        alert('No se puede determinar el empleado origen');
        return;
      }

      // Use the ticket queue service for derivation
      await ticketQueueService.deriveTicketToEmployee(
        ticket.id,
        sourceEmployeeId,
        targetEmployeeId,
        {
          reason: 'Derivación administrativa',
          priority: 'high'
        }
      );

      setShowDeriveModal(false);
      setSelectedTicket(null);
      alert('Ticket derivado exitosamente');
    } catch (error) {
      console.error('Error deriving ticket:', error);
      alert('Error al derivar ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeCurrentTicket = (employee: Employee): Ticket | undefined => {
    return state.tickets.find(t => 
      t.status === 'being_served' && t.servedBy === employee.id
    );
  };

  const getEmployeePersonalQueue = (employeeId: string): Ticket[] => {
    return state.tickets.filter(t => 
      t.status === 'waiting' && 
      t.queueType === 'personal' && 
      t.assignedToEmployee === employeeId
    );
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getServiceTime = (ticket: Ticket) => {
    if (!ticket.servedAt) return 0;
    return Math.floor((new Date().getTime() - new Date(ticket.servedAt).getTime()) / 1000);
  };

  const availableEmployees = state.employees.filter(emp => 
    emp.isActive && !emp.isPaused && !emp.currentTicketId
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Empleados en Tiempo Real</h2>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-blue-800 font-semibold">
                {state.employees.filter(e => e.isActive && !e.isPaused).length} Activos
              </span>
            </div>
            <div className="bg-orange-50 px-4 py-2 rounded-lg">
              <span className="text-orange-800 font-semibold">
                {state.employees.filter(e => e.isPaused).length} En Pausa
              </span>
            </div>
          </div>
        </div>

        {/* Employees Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {state.employees.map((employee) => {
            const currentTicket = getEmployeeCurrentTicket(employee);
            const serviceTime = currentTicket ? getServiceTime(currentTicket) : 0;
            const personalQueue = getEmployeePersonalQueue(employee.id);
            const stats = employeeStats[employee.id] || {
              personalQueueCount: personalQueue.length,
              generalQueueCount: 0,
              totalWaitingCount: personalQueue.length,
              nextTicketType: personalQueue.length > 0 ? 'personal' : 'none'
            };

            return (
              <div key={employee.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${
                      employee.isPaused ? 'bg-orange-100' : 
                      currentTicket ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <User size={24} className={
                        employee.isPaused ? 'text-orange-600' : 
                        currentTicket ? 'text-green-600' : 'text-blue-600'
                      } />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{employee.name}</h3>
                      <p className="text-gray-600">{employee.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.isPaused ? 'bg-orange-100 text-orange-800' :
                      currentTicket ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {employee.isPaused ? 'En Pausa' : 
                       currentTicket ? 'Atendiendo' : 'Disponible'}
                    </span>
                    
                    <button
                      onClick={() => handleToggleEmployeePause(employee)}
                      disabled={isLoading || !!currentTicket}
                      className={`p-2 rounded-lg transition-colors ${
                        currentTicket 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : employee.isPaused 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                      title={currentTicket ? 'No se puede pausar con ticket activo' : 
                             employee.isPaused ? 'Reanudar empleado' : 'Pausar empleado'}
                    >
                      {employee.isPaused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                  </div>
                </div>

                {/* Current Ticket Info */}
                {currentTicket ? (
                  <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-green-800">Ticket Actual</h4>
                      <span className="text-2xl font-bold text-green-600">
                        #{currentTicket.number.toString().padStart(3, '0')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <div>Servicio: {currentTicket.serviceType.toUpperCase()}</div>
                      <div>Tiempo: {formatTime(serviceTime)}</div>
                      <div>Iniciado: {currentTicket.servedAt ? new Date(currentTicket.servedAt).toLocaleTimeString() : 'N/A'}</div>
                      {currentTicket.derivedFrom && (
                        <div className="text-purple-600 font-medium">
                          Derivado desde: {state.employees.find(e => e.id === currentTicket.derivedFrom)?.name || 'Empleado'}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleForceCompleteTicket(currentTicket)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm font-semibold transition-colors"
                      >
                        Finalizar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTicket(currentTicket);
                          setShowDeriveModal(true);
                        }}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded text-sm font-semibold transition-colors flex items-center justify-center space-x-1"
                      >
                        <ArrowRight size={14} />
                        <span>Derivar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                    {stats.personalQueueCount > 0 ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Star size={18} className="text-purple-500" />
                          <div>
                            <div className="font-semibold text-purple-800">Cola Personal</div>
                            <div className="text-sm text-purple-600">{stats.personalQueueCount} tickets asignados</div>
                          </div>
                        </div>
                        <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Prioridad
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <Clock size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Sin ticket asignado</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Employee Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{employee.totalTicketsServed}</div>
                    <div className="text-xs text-gray-500">Atendidos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{employee.totalTicketsCancelled}</div>
                    <div className="text-xs text-gray-500">Cancelados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{stats.personalQueueCount}</div>
                    <div className="text-xs text-gray-500">En Cola</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {state.employees.length === 0 && (
          <div className="text-center py-12">
            <Users size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">No hay empleados registrados</p>
          </div>
        )}
      </div>

      {/* Derive Ticket Modal */}
      {showDeriveModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-6">
              <ArrowRight size={32} className="text-purple-500" />
              <h3 className="text-2xl font-bold text-gray-800">Derivar Ticket</h3>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Ticket:</h4>
                <div className="text-lg font-bold text-purple-600">
                  #{selectedTicket.number.toString().padStart(3, '0')} - {selectedTicket.serviceType.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">
                  Atendido por: {state.employees.find(e => e.id === selectedTicket.servedBy)?.name || 'Desconocido'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empleado Destino
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      onClick={() => handleDeriveTicket(selectedTicket, employee.id)}
                      disabled={isLoading}
                      className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="font-semibold text-gray-800">{employee.name}</div>
                      <div className="text-sm text-gray-600">{employee.position}</div>
                    </button>
                  ))}
                </div>
                
                {availableEmployees.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <User size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No hay empleados disponibles</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeriveModal(false);
                  setSelectedTicket(null);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <Settings size={20} className="text-blue-600" />
          <span>Estado del Sistema de Derivación</span>
        </h2>
        
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Flujo de Trabajo de Derivaciones</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Empleado A deriva un ticket a Empleado B</strong></li>
                <li>• <strong>Si Empleado B está disponible:</strong> Asignación inmediata</li>
                <li>• <strong>Si Empleado B está ocupado:</strong> Ticket va a su cola personal</li>
                <li>• <strong>Cuando Empleado B termina:</strong> Automáticamente toma el siguiente ticket de su cola</li>
                <li>• <strong>Prioridad:</strong> Cola personal → Cola general</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}