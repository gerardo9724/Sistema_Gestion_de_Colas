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
  ticketBeingServedColor: string; // NEW: Configurable color for tickets being served
  ticketCompletedColor: string; // NEW: Configurable color for completed tickets
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
  ticketBeingServedColor, // NEW: Use configurable color
  ticketCompletedColor, // NEW: Use configurable color
  enableAnimations,
  isFullWidth = false
}: QueueDisplayProps) {

  // FIXED: Get today's completed tickets following the same ordering logic
  const getTodaysCompletedTickets = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return beingServedTickets
      .filter(ticket => 
        ticket.status === 'completed' && 
        ticket.completedAt &&
        new Date(ticket.completedAt) >= startOfDay &&
        new Date(ticket.completedAt) < endOfDay
      )
      .sort((a, b) => {
        // CRITICAL: Same ordering logic as being served tickets
        // Most recently completed first (reverse chronological order)
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bTime - aTime; // Most recent completion first
      });
  };

  // FIXED: Combine being served and completed tickets with proper ordering
  const allTicketsToShow = () => {
    const todaysCompleted = getTodaysCompletedTickets();
    
    // CRITICAL: Combine tickets following the scenario ordering:
    // 1. Being served tickets (with highlighted ticket first)
    // 2. Today's completed tickets (most recent first)
    const combinedTickets = [
      ...beingServedTickets, // Already sorted with highlighted first
      ...todaysCompleted     // Already sorted with most recent first
    ];
    
    return combinedTickets.slice(0, maxTicketsDisplayed);
  };

  const ticketsToDisplay = allTicketsToShow();

  // FIXED: Calculate exact height per ticket to avoid scroll
  const ticketHeight = `calc((100% - 120px) / ${maxTicketsDisplayed})`;
  const minTicketHeight = '60px';

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-full flex flex-col overflow-hidden">
      <h2 className={`${isFullWidth ? 'text-2xl' : 'text-xl'} font-bold mb-4 text-center flex items-center justify-center space-x-2`} style={{ color: textColor }}>
        <Users size={isFullWidth ? 28 : 24} style={{ color: accentColor }} />
        <span>Tickets en Atención</span>
      </h2>
      
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* UPDATED: Now shows both being served and completed tickets */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Timer size={isFullWidth ? 20 : 18} style={{ color: accentColor }} />
            <h3 className={`${isFullWidth ? 'text-lg' : 'text-base'} font-bold text-center`} style={{ color: textColor }}>
              Tickets en Atención
            </h3>
          </div>
          
          {/* FIXED: Vertical distribution with exact sizing - NO SCROLL */}
          <div className="flex-1 flex flex-col space-y-2" style={{ height: 'calc(100% - 40px)' }}>
            {Array.from({ length: maxTicketsDisplayed }).map((_, index) => {
              const ticket = ticketsToDisplay[index];
              
              if (!ticket) {
                return (
                  <div 
                    key={`empty-${index}`}
                    className={`rounded-xl p-3 text-center shadow-lg flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 ${
                      enableAnimations ? 'transition-all duration-300 hover:bg-gray-100' : ''
                    }`}
                    style={{
                      height: ticketHeight,
                      minHeight: minTicketHeight,
                      maxHeight: '80px'
                    }}
                  >
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-lg font-bold mb-1 opacity-50">---</div>
                        <div className="text-xs font-medium">Disponible</div>
                      </div>
                    </div>
                  </div>
                );
              }

              const employee = employees.find(emp => emp.id === ticket.servedBy);
              const isHighlighted = highlightedTicket === ticket.id;
              const isCompleted = ticket.status === 'completed';
              
              return (
                <div 
                  key={ticket.id} 
                  className={`rounded-xl p-3 shadow-lg flex items-center justify-between relative border-2 overflow-hidden ${
                    enableAnimations ? 'transition-all duration-500' : ''
                  }`}
                  style={{
                    height: ticketHeight,
                    minHeight: minTicketHeight,
                    maxHeight: '80px',
                    // UPDATED: Use configurable colors from node configuration - NO OPACITY
                    backgroundColor: isCompleted ? ticketCompletedColor : ticketBeingServedColor,
                    borderColor: isCompleted ? ticketCompletedColor : ticketBeingServedColor,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    // REMOVED: opacity for completed tickets - now they have full opacity
                  }}
                >
                  {/* FIXED: Internal highlight effects - NO box resizing, only content animation */}
                  {isHighlighted && !isCompleted && (
                    <>
                      {/* Subtle background pulse - CONTAINED */}
                      <div className="absolute inset-1 bg-white bg-opacity-20 rounded-lg animate-pulse"></div>
                      
                      {/* Calling badge - POSITIONED INSIDE */}
                      <div className="absolute top-1 left-1 bg-yellow-400 text-red-800 px-2 py-1 rounded-full text-xs font-bold animate-bounce z-30">
                        ¡LLAMANDO!
                      </div>
                    </>
                  )}

                  {/* REMOVED: Check icon for completed tickets - no longer showing completion icon */}
                  
                  {/* FIXED: SIMPLIFIED ticket content - ONLY basic info */}
                  <div className={`relative z-20 flex items-center justify-between w-full text-white ${
                    isHighlighted && enableAnimations && !isCompleted ? 'animate-pulse' : ''
                  }`}>
                    {/* Left side - ONLY Ticket number */}
                    <div className={`flex items-center ${
                      isHighlighted && enableAnimations && !isCompleted ? 'transform scale-110 transition-transform duration-1000' : ''
                    }`}>
                      <div className="text-2xl font-bold drop-shadow-lg">
                        #{ticket.number.toString().padStart(3, '0')}
                      </div>
                    </div>
                    
                    {/* Center - ONLY Employee name */}
                    <div className={`flex flex-col items-center text-center ${
                      isHighlighted && enableAnimations && !isCompleted ? 'transform scale-105 transition-transform duration-1000' : ''
                    }`}>
                      <div className="text-base font-bold drop-shadow">
                        {employee?.name || 'N/A'}
                      </div>
                    </div>
                    
                    {/* Right side - ONLY Service area */}
                    <div className={`flex items-center text-right ${
                      isHighlighted && enableAnimations && !isCompleted ? 'transform scale-105 transition-transform duration-1000' : ''
                    }`}>
                      <div className="text-sm font-bold drop-shadow">
                        {ticket.serviceType.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
              
              <div className={`grid ${isFullWidth ? 'grid-cols-4' : 'grid-cols-2'} gap-2`} style={{ height: isFullWidth ? '60px' : '50px' }}>
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
                      <div className={`${isFullWidth ? 'text-base' : 'text-sm'} font-bold mb-0.5 ${
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
                    <div className={`${isFullWidth ? 'text-sm' : 'text-xs'} font-bold mb-0.5 text-gray-400`}>---</div>
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