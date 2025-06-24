import React from 'react';
import { CheckCircle, SkipForward, X, Timer, Play, Pause, ArrowRight } from 'lucide-react';
import type { Ticket } from '../../types';

interface CurrentTicketCardProps {
  ticket: Ticket;
  elapsedTime: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onCompleteTicket: (callNext?: boolean) => void;
  onCancelTicket: () => void;
  onDeriveTicket: () => void; // NEW: Derive ticket function
}

export default function CurrentTicketCard({
  ticket,
  elapsedTime,
  isTimerRunning,
  onToggleTimer,
  onCompleteTicket,
  onCancelTicket,
  onDeriveTicket
}: CurrentTicketCardProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                className="mt-2 p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => onCompleteTicket()}
              className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle size={20} />
              <span>Finalizar</span>
            </button>
            
            <button
              onClick={() => onCompleteTicket(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <SkipForward size={20} />
              <span>Finalizar y Siguiente</span>
            </button>
            
            <button
              onClick={onDeriveTicket}
              className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowRight size={20} />
              <span>Derivar</span>
            </button>
            
            <button
              onClick={onCancelTicket}
              className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <X size={20} />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}