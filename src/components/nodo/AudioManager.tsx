import React, { useEffect } from 'react';
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

  // FIXED: Monitor for new tickets being served (for announcements) - SINGLE CALL ONLY
  useEffect(() => {
    if (!audioEnabled) return;

    const beingServedTickets = tickets.filter(t => t.status === 'being_served');
    
    // CRITICAL: Find newly served tickets that haven't been announced yet
    const newlyServedTicket = beingServedTickets.find(ticket => {
      // FIXED: Only announce if this ticket hasn't been announced before AND has a recent servedAt time
      return ticket.id !== lastAnnouncedTicket && 
             ticket.servedAt && 
             new Date().getTime() - new Date(ticket.servedAt).getTime() < 5000; // Within last 5 seconds
    });

    if (newlyServedTicket) {
      const employee = employees.find(emp => emp.id === newlyServedTicket.servedBy);
      
      if (employee) {
        console.log('🔊 NEW TICKET CALL DETECTED:', {
          ticketNumber: newlyServedTicket.number,
          employeeName: employee.name,
          lastAnnounced: lastAnnouncedTicket,
          currentTicket: newlyServedTicket.id
        });

        // CRITICAL: Mark this ticket as announced IMMEDIATELY to prevent duplicate calls
        onTicketAnnounced(newlyServedTicket.id);
        
        // Highlight the ticket IMMEDIATELY
        onTicketHighlighted(newlyServedTicket.id);
        
        // Play notification sound
        playNotificationSound();
        
        // SINGLE announcement after 800ms
        setTimeout(() => {
          announceTicket(newlyServedTicket.number, employee.name);
        }, 800);
        
        // Remove highlight after configured duration
        setTimeout(() => {
          onTicketHighlighted(null);
        }, highlightDuration);
      }
    }
  }, [tickets, audioEnabled, highlightDuration, lastAnnouncedTicket, employees, onTicketAnnounced, onTicketHighlighted]);

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
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // FIXED: Wait a moment to ensure previous speech is cancelled
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
          
          console.log('🔊 PLAYING SINGLE AUDIO ANNOUNCEMENT:', text);
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