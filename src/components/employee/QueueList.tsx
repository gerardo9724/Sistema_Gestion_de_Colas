import React from 'react';
import { Clock, User } from 'lucide-react';
import type { Ticket } from '../../types';

interface QueueListProps {
  tickets: Ticket[];
  currentTicket?: Ticket;
  isPaused: boolean;
  onStartService: (ticketId: string) => void;
}

export default function QueueList({
  tickets,
  currentTicket,
  isPaused,
  onStartService
}: QueueListProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Cola de Espera ({tickets.length})
      </h2>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {tickets.map((ticket, index) => {
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
                  onClick={() => onStartService(ticket.id)}
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
        
        {tickets.length === 0 && (
          <div className="text-center py-12">
            <Clock size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">No hay tickets en espera</p>
          </div>
        )}
      </div>
    </div>
  );
}