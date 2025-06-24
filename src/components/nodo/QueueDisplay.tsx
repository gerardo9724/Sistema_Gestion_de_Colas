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

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 h-full flex flex-col overflow-hidden">
      <h2 className={`${isFullWidth ? 'text-2xl' : 'text-xl'} font-bold mb-4 text-center flex items-center justify-center space-x-2`} style={{ color: textColor }}>
        <Users size={isFullWidth ? 28 : 24} style={{ color: accentColor }} />
        <span>Estado de la Cola</span>
      </h2>
      
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Currently Being Served - FIXED: No scroll, grid layout, text scaling effect */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Timer size={isFullWidth ? 20 : 18} style={{ color: accentColor }} />
            <h3 className={`${isFullWidth ? 'text-lg' : 'text-base'} font-bold text-center`} style={{ color: textColor }}>
              Atendiendo Ahora ({beingServedTickets.length})
            </h3>
          </div>
          
          {/* FIXED: Grid layout without scroll, shows all tickets being served */}
          <div className="flex-1 overflow-hidden">
            {beingServedTickets.length > 0 ? (
              <div className={`grid gap-3 h-full ${
                beingServedTickets.length === 1 ? 'grid-cols-1' :
                beingServedTickets.length === 2 ? 'grid-cols-2' :
                beingServedTickets.length <= 4 ? 'grid-cols-2' :
                beingServedTickets.length <= 6 ? 'grid-cols-3' :
                isFullWidth ? 'grid-cols-4' : 'grid-cols-3'
              }`}>
                {beingServedTickets.map((ticket, index) => {
                  const employee = employees.find(emp => emp.id === ticket.servedBy);
                  const isHighlighted = highlightedTicket === ticket.id;
                  
                  return (
                    <div 
                      key={ticket.id} 
                      className={`rounded-xl p-3 text-center shadow-lg flex flex-col justify-center relative border-2 overflow-hidden ${
                        enableAnimations ? 'transition-all duration-500' : ''
                      }`}
                      style={{
                        minHeight: '100px',
                        backgroundColor: accentColor,
                        borderColor: isHighlighted ? '#FBBF24' : accentColor,
                        // FIXED: No external effects, contained within card
                        boxShadow: isHighlighted 
                          ? '0 8px 25px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.2)' 
                          : '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {/* FIXED: Highlight effects - only internal animations */}
                      {isHighlighted && (
                        <>
                          {/* Internal pulsing background */}
                          <div className="absolute inset-2 bg-white bg-opacity-20 rounded-lg animate-pulse"></div>
                          
                          {/* Calling badge - positioned inside */}
                          <div className="absolute top-2 left-2 bg-yellow-400 text-red-800 px-2 py-1 rounded-full text-xs font-bold animate-bounce z-20">
                            ¡LLAMANDO!
                          </div>
                        </>
                      )}
                      
                      {/* FIXED: Text scaling effect instead of box scaling */}
                      <div className={`relative z-10 text-white ${
                        isHighlighted && enableAnimations ? 'transform scale-110' : ''
                      } transition-transform duration-500`}>
                        {/* Ticket number - SCALES UP when highlighted */}
                        <div className={`font-bold mb-2 drop-shadow-lg ${
                          isHighlighted ? 'text-4xl animate-pulse' : 'text-2xl'
                        } transition-all duration-500`}>
                          #{ticket.number.toString().padStart(3, '0')}
                        </div>
                        
                        {/* Employee name - SCALES UP when highlighted */}
                        <div className={`font-bold mb-1 drop-shadow ${
                          isHighlighted ? 'text-lg' : 'text-sm'
                        } transition-all duration-500`}>
                          {employee?.name || 'N/A'}
                        </div>
                        
                        {/* Position - SCALES UP when highlighted */}
                        <div className={`opacity-90 ${
                          isHighlighted ? 'text-sm' : 'text-xs'
                        } transition-all duration-500`}>
                          {employee?.position}
                        </div>
                        
                        {/* Service time - SCALES UP when highlighted */}
                        {ticket.servedAt && (
                          <div className={`opacity-75 mt-1 ${
                            isHighlighted ? 'text-sm font-semibold' : 'text-xs'
                          } transition-all duration-500`}>
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