import React, { useState, useRef, useCallback } from 'react';
import { Play, Square, AlertTriangle } from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import { useApp } from '../../contexts/AppContext';
import type { Employee } from '../../types';

interface EmployeeAvailabilityControlProps {
  employee: Employee;
  hasCurrentTicket: boolean;
  isConnected: boolean;
}

export default function EmployeeAvailabilityControl({
  employee,
  hasCurrentTicket,
  isConnected
}: EmployeeAvailabilityControlProps) {
  const { autoAssignNextTicket } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const lastClickTimeRef = useRef<number>(0);

  const handleToggleAvailability = useCallback(async () => {
    const now = Date.now();
    
    // Prevent rapid clicks
    if (now - lastClickTimeRef.current < 2000) {
      console.log('🚫 CLICK BLOCKED: Too rapid');
      return;
    }

    // Check blocking conditions
    if (hasCurrentTicket) {
      setError('No puedes detener mientras tienes un ticket en atención');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!isConnected) {
      setError('Sin conexión a Firebase');
      setTimeout(() => setError(''), 3000);
      return;
    }

    lastClickTimeRef.current = now;
    setIsProcessing(true);
    setError('');

    try {
      const newIsActive = !employee.isActive;
      const newIsPaused = !newIsActive;
      
      console.log(`🔄 TOGGLE AVAILABILITY: ${newIsActive ? 'STARTING' : 'STOPPING'}`, {
        employeeId: employee.id,
        employeeName: employee.name,
        from: { isActive: employee.isActive, isPaused: employee.isPaused },
        to: { isActive: newIsActive, isPaused: newIsPaused }
      });
      
      await employeeService.updateEmployee(employee.id, {
        isActive: newIsActive,
        isPaused: newIsPaused
      });

      console.log('✅ AVAILABILITY UPDATED SUCCESSFULLY');

      // If starting, try to auto-assign a ticket
      if (newIsActive) {
        setTimeout(async () => {
          try {
            const assignedTicket = await autoAssignNextTicket(employee.id);
            if (assignedTicket) {
              console.log(`✅ AUTO-ASSIGNED: Ticket ${assignedTicket.number}`);
            }
          } catch (error) {
            console.error('❌ AUTO-ASSIGN ERROR:', error);
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ TOGGLE AVAILABILITY ERROR:', error);
      setError('Error al cambiar disponibilidad');
      setTimeout(() => setError(''), 3000);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  }, [employee, hasCurrentTicket, isConnected, autoAssignNextTicket]);

  const isDisabled = isProcessing || hasCurrentTicket || !isConnected;
  const shouldShowStart = !employee.isActive;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${employee.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span>Control de Disponibilidad</span>
      </h3>
      
      <div className="space-y-4">
        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Estado Actual:</div>
              <div className={`text-lg font-bold ${employee.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {employee.isActive ? '✅ Disponible para atender tickets' : '🛑 No disponible'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Base de Datos:</div>
              <div className="text-sm">
                <span className={`font-mono ${employee.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  isActive: {employee.isActive ? 'true' : 'false'}
                </span>
              </div>
              <div className="text-sm">
                <span className={`font-mono ${employee.isPaused ? 'text-red-600' : 'text-green-600'}`}>
                  isPaused: {employee.isPaused ? 'true' : 'false'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Control Button */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleToggleAvailability}
            disabled={isDisabled}
            className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 ${
              isDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : shouldShowStart
                  ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Procesando...</span>
              </>
            ) : shouldShowStart ? (
              <>
                <Play size={24} />
                <span>INICIAR DISPONIBILIDAD</span>
              </>
            ) : (
              <>
                <Square size={24} />
                <span>DETENER DISPONIBILIDAD</span>
              </>
            )}
          </button>

          {/* Status Messages */}
          {hasCurrentTicket && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertTriangle size={16} className="text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-semibold">Ticket en atención</p>
                <p>Finaliza tu ticket actual antes de detener la disponibilidad</p>
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertTriangle size={16} className="text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">Sin conexión</p>
                <p>Verifica tu conexión a Firebase</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertTriangle size={16} className="text-red-600 mt-0.5" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-800 mb-2">💡 Instrucciones:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>INICIAR:</strong> Te pone disponible para recibir tickets automáticamente</li>
            <li>• <strong>DETENER:</strong> Te quita de la cola de asignación de tickets</li>
            <li>• No puedes detener mientras tienes un ticket en atención</li>
            <li>• Al iniciar, el sistema intentará asignarte un ticket si hay disponibles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}