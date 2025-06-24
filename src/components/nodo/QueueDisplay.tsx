import React from 'react';
import { Users, Timer, Clock } from 'lucide-react';
import type { Ticket, Employee } from '../../types';

interface QueueDisplayProps {
  beingServedTickets: Ticket[];
  waitingTickets: Ticket[];
  employees: Employee[];
  highlightedTicket: string | null;
  maxTicketsDisplayed: number;
  showQueueInfo: boolean;
  textColor: string;
  accentColor: string;
  enableAnimations: boolean;
  isFullWidth?: boolean; // NEW: Indicates if queue should take full width
}

export default function QueueDisplay({
  beingServedTickets,
  waitingTickets,
  employees,
  highlightedTicket,
  maxTicketsDisplayed,
  showQueueInfo,
  textColor,
  accentColor,
  enableAnimations,
  isFullWidth = false // NEW: Default to half width
}: QueueDisplayProps) {
  
  const getBeingServedGridCols = () => {
    const count = beingServedTickets.length;
    
    // NEW: Adjust grid based on full width mode
    if (isFullWidth) {
      if (count === 1) return 'grid-cols-1';
      if (count === 2) return 'grid-cols-2';
      if (count <= 4) return 'grid-cols-2';
      if (count <= 6) return 'grid-cols-3';
      return 'grid-cols-4'; // More columns for full width
    } else {
      // Original logic for half width
      if (count === 1) return 'grid-cols-1';
      if (count === 2) return 'grid-cols-2';
      if (count <= 4) return 'grid-cols-2';
      return 'grid-cols-3';
    }
  };

  // NEW: Adjust ticket size based on full width mode
  const ticketMinHeight = isFullWidth ? '100px' : '90px';
  const ticketMaxHeight = isFullWidth ? '120px' : '110px';

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-full flex flex-col">
      <h2 className={`${isFullWidth ? 'text-2xl' : 'text-xl'} font-bold mb-4 text-center flex items-center justify-center space-x-2`} style={{ color: textColor }}>
        <Users size={isFullWidth ? 28 : 24} style={{ color: accentColor }} />
        <span>Estado de la Cola</span>
      </h2>
      
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Currently Being Served - OPTIMIZED HEIGHT */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Timer size={isFullWidth ? 20 : 18} style={{ color: accentColor }} />
            <h3 className={`${isFullWidth ? 'text-lg' : 'text-base'} font-bold text-center`} style={{ color: textColor }}>
              Atendiendo Ahora ({beingServedTickets.length})
            </h3>
          </div>
          
          <div className={`flex-1 flex flex-col justify-start ${isFullWidth ? 'max-h-[400px]' : 'max-h-[320px]'} overflow-hidden`}>
            {beingServedTickets.length > 0 ? (
              <div className={`grid ${getBeingServedGridCols()} gap-2.5 h-full`}>
                {beingServedTickets.map((ticket) => {
                  const employee = employees.find(emp => emp.id === ticket.servedBy);
                  const isHighlighted = highlightedTicket === ticket.id;
                  
                  return (
                    <div 
                      key={ticket.id} 
                      className={`rounded-xl p-2.5 text-center shadow-lg flex flex-col justify-center relative overflow-hidden border-2 ${
                        enableAnimations ? 'transition-all duration-1000' : ''
                      } ${
                        isHighlighted 
                          ? 'bg-gradient-to-br from-red-400 to-red-600 text-white border-red-300 shadow-2xl transform scale-105 z-10' 
                          : 'bg-gradient-to-br text-white hover:scale-102'
                      }`}
                      style={{
                        minHeight: ticketMinHeight,
                        maxHeight: ticketMaxHeight,
                        backgroundColor: isHighlighted ? undefined : accentColor,
                        borderColor: isHighlighted ? undefined : accentColor,
                        ...(enableAnimations && isHighlighted ? { animationName: 'pulse' } : {})
                      }}
                    >
                      {isHighlighted && (
                        <>
                          <div className="absolute inset-0 bg-white bg-opacity-20 animate-ping rounded-xl"></div>
                          <div className="absolute top-1.5 left-1.5 bg-yellow-400 text-red-800 px-1.5 py-0.5 rounded-full text-xs font-bold animate-bounce">
                            ¡LLAMANDO!
                          </div>
                        </>
                      )}
                      
                      <div className={`${isFullWidth ? 'text-2xl' : 'text-xl'} font-bold mb-1.5 relative z-10 drop-shadow-lg ${
                        isHighlighted && enableAnimations ? 'animate-bounce' : ''
                      }`}>
                        #{ticket.number.toString().padStart(3, '0')}
                      </div>
                      
                      <div className={`${isFullWidth ? 'text-sm' : 'text-xs'} font-bold mb-1 relative z-10 drop-shadow`}>
                        {employee?.name || 'N/A'}
                      </div>
                      
                      <div className={`${isFullWidth ? 'text-xs' : 'text-xs'} opacity-90 text-white relative z-10`}>
                        {employee?.position}
                      </div>
                    </div>
                  );
                })}
                
                {/* Fill empty slots if less than max */}
                {Array.from({ 
                  length: Math.max(0, maxTicketsDisplayed - beingServedTickets.length) 
                }).map((_, index) => (
                  <div 
                    key={`empty-served-${index}`} 
                    className={`bg-gray-100 bg-opacity-70 rounded-xl p-2.5 text-center flex flex-col justify-center border-2 border-dashed border-gray-300 ${
                      enableAnimations ? 'hover:bg-gray-200 transition-colors' : ''
                    }`}
                    style={{
                      minHeight: ticketMinHeight,
                      maxHeight: ticketMaxHeight
                    }}
                  >
                    <div className={`${isFullWidth ? 'text-2xl' : 'text-xl'} font-bold mb-1.5 text-gray-400`}>---</div>
                    <div className={`${isFullWidth ? 'text-sm' : 'text-xs'} text-gray-500 font-medium`}>Disponible</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <div className={`${isFullWidth ? 'text-6xl' : 'text-4xl'} font-bold mb-3 opacity-30`}>---</div>
                <p className={`${isFullWidth ? 'text-xl' : 'text-lg'} font-semibold mb-2`}>No hay tickets siendo atendidos</p>
                <p className={`${isFullWidth ? 'text-base' : 'text-sm'} opacity-75`}>Esperando actividad...</p>
              </div>
            )}
          </div>
        </div>

        {/* Next in Queue - FURTHER OPTIMIZED AND COMPACT */}
        {showQueueInfo && (
          <div className="flex-shrink-0">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-2 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock size={isFullWidth ? 14 : 12} style={{ color: accentColor }} />
                <h3 className={`${isFullWidth ? 'text-sm' : 'text-xs'} font-semibold text-center`} style={{ color: textColor }}>
                  Próximos en Cola ({waitingTickets.length})
                </h3>
              </div>
              
              <div className={`grid ${isFullWidth ? 'grid-cols-4' : 'grid-cols-2'} gap-2`} style={{ height: isFullWidth ? '70px' : '60px' }}>
                {waitingTickets.slice(0, isFullWidth ? 4 : 2).map((ticket, index) => {
                  return (
                    <div 
                      key={ticket.id} 
                      className={`rounded-md p-1.5 text-center shadow-sm flex flex-col justify-center border ${
                        enableAnimations ? 'transition-all duration-300' : ''
                      } ${
                        index === 0 
                          ? 'bg-gradient-to-br from-yellow-200 to-yellow-300 border-yellow-300 shadow-md' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`${isFullWidth ? 'text-lg' : 'text-base'} font-bold mb-0.5 ${
                        index === 0 ? 'text-yellow-900' : 'text-gray-800'
                      }`}>
                        #{ticket.number.toString().padStart(3, '0')}
                      </div>
                      {index === 0 && (
                        <div className={`${isFullWidth ? 'text-xs' : 'text-xs'} text-yellow-800 font-semibold`}>
                          SIGUIENTE
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Fill empty slots */}
                {Array.from({ length: (isFullWidth ? 4 : 2) - waitingTickets.length }).map((_, index) => (
                  <div key={`empty-waiting-${index}`} className="bg-gray-50 rounded-md p-1.5 text-center flex flex-col justify-center border border-dashed border-gray-300">
                    <div className={`${isFullWidth ? 'text-base' : 'text-sm'} font-bold mb-0.5 text-gray-400`}>---</div>
                    <div className={`${isFullWidth ? 'text-xs' : 'text-xs'} text-gray-400`}>Vacío</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}