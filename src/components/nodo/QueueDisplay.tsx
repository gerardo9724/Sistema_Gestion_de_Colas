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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getServiceTime = (ticket: Ticket) => {
    if (!ticket.servedAt) return 0;
    return Math.floor((new Date().getTime() - new Date(ticket.servedAt).getTime()) / 1000);
  };

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-full flex flex-col overflow-hidden">
      <h2 className={`${isFullWidth ? 'text-2xl' : 'text-xl'} font-bold mb-4 text-center flex items-center justify-center space-x-2`} style={{ color: textColor }}>
        <Users size={isFullWidth ? 28 : 24} style={{ color: accentColor }} />
        <span>Estado de la Cola</span>
      </h2>
      
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Currently Being Served - FIXED: Show all called tickets, no scroll, proper layout */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Timer size={isFullWidth ? 20 : 18} style={{ color: accentColor }} />
            <h3 className={`${isFullWidth ? 'text-lg' : 'text-base'} font-bold text-center`} style={{ color: textColor }}>
              Tickets en Atención ({beingServedTickets.length})
            </h3>
          </div>
          
          {/* FIXED: Display all being served tickets in a responsive grid without scroll */}
          <div className="flex-1 flex flex-col justify-start overflow-hidden">
            {beingServedTickets.length > 0 ? (
              <div className={`grid gap-3 h-full ${
                isFullWidth 
                  ? beingServedTickets.length === 1 ? 'grid-cols-1' :
                    beingServedTickets.length === 2 ? 'grid-cols-2' :
                    beingServedTickets.length <= 4 ? 'grid-cols-2' :
                    beingServedTickets.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'
                  : beingServedTickets.length === 1 ? 'grid-cols-1' :
                    beingServedTickets.length === 2 ? 'grid-cols-2' :
                    beingServedTickets.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
              }`}>
                {beingServedTickets.map((ticket, index) => {
                  const employee = employees.find(emp => emp.id === ticket.servedBy);
                  const isHighlighted = highlightedTicket === ticket.id;
                  const serviceTime = getServiceTime(ticket);
                  
                  return (
                    <div 
                      key={ticket.id} 
                      className={`rounded-xl p-3 text-center shadow-lg flex flex-col justify-between relative border-2 overflow-hidden ${
                        enableAnimations ? 'transition-all duration-1000' : ''
                      } ${
                        isHighlighted 
                          ? 'bg-gradient-to-r from-red-400 to-red-600 text-white border-yellow-400 transform scale-105 z-10' 
                          : 'bg-gradient-to-r text-white hover:scale-102'
                      }`}
                      style={{
                        minHeight: isFullWidth ? '120px' : '100px',
                        backgroundColor: isHighlighted ? undefined : accentColor,
                        borderColor: isHighlighted ? '#FBBF24' : accentColor,
                        // FIXED: Contained animations only - no external glow
                        ...(isHighlighted ? { 
                          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.3), 0 4px 20px rgba(239, 68, 68, 0.4)',
                        } : {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        })
                      }}
                    >
                      {/* FIXED: Contained highlight effects - all animations stay within the card */}
                      {isHighlighted && (
                        <>
                          {/* Pulsing background overlay - CONTAINED */}
                          <div className="absolute inset-1 bg-white bg-opacity-20 rounded-lg animate-pulse"></div>
                          
                          {/* Calling badge - POSITIONED INSIDE */}
                          <div className="absolute top-1 left-1 bg-yellow-400 text-red-800 px-2 py-1 rounded-full text-xs font-bold animate-bounce z-30">
                            ¡LLAMANDO!
                          </div>
                          
                          {/* Border animation - CONTAINED within card */}
                          <div className="absolute inset-1 border-2 border-yellow-400 rounded-lg animate-pulse z-10"></div>
                        </>
                      )}
                      
                      {/* Ticket number - TOP */}
                      <div className="relative z-20">
                        <div className={`${isFullWidth ? 'text-2xl' : 'text-xl'} font-bold drop-shadow-lg ${
                          isHighlighted && enableAnimations ? 'animate-bounce' : ''
                        }`}>
                          #{ticket.number.toString().padStart(3, '0')}
                        </div>
                      </div>
                      
                      {/* Employee info - MIDDLE */}
                      <div className="flex-1 flex flex-col justify-center relative z-20">
                        <div className={`${isFullWidth ? 'text-base' : 'text-sm'} font-bold mb-1 drop-shadow`}>
                          {employee?.name || 'N/A'}
                        </div>
                        <div className={`${isFullWidth ? 'text-xs' : 'text-xs'} opacity-90 text-white`}>
                          {employee?.position}
                        </div>
                      </div>
                      
                      {/* Service info - BOTTOM */}
                      <div className="relative z-20">
                        <div className={`${isFullWidth ? 'text-xs' : 'text-xs'} font-semibold opacity-90 mb-1`}>
                          {ticket.serviceType.toUpperCase()}
                        </div>
                        {/* FIXED: Show service time for all tickets in attention */}
                        <div className={`${isFullWidth ? 'text-xs' : 'text-xs'} opacity-75 font-mono`}>
                          {formatTime(serviceTime)}
                        </div>
                        {ticket.servedAt && (
                          <div className={`${isFullWidth ? 'text-xs' : 'text-xs'} opacity-60`}>
                            {new Date(ticket.servedAt).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <div className={`${isFullWidth ? 'text-6xl' : 'text-4xl'} font-bold mb-3 opacity-30`}>---</div>
                <p className={`${isFullWidth ? 'text-xl' : 'text-lg'} font-semibold mb-2`}>No hay tickets siendo atendidos</p>
                <p className={`${isFullWidth ? 'text-base' : 'text-sm'} opacity-75`}>Esperando actividad...</p>
              </div>
            )}
          </div>
        </div>

        {/* Next in Queue - COMPACT and FIXED */}
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