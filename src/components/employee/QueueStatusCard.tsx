import React from 'react';
import { Clock, Users, Star, ArrowRight } from 'lucide-react';

interface QueueStatusCardProps {
  personalQueueCount: number;
  generalQueueCount: number;
  nextTicketType: 'personal' | 'general' | 'none';
}

export default function QueueStatusCard({
  personalQueueCount,
  generalQueueCount,
  nextTicketType
}: QueueStatusCardProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
        <Clock size={20} className="text-blue-600" />
        <span>Estado de Colas</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">{personalQueueCount}</div>
              <div className="text-sm text-purple-700 font-medium">Cola Personal</div>
            </div>
            <Star size={24} className="text-purple-500" />
          </div>
          <div className="text-xs text-purple-600 mt-1">
            Tickets derivados a ti
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{generalQueueCount}</div>
              <div className="text-sm text-blue-700 font-medium">Cola General</div>
            </div>
            <Users size={24} className="text-blue-500" />
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Tickets disponibles
          </div>
        </div>
      </div>
      
      {/* Next Ticket Indicator */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Próximo ticket:</span>
          <div className="flex items-center space-x-2">
            {nextTicketType === 'personal' && (
              <>
                <Star size={16} className="text-purple-500" />
                <span className="text-sm font-semibold text-purple-600">Cola Personal</span>
              </>
            )}
            {nextTicketType === 'general' && (
              <>
                <Users size={16} className="text-blue-500" />
                <span className="text-sm font-semibold text-blue-600">Cola General</span>
              </>
            )}
            {nextTicketType === 'none' && (
              <span className="text-sm text-gray-500">Sin tickets pendientes</span>
            )}
          </div>
        </div>
        
        {nextTicketType !== 'none' && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
            <div className="flex items-center space-x-1">
              <ArrowRight size={12} />
              <span>
                {nextTicketType === 'personal' 
                  ? 'Prioridad: Tu cola personal se atiende primero'
                  : 'Se tomará de la cola general cuando termines'
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}