import React, { useState } from 'react';
import { Search, ArrowRight, CheckCircle, X, AlertTriangle, Clock, User, Users, Ticket as TicketIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ticketService } from '../../services/ticketService';
import { employeeService } from '../../services/employeeService';
import { ticketQueueService } from '../../services/ticketQueueService';
import type { Ticket, Employee } from '../../types';

export default function AdminTicketManagement() {
  const { state } = useApp();
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundTicket, setFoundTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeriveModal, setShowDeriveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = async () => {
    if (!ticketNumber.trim()) {
      setError('Ingresa un número de ticket');
      return;
    }

    const searchNumber = parseInt(ticketNumber.trim());
    if (isNaN(searchNumber) || searchNumber <= 0) {
      setError('Número de ticket inválido');
      return;
    }

    setIsSearching(true);
    setError('');
    setFoundTicket(null);

    try {
      // Buscar ticket en la lista actual
      const ticket = state.tickets.find(t => t.number === searchNumber);
      
      if (!ticket) {
        setError(`Ticket #${searchNumber.toString().padStart(3, '0')} no encontrado`);
        return;
      }

      setFoundTicket(ticket);
      setSuccess(`Ticket encontrado: ${ticket.serviceType.toUpperCase()}`);

    } catch (error) {
      console.error('Error searching ticket:', error);
      setError('Error al buscar el ticket');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdminDerive = async (targetType: 'queue' | 'employee', targetEmployeeId?: string) => {
    if (!foundTicket) return;

    setIsProcessing(true);
    setError('');

    try {
      if (targetType === 'queue') {
        // Derivar a cola general
        await ticketService.updateTicket(foundTicket.id, {
          status: 'waiting',
          servedBy: undefined,
          servedAt: undefined,
          queueType: 'general',
          assignedToEmployee: undefined,
          derivedFrom: 'admin',
          derivedAt: new Date(),
          derivationReason: 'Derivación administrativa',
        });

        // Si el ticket tenía un empleado asignado, liberarlo
        if (foundTicket.servedBy) {
          const employee = state.employees.find(e => e.id === foundTicket.servedBy);
          if (employee) {
            await employeeService.updateEmployee(foundTicket.servedBy, {
              ...employee,
              currentTicketId: undefined,
              isPaused: true
            });
          }
        }

        setSuccess('Ticket derivado a cola general exitosamente');
      } else if (targetEmployeeId) {
        // Derivar a empleado específico
        await ticketQueueService.deriveTicketToEmployee(
          foundTicket.id,
          foundTicket.servedBy || 'admin',
          targetEmployeeId,
          {
            reason: 'Derivación administrativa',
            priority: 'high'
          }
        );

        const targetEmployee = state.employees.find(e => e.id === targetEmployeeId);
        setSuccess(`Ticket derivado a ${targetEmployee?.name} exitosamente`);
      }

      setShowDeriveModal(false);
      setFoundTicket(null);
      setTicketNumber('');

    } catch (error) {
      console.error('Error deriving ticket:', error);
      setError('Error al derivar el ticket');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdminComplete = async () => {
    if (!foundTicket) return;

    setIsProcessing(true);
    setError('');

    try {
      const now = new Date();
      const serviceTime = foundTicket.servedAt 
        ? Math.floor((now.getTime() - new Date(foundTicket.servedAt).getTime()) / 1000)
        : 0;
      const totalTime = Math.floor((now.getTime() - foundTicket.createdAt.getTime()) / 1000);

      await ticketService.updateTicket(foundTicket.id, {
        status: 'completed',
        completedAt: now,
        serviceTime,
        totalTime,
        cancellationReason: 'Finalizado por administración'
      });

      // Si el ticket tenía un empleado asignado, liberarlo
      if (foundTicket.servedBy) {
        const employee = state.employees.find(e => e.id === foundTicket.servedBy);
        if (employee) {
          await employeeService.updateEmployee(foundTicket.servedBy, {
            ...employee,
            currentTicketId: undefined,
            totalTicketsServed: employee.totalTicketsServed + 1,
            isPaused: true
          });
        }
      }

      setSuccess('Ticket finalizado por administración exitosamente');
      setShowCompleteModal(false);
      setFoundTicket(null);
      setTicketNumber('');

    } catch (error) {
      console.error('Error completing ticket:', error);
      setError('Error al finalizar el ticket');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setTicketNumber('');
    setFoundTicket(null);
    setError('');
    setSuccess('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'being_served': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return 'En Espera';
      case 'being_served': return 'En Atención';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const availableEmployees = state.employees.filter(emp => emp.isActive);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <TicketIcon size={28} className="text-indigo-600" />
            <span>Gestión Administrativa de Tickets</span>
          </h2>
        </div>

        {/* Búsqueda de Ticket */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center space-x-2">
            <Search size={20} />
            <span>Buscar Ticket</span>
          </h3>
          
          <div className="flex space-x-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-indigo-700 mb-2">
                Número de Ticket
              </label>
              <input
                type="number"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ej: 123"
                min="1"
                className="w-full p-3 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-mono"
                disabled={isSearching}
              />
            </div>
            
            <div className="flex flex-col justify-end space-y-2">
              <button
                onClick={foundTicket ? handleClear : handleSearch}
                disabled={isSearching}
                className={`p-3 rounded-lg font-semibold transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center ${
                  foundTicket 
                    ? 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white'
                    : 'bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white'
                }`}
                title={foundTicket ? "Limpiar búsqueda" : "Buscar ticket"}
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : foundTicket ? (
                  <X size={24} />
                ) : (
                  <Search size={24} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Ticket Encontrado */}
        {foundTicket && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <h4 className="text-2xl font-bold text-gray-800">
                    Ticket #{foundTicket.number.toString().padStart(3, '0')}
                  </h4>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(foundTicket.status)}`}>
                    {getStatusLabel(foundTicket.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">
                      <strong>Servicio:</strong> {foundTicket.serviceType.toUpperCase()}
                    </p>
                    {foundTicket.serviceSubtype && (
                      <p className="text-gray-600">
                        <strong>Subcategoría:</strong> {foundTicket.serviceSubtype}
                      </p>
                    )}
                    <p className="text-gray-600">
                      <strong>Creado:</strong> {foundTicket.createdAt.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    {foundTicket.servedBy && (
                      <p className="text-gray-600">
                        <strong>Atendido por:</strong> {state.employees.find(e => e.id === foundTicket.servedBy)?.name || 'Empleado no encontrado'}
                      </p>
                    )}
                    {foundTicket.servedAt && (
                      <p className="text-gray-600">
                        <strong>Iniciado:</strong> {foundTicket.servedAt.toLocaleString()}
                      </p>
                    )}
                    {foundTicket.completedAt && (
                      <p className="text-gray-600">
                        <strong>Completado:</strong> {foundTicket.completedAt.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Acciones Administrativas */}
            <div className="border-t pt-4">
              <h5 className="font-semibold text-gray-800 mb-3">Acciones Administrativas:</h5>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowDeriveModal(true)}
                  disabled={isProcessing}
                  className="bg-purple-500 hover:bg-purple-600 active:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <ArrowRight size={16} />
                  <span>Derivar Administrativamente</span>
                </button>
                
                <button
                  onClick={() => setShowCompleteModal(true)}
                  disabled={isProcessing || foundTicket.status === 'completed'}
                  className="bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <CheckCircle size={16} />
                  <span>Finalizar por Administración</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensajes de estado */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2 mb-4">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-2 mb-4">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">En Espera</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {state.tickets.filter(t => t.status === 'waiting').length}
                </p>
              </div>
              <Clock size={24} className="text-yellow-500" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">En Atención</p>
                <p className="text-2xl font-bold text-blue-900">
                  {state.tickets.filter(t => t.status === 'being_served').length}
                </p>
              </div>
              <User size={24} className="text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Completados Hoy</p>
                <p className="text-2xl font-bold text-green-900">
                  {state.tickets.filter(t => {
                    if (t.status !== 'completed' || !t.completedAt) return false;
                    const today = new Date();
                    const completedDate = new Date(t.completedAt);
                    return completedDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <CheckCircle size={24} className="text-green-500" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Empleados Activos</p>
                <p className="text-2xl font-bold text-purple-900">
                  {state.employees.filter(e => e.isActive && !e.isPaused).length}
                </p>
              </div>
              <Users size={24} className="text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Derivación */}
      {showDeriveModal && foundTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <ArrowRight size={24} className="text-purple-500" />
              <span>Derivar Ticket Administrativamente</span>
            </h3>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Ticket:</h4>
                <div className="text-lg font-bold text-purple-600">
                  #{foundTicket.number.toString().padStart(3, '0')} - {foundTicket.serviceType.toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleAdminDerive('queue')}
                  disabled={isProcessing}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Users size={20} />
                  <span>Derivar a Cola General</span>
                </button>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    O derivar a empleado específico:
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableEmployees.map((employee) => (
                      <button
                        key={employee.id}
                        onClick={() => handleAdminDerive('employee', employee.id)}
                        disabled={isProcessing}
                        className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-gray-800">{employee.name}</div>
                          <div className="text-sm text-gray-600">{employee.position}</div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          employee.currentTicketId ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {employee.currentTicketId ? 'Ocupado' : 'Disponible'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeriveModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Finalización */}
      {showCompleteModal && foundTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <CheckCircle size={24} className="text-green-500" />
              <span>Finalizar por Administración</span>
            </h3>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Ticket:</h4>
                <div className="text-lg font-bold text-green-600">
                  #{foundTicket.number.toString().padStart(3, '0')} - {foundTicket.serviceType.toUpperCase()}
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">¿Estás seguro?</p>
                    <p>Esta acción marcará el ticket como completado y liberará al empleado asignado (si existe).</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdminComplete}
                disabled={isProcessing}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                {isProcessing ? 'Procesando...' : 'Finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}