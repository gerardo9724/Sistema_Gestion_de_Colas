import React, { useState, useRef } from 'react';
import { Play, Pause, User, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Employee } from '../../types';

interface EmployeeStatusCardProps {
  employee: Employee;
  hasCurrentTicket: boolean;
  isConnected: boolean;
  onToggleStatus: () => Promise<void>;
}

export default function EmployeeStatusCard({
  employee,
  hasCurrentTicket,
  isConnected,
  onToggleStatus
}: EmployeeStatusCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const lastClickTimeRef = useRef<number>(0);

  const handleStatusToggle = async () => {
    // Prevent rapid clicks (debounce)
    const now = Date.now();
    if (now - lastClickTimeRef.current < 2000) {
      console.log('🚫 STATUS TOGGLE: Debounced - too soon since last click');
      return;
    }
    lastClickTimeRef.current = now;

    // Validate conditions
    if (hasCurrentTicket) {
      alert('No puedes cambiar tu estado mientras tienes un ticket en atención. Finaliza el ticket primero.');
      return;
    }

    if (!isConnected) {
      alert('Sin conexión a Firebase. Verifica tu conexión a internet.');
      return;
    }

    if (isProcessing) {
      console.log('🚫 STATUS TOGGLE: Already processing');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🔄 STATUS TOGGLE: Starting status change', {
        currentIsActive: employee.isActive,
        currentIsPaused: employee.isPaused,
        hasCurrentTicket
      });

      await onToggleStatus();

      console.log('✅ STATUS TOGGLE: Status changed successfully');
    } catch (error) {
      console.error('❌ STATUS TOGGLE ERROR:', error);
      alert(`Error al cambiar estado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      // Reset processing state after a delay
      setTimeout(() => {
        setIsProcessing(false);
      }, 1500);
    }
  };

  const getStatusInfo = () => {
    if (hasCurrentTicket) {
      return {
        status: 'En Atención',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock,
        description: 'Atendiendo ticket actualmente'
      };
    } else if (employee.isActive) {
      return {
        status: 'Disponible',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        description: 'Listo para atender tickets'
      };
    } else {
      return {
        status: 'En Pausa',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: AlertTriangle,
        description: 'No recibiendo tickets nuevos'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
        <User size={24} className="text-blue-600" />
        <span>Estado del Empleado</span>
      </h3>

      {/* Current Status Display */}
      <div className="mb-6">
        <div className={`rounded-lg p-4 border-2 ${statusInfo.color} mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <StatusIcon size={24} />
              <div>
                <div className="text-lg font-bold">{statusInfo.status}</div>
                <div className="text-sm opacity-75">{statusInfo.description}</div>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className={`w-4 h-4 rounded-full ${
              hasCurrentTicket ? 'bg-blue-500 animate-pulse' :
              employee.isActive ? 'bg-green-500' : 'bg-orange-500'
            }`}></div>
          </div>
        </div>

        {/* Employee Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
            <div className="text-2xl font-bold text-green-600">{employee.totalTicketsServed}</div>
            <div className="text-sm text-green-700">Tickets Atendidos</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
            <div className="text-2xl font-bold text-red-600">{employee.totalTicketsCancelled}</div>
            <div className="text-sm text-red-700">Tickets Cancelados</div>
          </div>
        </div>
      </div>

      {/* Status Toggle Button */}
      <div className="space-y-3">
        <button
          onClick={handleStatusToggle}
          disabled={hasCurrentTicket || !isConnected || isProcessing}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform shadow-lg flex items-center justify-center space-x-3 ${
            hasCurrentTicket || !isConnected || isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
              : employee.isActive
                ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white hover:scale-105 active:scale-95 hover:shadow-xl'
                : 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white hover:scale-105 active:scale-95 hover:shadow-xl'
          }`}
          title={
            !isConnected ? 'Sin conexión a Firebase' :
            hasCurrentTicket ? 'No se puede cambiar estado con ticket activo' :
            isProcessing ? 'Procesando cambio de estado...' :
            employee.isActive ? 'Pausar para descansar' : 'Reanudar para recibir tickets'
          }
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Procesando...</span>
            </>
          ) : employee.isActive ? (
            <>
              <Pause size={24} />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play size={24} className="animate-pulse" />
              <span>Reanudar</span>
            </>
          )}
        </button>

        {/* Status Change Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <div className="font-semibold mb-1">ℹ️ Información:</div>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Disponible:</strong> Recibes tickets automáticamente</li>
              <li>• <strong>En Pausa:</strong> No recibes tickets nuevos</li>
              <li>• <strong>En Atención:</strong> No puedes cambiar estado</li>
              <li>• El sistema asigna tickets según disponibilidad</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}