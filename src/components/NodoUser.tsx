import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import NodeHeader from './nodo/NodeHeader';
import QueueDisplay from './nodo/QueueDisplay';
import CarouselDisplay from './nodo/CarouselDisplay';
import StatusBar from './nodo/StatusBar';
import AudioManager from './nodo/AudioManager';
import { ticketService } from '../services/ticketService';
import { employeeService } from '../services/employeeService';

export default function NodoUser() {
  const { state, dispatch } = useApp();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [highlightedTicket, setHighlightedTicket] = useState<string | null>(null);
  const [lastAnnouncedTicket, setLastAnnouncedTicket] = useState<string | null>(null);

  // CRITICAL: Get node configuration from independent Firebase table
  const nodeConfig = React.useMemo(() => {
    if (state.nodeConfiguration) {
      console.log('📊 Using configuration from independent Firebase table:', state.nodeConfiguration);
      return {
        // Display Settings
        autoRotationInterval: state.nodeConfiguration.autoRotationInterval,
        showQueueInfo: state.nodeConfiguration.showQueueInfo,
        showCompanyLogo: state.nodeConfiguration.showCompanyLogo,
        showCompanyName: state.nodeConfiguration.showCompanyName ?? true,
        maxTicketsDisplayed: state.nodeConfiguration.maxTicketsDisplayed,
        showDateTime: state.nodeConfiguration.showDateTime,
        showConnectionStatus: state.nodeConfiguration.showConnectionStatus,
        showHeader: state.nodeConfiguration.showHeader ?? true,
        showCarousel: state.nodeConfiguration.showCarousel ?? true,
        showStatusBar: state.nodeConfiguration.showStatusBar ?? true,
        compactMode: state.nodeConfiguration.compactMode,
        
        // Audio Settings
        enableAudio: state.nodeConfiguration.enableAudio,
        audioVolume: state.nodeConfiguration.audioVolume,
        selectedVoice: state.nodeConfiguration.selectedVoice,
        speechRate: state.nodeConfiguration.speechRate,
        
        // Visual Settings
        backgroundColor: state.nodeConfiguration.backgroundColor,
        headerColor: state.nodeConfiguration.headerColor,
        textColor: state.nodeConfiguration.textColor,
        accentColor: state.nodeConfiguration.accentColor,
        
        // Ticket Color Settings
        ticketBeingServedColor: state.nodeConfiguration.ticketBeingServedColor || '#10B981',
        ticketCompletedColor: state.nodeConfiguration.ticketCompletedColor || '#14B8A6',
        
        // Animation Settings
        enableAnimations: state.nodeConfiguration.enableAnimations,
        highlightDuration: state.nodeConfiguration.highlightDuration,
        transitionDuration: state.nodeConfiguration.transitionDuration,
        
        // Content Settings
        showImageDescriptions: state.nodeConfiguration.showImageDescriptions,
        showImageIndicators: state.nodeConfiguration.showImageIndicators,
        pauseOnHover: state.nodeConfiguration.pauseOnHover,
        
        // Carousel Text Settings
        carouselTitle: state.nodeConfiguration.carouselTitle || 'Publicidad',
        enableScrollingText: state.nodeConfiguration.enableScrollingText ?? false,
        scrollingSpeed: state.nodeConfiguration.scrollingSpeed || 5,
      };
    } else {
      console.log('⚠️ No configuration found in independent table, using defaults');
      return {
        autoRotationInterval: 5000,
        showQueueInfo: true,
        showCompanyLogo: true,
        showCompanyName: true,
        maxTicketsDisplayed: 6,
        showDateTime: true,
        showConnectionStatus: true,
        showHeader: true,
        showCarousel: true,
        showStatusBar: true,
        compactMode: false,
        enableAudio: true,
        audioVolume: 0.8,
        selectedVoice: 'auto-female',
        speechRate: 0.75,
        backgroundColor: '#F1F5F9',
        headerColor: '#3B82F6',
        textColor: '#1F2937',
        accentColor: '#10B981',
        ticketBeingServedColor: '#10B981',
        ticketCompletedColor: '#14B8A6',
        enableAnimations: true,
        highlightDuration: 10000,
        transitionDuration: 1000,
        showImageDescriptions: true,
        showImageIndicators: true,
        pauseOnHover: false,
        carouselTitle: 'Publicidad',
        enableScrollingText: false,
        scrollingSpeed: 5,
      };
    }
  }, [state.nodeConfiguration]);

  // NEW: Daily reset at 11:59 PM - Complete tickets being served and reset visual state
  useEffect(() => {
    const setupDailyReset = () => {
      const now = new Date();
      const resetTime = new Date();
      resetTime.setHours(23, 59, 0, 0); // Set to 11:59:00 PM today
      
      // If it's already past 11:59 PM today, set for tomorrow
      if (now > resetTime) {
        resetTime.setDate(resetTime.getDate() + 1);
      }
      
      const timeUntilReset = resetTime.getTime() - now.getTime();
      
      console.log('🕚 Daily reset scheduled for:', resetTime.toLocaleString());
      console.log('⏰ Time until reset:', Math.round(timeUntilReset / 1000 / 60), 'minutes');
      
      const resetTimeout = setTimeout(async () => {
        console.log('🌙 EXECUTING DAILY RESET AT 11:59 PM');
        
        try {
          // 1. Get all tickets currently being served
          const beingServedTickets = state.tickets.filter(t => t.status === 'being_served');
          
          console.log('📋 Tickets being served to complete:', beingServedTickets.length);
          
          // 2. Complete all tickets being served with system comment
          for (const ticket of beingServedTickets) {
            const now = new Date();
            const serviceTime = ticket.servedAt 
              ? Math.floor((now.getTime() - new Date(ticket.servedAt).getTime()) / 1000)
              : 0;
            const totalTime = Math.floor((now.getTime() - ticket.createdAt.getTime()) / 1000);

            await ticketService.updateTicket(ticket.id, {
              status: 'completed',
              completedAt: now,
              serviceTime,
              totalTime,
              cancellationComment: 'Finalizado por el sistema' // System completion comment
            });

            console.log(`✅ Ticket #${ticket.number} completed by system`);

            // 3. Update employee status - clear current ticket and set to paused
            if (ticket.servedBy) {
              const employee = state.employees.find(e => e.id === ticket.servedBy);
              if (employee) {
                await employeeService.updateEmployee(employee.id, {
                  ...employee,
                  currentTicketId: undefined,
                  totalTicketsServed: employee.totalTicketsServed + 1,
                  isPaused: true // Set employee to paused state
                });
                
                console.log(`👤 Employee ${employee.name} set to paused state`);
              }
            }
          }
          
          // 4. Reset visual states for new day
          setHighlightedTicket(null);
          setLastAnnouncedTicket(null);
          setCurrentImageIndex(0); // Reset carousel to first image
          
          console.log('🔄 Visual states reset for new day');
          console.log('✅ DAILY RESET COMPLETED SUCCESSFULLY');
          
        } catch (error) {
          console.error('❌ Error during daily reset:', error);
        }
        
        // 5. Schedule next reset for tomorrow at 11:59 PM
        setupDailyReset();
        
      }, timeUntilReset);
      
      // Store timeout ID for cleanup
      return resetTimeout;
    };
    
    const timeoutId = setupDailyReset();
    
    // Cleanup timeout on component unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        console.log('🧹 Daily reset timeout cleared');
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Carousel auto-rotation with configurable interval
  useEffect(() => {
    if (state.carouselImages.length > 0 && nodeConfig.showCarousel) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % state.carouselImages.length
        );
      }, nodeConfig.autoRotationInterval);

      return () => clearInterval(interval);
    }
  }, [state.carouselImages.length, nodeConfig.autoRotationInterval, nodeConfig.showCarousel]);

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_USER', payload: null });
  };

  // ENHANCED: Get tickets for display with daily filtering
  const getAllTicketsForDisplay = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log('📅 Filtering tickets for today:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      totalTickets: state.tickets.length
    });
    
    // CRITICAL: Only show tickets from TODAY
    const todaysTickets = state.tickets.filter(ticket => {
      const ticketDate = new Date(ticket.createdAt);
      const isToday = ticketDate >= startOfDay && ticketDate < endOfDay;
      
      if (!isToday) {
        console.log('🗑️ Filtering out old ticket:', {
          ticketNumber: ticket.number,
          createdAt: ticket.createdAt,
          isFromToday: isToday
        });
      }
      
      return isToday;
    });
    
    // Get being served tickets (only from today)
    const beingServedTickets = todaysTickets
      .filter(ticket => ticket.status === 'being_served')
      .sort((a, b) => {
        // Highlighted ticket (newly called) ALWAYS goes first
        if (highlightedTicket === a.id && highlightedTicket !== b.id) return -1;
        if (highlightedTicket === b.id && highlightedTicket !== a.id) return 1;
        
        // For non-highlighted tickets, sort by served time - MOST RECENT FIRST
        const aTime = a.servedAt ? new Date(a.servedAt).getTime() : 0;
        const bTime = b.servedAt ? new Date(b.servedAt).getTime() : 0;
        return bTime - aTime;
      });

    // Get today's completed tickets
    const todaysCompletedTickets = todaysTickets
      .filter(ticket => 
        ticket.status === 'completed' && 
        ticket.completedAt &&
        new Date(ticket.completedAt) >= startOfDay &&
        new Date(ticket.completedAt) < endOfDay
      )
      .sort((a, b) => {
        // Sort completed tickets by completion time - MOST RECENT FIRST
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bTime - aTime;
      });

    const combinedTickets = [...beingServedTickets, ...todaysCompletedTickets];
    
    console.log('📊 Today\'s tickets for display:', {
      beingServed: beingServedTickets.length,
      completed: todaysCompletedTickets.length,
      total: combinedTickets.length,
      maxToShow: nodeConfig.maxTicketsDisplayed
    });

    return combinedTickets;
  };

  const allTicketsForDisplay = getAllTicketsForDisplay();

  // Get next tickets in queue - only from today
  const waitingTickets = (() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return state.tickets
      .filter(ticket => {
        const ticketDate = new Date(ticket.createdAt);
        return ticket.status === 'waiting' && 
               ticketDate >= startOfDay && 
               ticketDate < endOfDay;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 2);
  })();

  // Apply custom styles from configuration
  const customStyles = {
    backgroundColor: nodeConfig.backgroundColor,
    color: nodeConfig.textColor,
  };

  // Calculate content height to maintain original aspect
  const contentHeight = nodeConfig.showHeader ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-40px)]';

  // Calculate layout based on carousel visibility
  const queueWidth = nodeConfig.showCarousel ? 'w-1/2' : 'w-full';
  const carouselWidth = nodeConfig.showCarousel ? 'w-1/2' : 'w-0';

  // Get company information from system settings
  const companyName = state.systemSettings?.companyName || 'Panel de Visualización';
  const companyLogo = state.systemSettings?.companyLogo;

  return (
    <div className="min-h-screen text-gray-800" style={customStyles}>
      {/* Conditional Header Component */}
      {nodeConfig.showHeader && (
        <NodeHeader
          onBack={handleBack}
          currentTime={currentTime}
          isConnected={state.isFirebaseConnected}
          audioEnabled={nodeConfig.enableAudio}
          showDateTime={nodeConfig.showDateTime}
          showConnectionStatus={nodeConfig.showConnectionStatus}
          showCompanyLogo={nodeConfig.showCompanyLogo}
          showCompanyName={nodeConfig.showCompanyName}
          headerColor={nodeConfig.headerColor}
          companyName={companyName}
          companyLogo={companyLogo}
        />
      )}

      <div className={`flex ${contentHeight}`}>
        {/* Queue Information - DYNAMIC WIDTH BASED ON CAROUSEL VISIBILITY */}
        <div className={`${queueWidth} p-3 transition-all duration-500`}>
          <QueueDisplay
            beingServedTickets={allTicketsForDisplay} // Only today's tickets
            waitingTickets={waitingTickets} // Only today's waiting tickets
            employees={state.employees}
            highlightedTicket={highlightedTicket}
            maxTicketsDisplayed={nodeConfig.maxTicketsDisplayed}
            showQueueInfo={nodeConfig.showQueueInfo}
            textColor={nodeConfig.textColor}
            accentColor={nodeConfig.accentColor}
            ticketBeingServedColor={nodeConfig.ticketBeingServedColor}
            ticketCompletedColor={nodeConfig.ticketCompletedColor}
            enableAnimations={nodeConfig.enableAnimations}
            isFullWidth={!nodeConfig.showCarousel}
          />
        </div>

        {/* Advertisement Carousel - CONDITIONAL RENDERING */}
        {nodeConfig.showCarousel && (
          <div className={`${carouselWidth} p-3 transition-all duration-500`}>
            <CarouselDisplay
              images={state.carouselImages}
              currentImageIndex={currentImageIndex}
              showImageDescriptions={nodeConfig.showImageDescriptions}
              showImageIndicators={nodeConfig.showImageIndicators}
              enableAnimations={nodeConfig.enableAnimations}
              textColor={nodeConfig.textColor}
              carouselTitle={nodeConfig.carouselTitle}
              enableScrollingText={nodeConfig.enableScrollingText}
              scrollingSpeed={nodeConfig.scrollingSpeed}
            />
          </div>
        )}
      </div>

      {/* Status Bar Component - CONDITIONAL RENDERING with FIXED POSITIONING */}
      {nodeConfig.showStatusBar && (
        <div className="fixed bottom-0 left-0 right-0">
          <StatusBar
            waitingTicketsCount={waitingTickets.length}
            beingServedTicketsCount={state.tickets.filter(t => {
              const today = new Date();
              const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
              const ticketDate = new Date(t.createdAt);
              
              return t.status === 'being_served' && 
                     ticketDate >= startOfDay && 
                     ticketDate < endOfDay;
            }).length} // Only count today's being served tickets
            activeEmployeesCount={state.employees.filter(e => e.isActive && !e.isPaused).length}
            currentTime={currentTime}
            audioEnabled={nodeConfig.enableAudio}
            selectedVoice={nodeConfig.selectedVoice}
            accentColor={nodeConfig.accentColor}
            showCarousel={nodeConfig.showCarousel}
          />
        </div>
      )}

      {/* Audio Manager Component */}
      <AudioManager
        tickets={state.tickets}
        employees={state.employees}
        lastAnnouncedTicket={lastAnnouncedTicket}
        onTicketAnnounced={setLastAnnouncedTicket}
        onTicketHighlighted={setHighlightedTicket}
        audioEnabled={nodeConfig.enableAudio}
        audioVolume={nodeConfig.audioVolume}
        selectedVoice={nodeConfig.selectedVoice}
        speechRate={nodeConfig.speechRate}
        highlightDuration={nodeConfig.highlightDuration}
      />
    </div>
  );
}