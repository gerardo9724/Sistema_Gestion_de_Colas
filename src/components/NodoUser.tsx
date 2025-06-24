import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import NodeHeader from './nodo/NodeHeader';
import QueueDisplay from './nodo/QueueDisplay';
import CarouselDisplay from './nodo/CarouselDisplay';
import StatusBar from './nodo/StatusBar';
import AudioManager from './nodo/AudioManager';

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

  // CRITICAL UPDATED: Get ALL tickets (being served AND completed today) for proper display
  const getAllTicketsForDisplay = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Get being served tickets
    const beingServedTickets = state.tickets
      .filter(ticket => ticket.status === 'being_served')
      .sort((a, b) => {
        // CRITICAL: Highlighted ticket (newly called) ALWAYS goes first (top position)
        if (highlightedTicket === a.id && highlightedTicket !== b.id) return -1;
        if (highlightedTicket === b.id && highlightedTicket !== a.id) return 1;
        
        // For non-highlighted tickets, sort by served time - MOST RECENT FIRST
        const aTime = a.servedAt ? new Date(a.servedAt).getTime() : 0;
        const bTime = b.servedAt ? new Date(b.servedAt).getTime() : 0;
        return bTime - aTime; // Most recent (last called) first, then older ones below
      });

    // Get today's completed tickets
    const todaysCompletedTickets = state.tickets
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
        return bTime - aTime; // Most recently completed first
      });

    // CRITICAL: Combine following the scenario ordering:
    // 1. Being served tickets (with highlighted first)
    // 2. Today's completed tickets (most recent first)
    return [...beingServedTickets, ...todaysCompletedTickets];
  };

  const allTicketsForDisplay = getAllTicketsForDisplay();

  // Get next tickets in queue - limited to 2 only
  const waitingTickets = state.tickets
    .filter(ticket => ticket.status === 'waiting')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 2);

  // Apply custom styles from configuration
  const customStyles = {
    backgroundColor: nodeConfig.backgroundColor,
    color: nodeConfig.textColor,
  };

  // Calculate content height to maintain original aspect - always reserve space for status bar
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
            beingServedTickets={allTicketsForDisplay} // UPDATED: Pass all tickets (being served + completed today)
            waitingTickets={waitingTickets}
            employees={state.employees}
            highlightedTicket={highlightedTicket}
            maxTicketsDisplayed={nodeConfig.maxTicketsDisplayed}
            showQueueInfo={nodeConfig.showQueueInfo}
            textColor={nodeConfig.textColor}
            accentColor={nodeConfig.accentColor}
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
            beingServedTicketsCount={state.tickets.filter(t => t.status === 'being_served').length} // Only count being served
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