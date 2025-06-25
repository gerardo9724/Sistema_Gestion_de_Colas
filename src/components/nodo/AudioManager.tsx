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

  // CRITICAL FIX: Track processed announcements to prevent duplicates
  const processedAnnouncements = useRef<Set<string>>(new Set());
  const isProcessingAnnouncement = useRef<boolean>(false);

  // CRITICAL FIX: Enhanced employee lookup with validation
  const findCorrectEmployee = (ticket: Ticket): Employee | null => {
    console.log('🔍 EMPLOYEE LOOKUP: Finding correct employee for ticket', {
      ticketId: ticket.id,
      ticketNumber: ticket.number,
      servedBy: ticket.servedBy,
      availableEmployees: employees.length
    });

    // Method 1: Direct lookup by servedBy ID (most reliable)
    if (ticket.servedBy) {
      const directEmployee = employees.find(emp => emp.id === ticket.servedBy);
      if (directEmployee) {
        console.log('✅ EMPLOYEE FOUND (Direct): Using servedBy ID', {
          employeeId: directEmployee.id,
          employeeName: directEmployee.name,
          method: 'servedBy'
        });
        return directEmployee;
      } else {
        console.warn('⚠️ EMPLOYEE WARNING: servedBy ID not found in employees list', {
          servedById: ticket.servedBy,
          availableEmployeeIds: employees.map(e => ({ id: e.id, name: e.name }))
        });
      }
    }

    // Method 2: Find employee with this ticket as currentTicketId
    const employeeWithTicket = employees.find(emp => emp.currentTicketId === ticket.id);
    if (employeeWithTicket) {
      console.log('✅ EMPLOYEE FOUND (Current Ticket): Using currentTicketId match', {
        employeeId: employeeWithTicket.id,
        employeeName: employeeWithTicket.name,
        method: 'currentTicketId'
      });
      return employeeWithTicket;
    }

    console.error('❌ EMPLOYEE ERROR: No suitable employee found for ticket', {
      ticketId: ticket.id,
      ticketNumber: ticket.number,
      servedBy: ticket.servedBy,
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.isActive).length
    });

    return null;
  };

  // CRITICAL FIX: Monitor for NEW ticket calls only (prevent duplicates and wrong triggers)
  useEffect(() => {
    if (!audioEnabled || isProcessingAnnouncement.current) return;

    const beingServedTickets = tickets.filter(t => t.status === 'being_served');
    
    // CRITICAL FIX: Only process tickets with NEW servedAt timestamps that haven't been processed
    const ticketToAnnounce = beingServedTickets.find(ticket => {
      if (!ticket.servedAt) return false;
      
      // Create unique identifier for this specific call
      const callIdentifier = `${ticket.id}-${new Date(ticket.servedAt).getTime()}`;
      
      // CRITICAL: Check if this specific call has already been processed
      const alreadyProcessed = processedAnnouncements.current.has(callIdentifier);
      
      // CRITICAL: Only process if this is a NEW call (within last 3 seconds) AND not already processed
      const timeSinceServed = new Date().getTime() - new Date(ticket.servedAt).getTime();
      const isRecentCall = timeSinceServed < 3000; // 3 seconds window
      
      console.log('🔍 AUDIO CHECK: Checking ticket for announcement', {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        servedAt: ticket.servedAt,
        callIdentifier,
        alreadyProcessed,
        timeSinceServed: `${timeSinceServed}ms`,
        isRecentCall,
        shouldProcess: isRecentCall && !alreadyProcessed
      });
      
      return isRecentCall && !alreadyProcessed;
    });

    if (ticketToAnnounce) {
      // CRITICAL FIX: Use enhanced employee lookup
      const employee = findCorrectEmployee(ticketToAnnounce);
      
      if (employee) {
        // CRITICAL FIX: Prevent multiple simultaneous announcements
        isProcessingAnnouncement.current = true;
        
        // Mark this specific call as processed IMMEDIATELY
        const callIdentifier = `${ticketToAnnounce.id}-${new Date(ticketToAnnounce.servedAt!).getTime()}`;
        processedAnnouncements.current.add(callIdentifier);
        
        console.log('🔊 AUDIO ANNOUNCEMENT TRIGGERED:', {
          ticketNumber: ticketToAnnounce.number,
          employeeName: employee.name,
          employeeId: employee.id,
          servedAt: ticketToAnnounce.servedAt,
          callIdentifier,
          processedCount: processedAnnouncements.current.size
        });

        // Update the announced ticket ID for tracking
        onTicketAnnounced(ticketToAnnounce.id);
        
        // Highlight the ticket IMMEDIATELY
        onTicketHighlighted(ticketToAnnounce.id);
        
        // Play notification sound
        playNotificationSound();
        
        // CRITICAL FIX: Announce with CORRECT employee name
        setTimeout(() => {
          announceTicket(ticketToAnnounce.number, employee.name);
          
          // CRITICAL: Reset processing flag after announcement starts
          setTimeout(() => {
            isProcessingAnnouncement.current = false;
            console.log('🔓 AUDIO: Processing flag reset, ready for next announcement');
          }, 1000);
        }, 800);
        
        // Remove highlight after configured duration
        setTimeout(() => {
          onTicketHighlighted(null);
        }, highlightDuration);
        
        // CLEANUP: Remove old processed announcements (keep only last 50)
        if (processedAnnouncements.current.size > 50) {
          const oldEntries = Array.from(processedAnnouncements.current).slice(0, 25);
          oldEntries.forEach(entry => processedAnnouncements.current.delete(entry));
          console.log('🧹 AUDIO: Cleaned up old processed announcements');
        }
        
      } else {
        console.error('❌ AUDIO ERROR: No employee found for ticket announcement', {
          ticketId: ticketToAnnounce.id,
          ticketNumber: ticketToAnnounce.number,
          servedBy: ticketToAnnounce.servedBy
        });
      }
    }
  }, [tickets, audioEnabled, highlightDuration, employees, onTicketAnnounced, onTicketHighlighted]);

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
        // CRITICAL FIX: More natural and softer announcement text with CORRECT employee name
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
          
          console.log('🔊 PLAYING SINGLE AUDIO ANNOUNCEMENT:', {
            text,
            employeeName,
            voice: selectedVoiceObj?.name || 'default'
          });
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