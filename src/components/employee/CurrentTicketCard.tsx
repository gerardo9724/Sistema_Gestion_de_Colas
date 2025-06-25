import React, { useState } from 'react';
import { CheckCircle, SkipForward, X, Timer, Play, Pause, ArrowRight, Volume2 } from 'lucide-react';
import type { Ticket } from '../../types';

interface CurrentTicketCardProps {
  ticket: Ticket;
  elapsedTime: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onCompleteTicket: (callNext?: boolean) => void;
  onCancelTicket: () => void;
  onDeriveTicket: () => void;
  onRecallTicket: () => void;
}

export default function CurrentTicketCard({
  ticket,
  elapsedTime,
  isTimerRunning,
  onToggleTimer,
  onCompleteTicket,
  onCancelTicket,
  onDeriveTicket,
  onRecallTicket
}: CurrentTicketCardProps) {
  // Estado para controlar si el recall está en proceso
  const [isRecalling, setIsRecalling] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función controlada para el recall
  const handleRecallClick = async () => {
    // Prevenir múltiples ejecuciones
    if (isRecalling) {
      console.log('🚫 Recall ya en proceso, ignorando click adicional');
      return;
    }

    setIsRecalling(true);
    
    try {
      console.log('🔊 Iniciando recall del ticket...');
      await onRecallTicket();
      console.log('✅ Recall completado exitosamente');
    } catch (error) {
      console.error('❌ Error en recall:', error);
    } finally {
      // Reactivar el botón después de 2 segundos para evitar spam
      setTimeout(() => {
        setIsRecalling(false);
        console.log('🔓 Botón de recall reactivado');
      }, 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Servicio Actual</h2>
      
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                #{ticket.number.toString().padStart(3, '0')}
              </div>
              <div className="text-xl font-semibold text-gray-600">
                {ticket.serviceType.charAt(0).toUpperCase() + ticket.serviceType.slice(1)}
              </div>
              <div className="text-sm text-gray-500">
                Creado: {ticket.createdAt.toLocaleTimeString()}
              </div>
              {ticket.waitTime && (
                <div className="text-sm text-gray-500">
                  Tiempo de espera: {formatTime(ticket.waitTime)}
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 text-2xl font-bold text-green-600">
                <Timer size={32} />
                <span>{formatTime(elapsedTime)}</span>
              </div>
              <button
                onClick={onToggleTimer}
                className="mt-2 p-2 rounded-lg bg-gray-200 hover:bg-gray-300 active:bg-gray-400 active:scale-95 transition-all duration-150"
              >
                {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
              </button>
            </div>
          </div>
          
          {/* Action Buttons Grid - Solo Iconos con Efectos de Pulsación */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Complete Button */}
            <button
              onClick={() => onCompleteTicket()}
              className="group bg-green-500 hover:bg-green-600 active:bg-green-700 text-white p-4 rounded-xl font-semibold transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center"
              title="Completar ticket"
            >
              <CheckCircle size={24} className="group-active:scale-110 transition-transform duration-150" />
            </button>
            
            {/* Complete and Next Button */}
            <button
              onClick={() => onCompleteTicket(true)}
              className="group bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white p-4 rounded-xl font-semibold transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center"
              title="Completar y llamar siguiente"
            >
              <SkipForward size={24} className="group-active:scale-110 transition-transform duration-150" />
            </button>
            
            {/* Recall Button con Control de Ejecución */}
            <button
              onClick={handleRecallClick}
              disabled={isRecalling}
              className={`group relative overflow-hidden p-4 rounded-xl font-semibold transition-all duration-150 transform shadow-lg flex items-center justify-center ${
                isRecalling 
                  ? 'bg-yellow-300 cursor-not-allowed opacity-75' 
                  : 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 hover:scale-105 active:scale-95 hover:shadow-xl'
              }`}
              title={isRecalling ? "Llamando..." : "Volver a llamar ticket"}
            >
              {/* Efecto de ondas al presionar - solo si no está en proceso */}
              {!isRecalling && (
                <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 group-active:animate-ping rounded-xl"></div>
              )}
              
              {/* Indicador de carga cuando está en proceso */}
              {isRecalling && (
                <div className="absolute inset-0 bg-yellow-400 opacity-50 animate-pulse rounded-xl"></div>
              )}
              
              <Volume2 
                size={24} 
                className={`relative z-10 text-white transition-all duration-150 ${
                  isRecalling 
                    ? 'animate-bounce' 
                    : 'group-active:scale-125 group-hover:animate-pulse'
                }`}
              />
              
              {/* Contador visual cuando está deshabilitado */}
              {isRecalling && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              )}
            </button>
            
            {/* Derive Button */}
            <button
              onClick={onDeriveTicket}
              className="group bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white p-4 rounded-xl font-semibold transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center"
              title="Derivar ticket"
            >
              <ArrowRight size={24} className="group-active:scale-110 group-active:translate-x-1 transition-all duration-150" />
            </button>
            
            {/* Cancel Button */}
            <button
              onClick={onCancelTicket}
              className="group bg-red-500 hover:bg-red-600 active:bg-red-700 text-white p-4 rounded-xl font-semibold transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center"
              title="Cancelar ticket"
            >
              <X size={24} className="group-active:scale-110 group-active:rotate-90 transition-all duration-150" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}