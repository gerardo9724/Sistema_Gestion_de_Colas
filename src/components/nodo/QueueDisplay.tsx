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
  isFullWidth?: boolean;
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
  isFullWidth = false
}: QueueDisplayProps) {
  
  const getBeingServedGridCols = () => {
    const count = beingServedTickets.length;
    
    if (isFullWidth) {
      if (count === 1) return 'grid-cols-1';
      if (count === 2) return 'grid-cols-2';
      if (count <= 4) return 'grid-cols-2';
      if (count <= 6) return 'grid-cols-3';
      return 'grid-cols-4';
    } else {
      if (count === 1) return 'grid-cols-1';
      if (count === 2) return 'grid-cols-2';
      if (count <= 4) return 'grid-cols-2';
      return 'grid-cols-3';
    }
  };

  const ticketMinHeight = isFullWidth ? '100px' : '90px';
  const ticketMaxHeight = isFullWidth ? '120px' : '110px';

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-full flex flex-col">
      <h2 className={`${isFullWidth ? 'text-2xl' : 'text-xl'} font-bold mb-4 text-center flex items-center justify-center space-x-2`} style={{ color: textColor }}>
        <Users size={isFullWidth ? 28 : 24} style={{ color: accentColor }} />
        <span>Estado de la Cola</span>
      </h2>
      
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Currently Being Served - IMPROVED SCROLLING LAYOUT */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Timer size={isFullWidth ? 20 : 18} style={{ color: accentColor }} />
            <h3 className={`${isFullWidth ? 'text-lg' : 'text-base'} font-bold text-center`} style={{ color: textColor }}>
              Atendiendo Ahora ({beingServedTickets.length})
            </h3>
          </div>
          
          {/* CRITICAL: Scrollable container with proper height management */}
          <div className={`flex-1 overflow-y-auto ${isFullWidth ? 'max-h-[400px]' : 'max-h-[320px]'}`}>
            {beingServedTickets.length > 0 ? (
              <div className="space-y-3 pr-2"> {/* Vertical layout with spacing */}
                {beingServedTickets.map((ticket, index) => {
                  const employee = employees.find(emp => emp.id === ticket.servedBy);
                  const isHighlighted = highlightedTicket === ticket.id;
                  
                  return (
                    <div 
                      key={ticket.id} 
                      className={`rounded-xl p-3 text-center shadow-lg flex items-center justify-between relative overflow-hidden border-2 ${
                        enableAnimations ? 'transition-all duration-1000' : ''
                      } ${
                        isHighlighted 
                          ? 'bg-gradient-to-r from-red-400 to-red-600 text-white border-red-300 shadow-2xl transform scale-105 z-10' 
                          : 'bg-gradient-to-r text-white hover:scale-102'
                      }`}
                      style={{
                        minHeight: '80px',
                        backgroundColor: isHighlighted ? undefined : accentColor,
                        borderColor: isHighlighted ? undefined : accentColor,
                        ...(enableAnimations && isHighlighted ? { 
                          animation: 'pulse 2s infinite, glow 2s infinite' 
                        } : {})
                      }}
                    >
                      {/* ENHANCED: Multiple highlight effects for called tickets */}
                      {isHighlighted && (
                        <>
                          <div className="absolute inset-0 bg-white bg-opacity-20 animate-ping rounded-xl"></div>
                          <div className="absolute top-2 left-2 bg-yellow-400 text-red-800 px-2 py-1 rounded-full text-xs font-bold animate-bounce z-20">
                            ¡LLAMANDO!
                          </div>
                          <div className="absolute inset-0 border-4 border-yellow-400 rounded-xl animate-pulse"></div>
                        </>
                      )}
                      
                      {/* Left side - Ticket number */}
                      <div className="flex-shrink-0">
                        <div className={`${isFullWidth ? 'text-3xl' : 'text-2xl'} font-bold relative z-10 drop-shadow-lg ${
                          isHighlighted && enableAnimations ? 'animate-bounce' : ''
                        }`}>
                          #{ticket.number.toString().padStart(3, '0')}
                        </div>
                      </div>
                      
                      {/* Center - Employee info */}
                      <div className="flex-1 px-4">
                        <div className={`${isFullWidth ? 'text-lg' : 'text-base'} font-bold mb-1 relative z-10 drop-shadow`}>
                          {employee?.name || 'N/A'}
                        </div>
                        <div className={`${isFullWidth ? 'text-sm' : 'text-xs'} opacity-90 text-white relative z-10`}>
                          {employee?.position}
                        </div>
                      </div>
                      
                      {/* Right side - Service type */}
                      <div className="flex-shrink-0 text-right">
                        <div className={`${isFullWidth ? 'text-sm' : 'text-xs'} font-semibold opacity-90 relative z-10`}>
                          {ticket.serviceType.toUpperCase()}
                        </div>
                        {ticket.servedAt && (
                          <div className={`${isFullWidth ? 'text-xs' : 'text-xs'} opacity-75 relative z-10`}>
                            {new Date(ticket.servedAt).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Fill empty slots if less than max - VERTICAL LAYOUT */}
                {Array.from({ 
                  length: Math.max(0, Math.min(3, maxTicketsDisplayed - beingServedTickets.length))
                }).map((_, index) => (
                  <div 
                    key={`empty-served-${index}`} 
                    className={`bg-gray-100 bg-opacity-70 rounded-xl p-3 text-center flex items-center justify-center border-2 border-dashed border-gray-300 ${
                      enableAnimations ? 'hover:bg-gray-200 transition-colors' : ''
                    }`}
                    style={{ minHeight: '80px' }}
                  >
                    <div className="text-center">
                      <div className={`${isFullWidth ? 'text-xl' : 'text-lg'} font-bold mb-1 text-gray-400`}>---</div>
                      <div className={`${isFullWidth ? 'text-sm' : 'text-xs'} text-gray-500 font-medium`}>Disponible</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8 flex flex-col items-center justify-center h-full">
                <div className={`${isFullWidth ? 'text-6xl' : 'text-4xl'} font-bold mb-3 opacity-30`}>---</div>
                <p className={`${isFullWidth ? 'text-xl' : 'text-lg'} font-semibold mb-2`}>No hay tickets siendo atendidos</p>
                <p className={`${isFullWidth ? 'text-base' : 'text-sm'} opacity-75`}>Esperando actividad...</p>
              </div>
            )}
          </div>
        </div>

        {/* Next in Queue - COMPACT */}
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
      
      {/* ENHANCED: Add custom CSS for glow effect */}
      <style jsx>{`
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.6);
          }
        }
      `}</style>
    </div>
  );
}