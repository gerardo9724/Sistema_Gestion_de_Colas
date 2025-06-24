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

  // FIXED: Create vertical slots that fit exactly in the available space - NO SCROLL
  const createVerticalTicketSlots = () => {
    const slots = [];
    const totalSlots = maxTicketsDisplayed;
    
    // CRITICAL: Show ALL tickets being served up to the limit (no filtering)
    for (let i = 0; i < Math.min(beingServedTickets.length, totalSlots); i++) {
      slots.push({ type: 'ticket', ticket: beingServedTickets[i], index: i });
    }
    
    // Fill remaining slots with empty placeholders
    for (let i = beingServedTickets.length; i < totalSlots; i++) {
      slots.push({ type: 'empty', index: i });
    }
    
    return slots;
  };

  const ticketSlots = createVerticalTicketSlots();

  // FIXED: Calculate exact height per ticket to avoid scroll
  const ticketHeight = `calc((100% - 120px) / ${maxTicketsDisplayed})`;
  const minTicketHeight = '60px';

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-full flex flex-col overflow-hidden">
      <h2 className={`${isFullWidth ? 'text-2xl' : 'text-xl'} font-bold mb-4 text-center flex items-center justify-center space-x-2`} style={{ color: textColor }}>
        <Users size={isFullWidth ? 28 : 24} style={{ color: accentColor }} />
        <span>Estado de la Cola</span>
      </h2>
      
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Currently Being Served - FIXED: No scroll, exact fit */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Timer size={isFullWidth ? 20 : 18} style={{ color: accentColor }} />
            <h3 className={`${isFullWidth ? 'text-lg' : 'text-base'} font-bold text-center`} style={{ color: textColor }}>
              Tickets en Atención ({beingServedTickets.length}/{maxTicketsDisplayed})
            </h3>
          </div>
          
          {/* FIXED: Vertical distribution with exact sizing - NO SCROLL */}
          <div className="flex-1 flex flex-col space-y-2" style={{ height: 'calc(100% - 40px)' }}>
            {ticketSlots.map((slot) => {
              if (slot.type === 'empty') {
                return (
                  <div 
                    key={`empty-${slot.index}`}
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

              const ticket = slot.ticket!;
              const employee = employees.find(emp => emp.id === ticket.servedBy);
              const isHighlighted = highlightedTicket === ticket.id;
              
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
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* FIXED: Internal highlight effects - NO box resizing, only content animation */}
                  {isHighlighted && (
                    <>
                      {/* Subtle background pulse - CONTAINED */}
                      <div className="absolute inset-1 bg-white bg-opacity-20 rounded-lg animate-pulse"></div>
                      
                      {/* Calling badge - POSITIONED INSIDE */}
                      <div className="absolute top-1 left-1 bg-yellow-400 text-red-800 px-2 py-1 rounded-full text-xs font-bold animate-bounce z-30">
                        ¡LLAMANDO!
                      </div>
                    </>
                  )}
                  
                  {/* FIXED: SIMPLIFIED ticket content - ONLY basic info */}
                  <div className={`relative z-20 flex items-center justify-between w-full text-white ${
                    isHighlighted && enableAnimations ? 'animate-pulse' : ''
                  }`}>
                    {/* Left side - ONLY Ticket number */}
                    <div className={`flex items-center ${
                      isHighlighted && enableAnimations ? 'transform scale-110 transition-transform duration-1000' : ''
                    }`}>
                      <div className="text-2xl font-bold drop-shadow-lg">
                        #{ticket.number.toString().padStart(3, '0')}
                      </div>
                    </div>
                    
                    {/* Center - ONLY Employee name */}
                    <div className={`flex flex-col items-center text-center ${
                      isHighlighted && enableAnimations ? 'transform scale-105 transition-transform duration-1000' : ''
                    }`}>
                      <div className="text-base font-bold drop-shadow">
                        {employee?.name || 'N/A'}
                      </div>
                    </div>
                    
                    {/* Right side - ONLY Service area */}
                    <div className={`flex items-center text-right ${
                      isHighlighted && enableAnimations ? 'transform scale-105 transition-transform duration-1000' : ''
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