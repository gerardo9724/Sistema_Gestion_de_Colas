import React, { useState } from 'react';
import { Search, Volume2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ticketService } from '../../services/ticketService';
import { employeeService } from '../../services/employeeService';
import type { Ticket } from '../../types';

interface ManualTicketRecallProps {
  currentEmployeeId: string;
  onTicketRecalled?: (ticket: Ticket) => void;
}

export default function ManualTicketRecall({ 
  currentEmployeeId, 
  onTicketRecalled 
}: ManualTicketRecallProps) {
  const { state } = useApp();
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRecalling, setIsRecalling] = useState(false);
  const [foundTicket, setFoundTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentEmployee = state.employees.find(e => e.id === currentEmployeeId);

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

      // Verificar que el ticket esté completado o cancelado (ya atendido)
      if (ticket.status === 'waiting') {
        setError('Este ticket aún está en cola de espera');
        return;
      }

      if (ticket.status === 'being_served') {
        setError('Este ticket está siendo atendido actualmente');
        return;
      }

      // Solo permitir tickets completados o cancelados
      if (ticket.status !== 'completed' && ticket.status !== 'cancelled') {
        setError('Solo se pueden llamar tickets ya atendidos');
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

  const handleRecallTicket = async () => {
    if (!foundTicket || !currentEmployee) return;

    // Verificar que el empleado no tenga un ticket actual
    if (currentEmployee.currentTicketId) {
      setError('Debes completar tu ticket actual antes de llamar otro');
      return;
    }

    setIsRecalling(true);
    setError('');

    try {
      const now = new Date();
      
      // CRÍTICO: Cambiar el ticket a estado "being_served" nuevamente
      await ticketService.updateTicket(foundTicket.id, {
        status: 'being_served',
        servedBy: currentEmployeeId,
        servedAt: now, // Esto activará el sistema de audio
        // Mantener datos históricos pero actualizar estado actual
        completedAt: undefined, // Limpiar completado
        cancelledAt: undefined, // Limpiar cancelado
      });

      // Actualizar empleado con el ticket actual
      await employeeService.updateEmployee(currentEmployeeId, {
        ...currentEmployee,
        currentTicketId: foundTicket.id,
        isPaused: false
      });

      setSuccess(`¡Ticket #${foundTicket.number.toString().padStart(3, '0')} llamado exitosamente!`);
      setFoundTicket(null);
      setTicketNumber('');
      
      // Notificar al componente padre
      if (onTicketRecalled) {
        onTicketRecalled(foundTicket);
      }

      // Limpiar mensajes después de 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (error) {
      console.error('Error recalling ticket:', error);
      setError('Error al llamar el ticket');
    } finally {
      setIsRecalling(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (foundTicket) {
        handleRecallTicket();
      } else {
        handleSearch();
      }
    }
  };

  const handleClear = () => {
    setTicketNumber('');
    setFoundTicket(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-purple-500">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
        <Volume2 size={24} className="text-purple-600" />
        <span>Llamada Manual de Ticket</span>
      </h3>
      
      <div className="space-y-4">
        {/* Input de búsqueda */}
        <div className="flex space-x-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Ticket
            </label>
            <input
              type="number"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ej: 123"
              min="1"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-mono"
              disabled={isSearching || isRecalling}
            />
          </div>
          
          <div className="flex flex-col justify-end space-y-2">
            <button
              onClick={foundTicket ? handleClear : handleSearch}
              disabled={isSearching || isRecalling}
              className={`p-3 rounded-lg font-semibold transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center ${
                foundTicket 
                  ? 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white'
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

        {/* Ticket encontrado */}
        {foundTicket && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-lg font-bold text-purple-800">
                  Ticket #{foundTicket.number.toString().padStart(3, '0')}
                </h4>
                <p className="text-purple-700">
                  Servicio: {foundTicket.serviceType.toUpperCase()}
                </p>
                <p className="text-sm text-purple-600">
                  Estado: {foundTicket.status === 'completed' ? 'Completado' : 'Cancelado'}
                </p>
                <p className="text-sm text-purple-600">
                  Creado: {foundTicket.createdAt.toLocaleString()}
                </p>
                {foundTicket.completedAt && (
                  <p className="text-sm text-purple-600">
                    Completado: {foundTicket.completedAt.toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <CheckCircle size={20} className="text-green-500" />
                <span className="text-sm font-medium text-green-700">Encontrado</span>
              </div>
            </div>
            
            <button
              onClick={handleRecallTicket}
              disabled={isRecalling || !!currentEmployee?.currentTicketId}
              className={`w-full p-3 rounded-lg font-semibold transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 ${
                currentEmployee?.currentTicketId
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white'
              }`}
              title={currentEmployee?.currentTicketId ? "Completa tu ticket actual primero" : "Llamar este ticket"}
            >
              {isRecalling ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Llamando...</span>
                </>
              ) : (
                <>
                  <Volume2 size={20} className="animate-pulse" />
                  <span>Llamar Ticket</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Mensajes de estado */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-800 mb-2">📋 Instrucciones:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ingresa el número del ticket que deseas llamar nuevamente</li>
            <li>• Solo se pueden llamar tickets ya completados o cancelados</li>
            <li>• El ticket pasará a estado "En Atención" y se activará el audio</li>
            <li>• Debes completar tu ticket actual antes de llamar otro</li>
            <li>• Presiona Enter para buscar o llamar el ticket</li>
          </ul>
        </div>
      </div>
    </div>
  );
}