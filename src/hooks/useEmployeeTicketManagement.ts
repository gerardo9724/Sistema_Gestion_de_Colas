import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { ticketService } from '../services/ticketService';
import { employeeService } from '../services/employeeService';
import type { Ticket } from '../types';

export function useEmployeeTicketManagement(employeeId: string) {
  const { state, deriveTicketToEmployee, deriveTicketToQueue, autoAssignNextTicket } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  
  // CRITICAL FIX: Simplify debounce control - remove complex tracking
  const isToggleInProgressRef = useRef<boolean>(false);

  const currentEmployee = state.employees.find(e => e.id === employeeId);
  
  const currentTicket = state.tickets.find(ticket => 
    ticket.status === 'being_served' && ticket.servedBy === employeeId
  );

  const waitingTickets = state.tickets
    .filter(ticket => ticket.status === 'waiting')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleStartService = async (ticketId: string) => {
    if (!currentEmployee) return;

    // Check if this is the next ticket in sequence
    const nextTicket = waitingTickets[0];
    if (!nextTicket || nextTicket.id !== ticketId) {
      alert('Solo puedes atender el siguiente ticket en la secuencia');
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const waitTime = Math.floor((now.getTime() - nextTicket.createdAt.getTime()) / 1000);
      
      await ticketService.updateTicket(ticketId, {
        status: 'being_served',
        servedBy: employeeId,
        servedAt: now,
        waitTime
      });

      await employeeService.updateEmployee(employeeId, {
        ...currentEmployee,
        currentTicketId: ticketId,
        isPaused: false,
        isActive: true
      });
    } catch (error) {
      console.error('Error starting service:', error);
      alert('Error al iniciar la atención del ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTicket = async (ticketId: string, callNext: boolean = false) => {
    if (!currentEmployee || !currentTicket) return;

    setIsLoading(true);
    try {
      const now = new Date();
      const serviceTime = currentTicket.servedAt 
        ? Math.floor((now.getTime() - new Date(currentTicket.servedAt).getTime()) / 1000)
        : 0;
      const totalTime = Math.floor((now.getTime() - currentTicket.createdAt.getTime()) / 1000);
      
      await ticketService.updateTicket(ticketId, {
        status: 'completed',
        completedAt: now,
        serviceTime,
        totalTime
      });

      console.log(`🎯 COMPLETE TICKET: Completing ticket ${currentTicket.number}, callNext: ${callNext}`);

      if (callNext) {
        console.log('🔄 CALL NEXT: Attempting to auto-assign next ticket...');
        
        await employeeService.updateEmployee(employeeId, {
          ...currentEmployee,
          currentTicketId: undefined,
          totalTicketsServed: currentEmployee.totalTicketsServed + 1,
          isPaused: false,
          isActive: true
        });

        setTimeout(async () => {
          try {
            const assignedTicket = await autoAssignNextTicket(employeeId);
            if (assignedTicket) {
              console.log(`✅ CALL NEXT: Auto-assigned ticket ${assignedTicket.number} to ${currentEmployee.name}`);
            } else {
              console.log('📭 CALL NEXT: No tickets available, employee remains ACTIVE and ready');
            }
          } catch (error) {
            console.error('❌ CALL NEXT ERROR: Failed to auto-assign ticket:', error);
          }
        }, 500);
        
      } else {
        console.log('⏸️ COMPLETE ONLY: Completing ticket and pausing employee');
        
        await employeeService.updateEmployee(employeeId, {
          ...currentEmployee,
          currentTicketId: undefined,
          totalTicketsServed: currentEmployee.totalTicketsServed + 1,
          isPaused: true,
          isActive: true
        });
      }

    } catch (error) {
      console.error('Error completing ticket:', error);
      alert('Error al completar el ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId: string, reason: string, comment: string) => {
    if (!currentEmployee || !currentTicket) return;

    setIsLoading(true);
    try {
      const totalTime = Math.floor((new Date().getTime() - currentTicket.createdAt.getTime()) / 1000);
      
      await ticketService.updateTicket(ticketId, {
        status: 'cancelled',
        cancelledAt: new Date(),
        totalTime,
        cancellationReason: reason,
        cancellationComment: comment,
        cancelledBy: employeeId
      });

      await employeeService.updateEmployee(employeeId, {
        ...currentEmployee,
        currentTicketId: undefined,
        totalTicketsCancelled: currentEmployee.totalTicketsCancelled + 1,
        isPaused: true,
        isActive: true
      });
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeriveTicket = async (
    ticketId: string,
    targetType: 'queue' | 'employee',
    targetId?: string,
    options?: any
  ) => {
    if (!currentEmployee) return;

    setIsLoading(true);
    try {
      if (targetType === 'employee' && targetId) {
        await deriveTicketToEmployee(ticketId, employeeId, targetId, options);
      } else {
        await deriveTicketToQueue(ticketId, employeeId, options);
      }
    } catch (error) {
      console.error('Error deriving ticket:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecallTicket = async (ticketId: string) => {
    if (!currentEmployee || !currentTicket) return;

    setIsLoading(true);
    try {
      const now = new Date();
      await ticketService.updateTicket(ticketId, {
        servedAt: now,
      });

      console.log(`🔊 RECALL: Ticket ${currentTicket.number} recalled by ${currentEmployee.name}`);
    } catch (error) {
      console.error('Error recalling ticket:', error);
      alert('Error al volver a llamar el ticket');
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL FIX: Simplified toggle pause function without complex debouncing
  const handleTogglePause = useCallback(async () => {
    console.log('🔄 TOGGLE PAUSE: Starting simplified toggle process');
    
    // CRITICAL: Basic protection against multiple simultaneous executions
    if (isToggleInProgressRef.current) {
      console.log('🚫 TOGGLE PAUSE: Already in progress, ignoring call');
      return;
    }

    // CRITICAL: Validate employee exists
    if (!currentEmployee) {
      console.error('❌ TOGGLE PAUSE: No current employee found');
      alert('Error: No se encontró información del empleado');
      return;
    }

    if (!employeeId) {
      console.error('❌ TOGGLE PAUSE: No employee ID provided');
      alert('Error: ID de empleado no disponible');
      return;
    }

    // CRITICAL: Check for current ticket
    if (currentTicket) {
      console.log('🚫 TOGGLE PAUSE: Blocked due to current ticket');
      alert('No puedes pausar mientras tienes un ticket en atención. Finaliza el ticket primero.');
      return;
    }

    // CRITICAL: Set execution flag
    isToggleInProgressRef.current = true;
    setIsLoading(true);

    console.log('👤 TOGGLE PAUSE: Starting execution', {
      employeeId,
      employeeName: currentEmployee.name,
      currentPauseState: currentEmployee.isPaused,
      currentActiveState: currentEmployee.isActive
    });

    try {
      const newPauseState = !currentEmployee.isPaused;
      
      console.log(`🔄 TOGGLE PAUSE: State transition`, {
        from: { isPaused: currentEmployee.isPaused, isActive: currentEmployee.isActive },
        to: { isPaused: newPauseState, isActive: currentEmployee.isActive },
        action: newPauseState ? 'PAUSING' : 'RESUMING'
      });
      
      // CRITICAL FIX: Simple update with only the necessary fields
      const updateData = {
        isPaused: newPauseState
      };

      console.log('💾 TOGGLE PAUSE: Sending simple update to Firebase:', {
        employeeId,
        updateData
      });

      // CRITICAL: Direct database call without complex timeout handling
      await employeeService.updateEmployee(employeeId, updateData);

      console.log(`✅ TOGGLE PAUSE: Database update completed successfully`);

      // CRITICAL: Handle post-update logic
      if (currentEmployee.isPaused && !newPauseState) {
        console.log('🎯 RESUME: Employee resuming');
        
        // Try auto-assignment after a delay
        setTimeout(async () => {
          try {
            console.log('🤖 RESUME: Attempting auto-assignment...');
            const assignedTicket = await autoAssignNextTicket(employeeId);
            if (assignedTicket) {
              console.log(`✅ RESUME: Auto-assigned ticket ${assignedTicket.number}`);
            } else {
              console.log('📭 RESUME: No tickets available, employee ready');
            }
          } catch (error) {
            console.error('❌ RESUME ERROR:', error);
          }
        }, 1000);
        
      } else if (!currentEmployee.isPaused && newPauseState) {
        console.log('⏸️ PAUSE: Employee paused successfully');
      }
      
    } catch (error) {
      console.error('❌ TOGGLE PAUSE ERROR:', error);
      
      let errorMessage = 'Error al cambiar estado de pausa';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
      
    } finally {
      // CRITICAL: Always reset flags
      setIsLoading(false);
      
      // Reset execution flag after a short delay
      setTimeout(() => {
        isToggleInProgressRef.current = false;
        console.log('🔓 TOGGLE PAUSE: Execution flag reset');
      }, 500);
    }
  }, [currentEmployee, employeeId, currentTicket, autoAssignNextTicket]);

  return {
    currentTicket,
    waitingTickets,
    handleStartService,
    handleCompleteTicket,
    handleCancelTicket,
    handleDeriveTicket,
    handleRecallTicket,
    handleTogglePause,
    isLoading
  };
}