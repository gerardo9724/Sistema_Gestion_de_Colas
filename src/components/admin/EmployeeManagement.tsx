import React, { useState } from 'react';
import { Users, Settings, BarChart3, Clock, User, CheckCircle, XCircle, Pause, Play, ArrowRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { employeeService } from '../../services/employeeService';
import { ticketService } from '../../services/ticketService';
import type { Employee, Ticket } from '../../types';

export default function EmployeeManagement() {
  const { state } = useApp();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDeriveModal, setShowDeriveModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const targetEmployee = state.employees.find(e => e.id === targetEmployeeId);
      if (!targetEmployee) {
        alert('Empleado destino no encontrado');
        return;
      }

      if (targetEmployee.currentTicketId) {
        alert('El empleado destino ya tiene un ticket asignado');
        return;
      }

      // Update ticket
      await ticketService.updateTicket(ticket.id, {
        servedBy: targetEmployeeId,
        servedAt: new Date()
      });

      // Update source employee
      if (ticket.servedBy) {
        const sourceEmployee = state.employees.find(e => e.id === ticket.servedBy);
        if (sourceEmployee) {
          await employeeService.updateEmployee(sourceEmployee.id, {
            ...sourceEmployee,
            currentTicketId: undefined,
            isPaused: true
          });
        }
      }

      // Update target employee
      await employeeService.updateEmployee(targetEmployeeId, {
        ...targetEmployee,
        currentTicketId: ticket.id,
        isPaused: false
      });

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
                    <div className="text-center text-gray-500">
                      <Clock size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sin ticket asignado</p>
                    </div>
                  </div>
                )}

                {/* Employee Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{employee.totalTicketsServed}</div>
                    <div className="text-xs text-gray-500">Atendidos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{employee.totalTicketsCancelled}</div>
                    <div className="text-xs text-gray-500">Cancelados</div>
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
    </div>
  );
}