import React, { useEffect, useRef } from 'react';
import type { Ticket, Employee } from '../../types';

interface AudioManagerProps {
  tickets: Ticket[];
  employees: Employee[];
  lastAnnouncedTicket: string | null;
  onTicketAnnounced: (ticketId: string) => void;
  onTicketHighlighted: (ticketId: string | null) => void;
  audioEnabled: boolean;
  audioVolume: number;
  selectedVoice: string;
  speechRate: number;
  highlightDuration: number;
}

export default function AudioManager({
  tickets,
  employees,
  lastAnnouncedTicket,
  onTicketAnnounced,
  onTicketHighlighted,
  audioEnabled,
  audioVolume,
  selectedVoice,
  speechRate,
  highlightDuration
}: AudioManagerProps) {

  // CRITICAL: Use refs to track processed tickets and prevent duplicate announcements
  const processedTicketsRef = useRef<Set<string>>(new Set());
  const lastProcessTimeRef = useRef<number>(0);
  const isAnnouncingRef = useRef<boolean>(false);

  // FIXED: Enhanced ticket call detection with strict single-call validation
  useEffect(() => {
    if (!audioEnabled || isAnnouncingRef.current) return;

    const now = Date.now();
    
    // CRITICAL: Prevent rapid successive calls (debounce mechanism)
    if (now - lastProcessTimeRef.current < 2000) {
      return;
    }

    const beingServedTickets = tickets.filter(t => t.status === 'being_served');
    
    // CRITICAL: Find tickets that were JUST updated to being_served status
    const newlyCalledTicket = beingServedTickets.find(ticket => {
      if (!ticket.servedAt) return false;
      
      // Check if this ticket was recently updated (within last 2 seconds)
      const timeSinceServed = now - new Date(ticket.servedAt).getTime();
      const isRecentlyUpdated = timeSinceServed < 2000;
      
      // CRITICAL: Ensure this ticket hasn't been processed yet
      const notProcessedYet = !processedTicketsRef.current.has(ticket.id);
      
      console.log('🔍 Audio Manager - Checking ticket:', {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        servedAt: ticket.servedAt,
        timeSinceServed,
        isRecentlyUpdated,
        notProcessedYet,
        alreadyProcessed: processedTicketsRef.current.has(ticket.id)
      });
      
      return isRecentlyUpdated && notProcessedYet;
    });

    if (newlyCalledTicket) {
      const employee = employees.find(emp => emp.id === newlyCalledTicket.servedBy);
      
      if (employee) {
        console.log('🔊 SINGLE AUDIO CALL TRIGGERED:', {
          ticketNumber: newlyCalledTicket.number,
          employeeName: employee.name,
          servedAt: newlyCalledTicket.servedAt,
          ticketId: newlyCalledTicket.id
        });

        // CRITICAL: Mark this ticket as processed IMMEDIATELY to prevent duplicates
        processedTicketsRef.current.add(newlyCalledTicket.id);
        isAnnouncingRef.current = true;
        lastProcessTimeRef.current = now;
        
        // Update state
        onTicketAnnounced(newlyCalledTicket.id);
        onTicketHighlighted(newlyCalledTicket.id);
        
        // Play notification sound
        playNotificationSound();
        
        // Announce after 800ms
        setTimeout(() => {
          announceTicket(newlyCalledTicket.number, employee.name);
        }, 800);
        
        // Remove highlight after configured duration
        setTimeout(() => {
          onTicketHighlighted(null);
          isAnnouncingRef.current = false;
        }, highlightDuration);
      }
    }

    // CLEANUP: Remove old processed tickets (older than 5 minutes) to prevent memory leaks
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const currentProcessedTickets = Array.from(processedTicketsRef.current);
    
    currentProcessedTickets.forEach(ticketId => {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket && ticket.servedAt) {
        const ticketTime = new Date(ticket.servedAt).getTime();
        if (ticketTime < fiveMinutesAgo) {
          processedTicketsRef.current.delete(ticketId);
        }
      }
    });

  }, [tickets, audioEnabled, highlightDuration, employees, onTicketAnnounced, onTicketHighlighted]);

  // CLEANUP: Reset processed tickets when audio is disabled
  useEffect(() => {
    if (!audioEnabled) {
      processedTicketsRef.current.clear();
      isAnnouncingRef.current = false;
    }
  }, [audioEnabled]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a soft, pleasant notification chime
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2); // E5
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.4); // G5
      
      gainNode.gain.setValueAtTime(audioVolume * 0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const announceTicket = (ticketNumber: number, employeeName: string) => {
    if ('speechSynthesis' in window) {
      // CRITICAL: Cancel any ongoing speech before starting new one
      speechSynthesis.cancel();
      
      // Wait a moment to ensure previous speech is cancelled
      setTimeout(() => {
        // More natural and softer announcement text
        const text = `Ticket número ${ticketNumber.toString().padStart(3, '0')}. Favor dirigirse con ${employeeName}`;
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Wait for voices to load
        const setVoiceAndSpeak = () => {
          const voices = speechSynthesis.getVoices();
          
          let selectedVoiceObj = null;
          
          // If specific voice is selected, try to find it
          if (selectedVoice !== 'auto-male' && selectedVoice !== 'auto-female') {
            selectedVoiceObj = voices.find(voice => 
              voice.name.toLowerCase().includes(selectedVoice.toLowerCase())
            );
          }
          
          // If no specific voice found, use auto selection
          if (!selectedVoiceObj) {
            const isAutoMale = selectedVoice === 'auto-male' || 
                             selectedVoice.includes('Pablo') || 
                             selectedVoice.includes('Raul') ||
                             selectedVoice.includes('Jorge') ||
                             selectedVoice.includes('Juan') ||
                             selectedVoice.includes('Carlos') ||
                             selectedVoice.includes('Diego') ||
                             selectedVoice.includes('Andrés') ||
                             selectedVoice.includes('Miguel');
            
            if (isAutoMale) {
              // Find male voice
              const maleVoices = ['Pablo', 'Raul', 'Jorge', 'Juan', 'Carlos', 'Diego', 'Andrés', 'Miguel'];
              for (const maleName of maleVoices) {
                selectedVoiceObj = voices.find(voice => 
                  voice.lang.includes('es') && 
                  voice.name.toLowerCase().includes(maleName.toLowerCase())
                );
                if (selectedVoiceObj) break;
              }
            } else {
              // Find female voice
              const femaleVoices = ['Helena', 'Sabina', 'Mónica', 'Paulina', 'Esperanza', 'Marisol'];
              for (const femaleName of femaleVoices) {
                selectedVoiceObj = voices.find(voice => 
                  voice.lang.includes('es') && 
                  voice.name.toLowerCase().includes(femaleName.toLowerCase())
                );
                if (selectedVoiceObj) break;
              }
            }
          }
          
          // Final fallback to any Spanish voice
          if (!selectedVoiceObj) {
            selectedVoiceObj = voices.find(voice => voice.lang.includes('es'));
          }

          if (selectedVoiceObj) {
            utterance.voice = selectedVoiceObj;
          }
          
          utterance.lang = 'es-ES';
          utterance.rate = speechRate;
          utterance.pitch = 0.9;
          utterance.volume = audioVolume;
          
          // CRITICAL: Add event listeners to track speech completion
          utterance.onstart = () => {
            console.log('🔊 AUDIO ANNOUNCEMENT STARTED:', text);
          };
          
          utterance.onend = () => {
            console.log('🔊 AUDIO ANNOUNCEMENT COMPLETED');
          };
          
          utterance.onerror = (event) => {
            console.error('🔊 AUDIO ANNOUNCEMENT ERROR:', event);
            isAnnouncingRef.current = false;
          };
          
          speechSynthesis.speak(utterance);
        };

        // Check if voices are already loaded
        if (speechSynthesis.getVoices().length > 0) {
          setVoiceAndSpeak();
        } else {
          // Wait for voices to load
          speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
        }
      }, 100); // Small delay to ensure speech cancellation
    }
  };

  // This component doesn't render anything visible
  return null;
}