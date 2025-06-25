import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { ticketService } from '../services/ticketService';
import { employeeService } from '../services/employeeService';
import type { Ticket } from '../types';

export function useEmployeeTicketManagement(employeeId: string) {
  const { state, deriveTicketToEmployee, deriveTicketToQueue, autoAssignNextTicket } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  
  // CRITICAL FIX: Simple execution control
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

      // CRITICAL FIX: Update employee with proper isActive and isPaused logic
      await employeeService.updateEmployee(employeeId, {
        currentTicketId: ticketId,
        isActive: true,    // CRITICAL: Employee becomes active when serving
        isPaused: false    // CRITICAL: Employee is not paused when serving
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
        
        // CRITICAL FIX: When calling next, keep employee active and not paused
        await employeeService.updateEmployee(employeeId, {
          currentTicketId: undefined,
          totalTicketsServed: currentEmployee.totalTicketsServed + 1,
          isActive: true,    // CRITICAL: Keep active for next ticket
          isPaused: false    // CRITICAL: Keep not paused for next ticket
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
        
        // CRITICAL FIX: When completing without calling next, pause employee
        await employeeService.updateEmployee(employeeId, {
          currentTicketId: undefined,
          totalTicketsServed: currentEmployee.totalTicketsServed + 1,
          isActive: false,   // CRITICAL: Employee becomes inactive
          isPaused: true     // CRITICAL: Employee becomes paused
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

      // CRITICAL FIX: When cancelling, pause employee
      await employeeService.updateEmployee(employeeId, {
        currentTicketId: undefined,
        totalTicketsCancelled: currentEmployee.totalTicketsCancelled + 1,
        isActive: false,   // CRITICAL: Employee becomes inactive
        isPaused: true     // CRITICAL: Employee becomes paused
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

  // CRITICAL FIX: Completely rewritten toggle pause function with proper error handling
  const handleTogglePause = useCallback(async () => {
    console.log('🔄 TOGGLE PAUSE: Starting execution');

    // CRITICAL: Prevent multiple simultaneous executions
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

    try {
      // CRITICAL FIX: Simple toggle logic - isActive and isPaused are opposites
      const newIsActive = !currentEmployee.isActive;
      const newIsPaused = !newIsActive;

      console.log('🔄 TOGGLE PAUSE: State transition', {
        employeeId,
        employeeName: currentEmployee.name,
        from: { isActive: currentEmployee.isActive, isPaused: currentEmployee.isPaused },
        to: { isActive: newIsActive, isPaused: newIsPaused }
      });

      // CRITICAL: Update employee state with proper error handling
      const updateData = {
        isActive: newIsActive,
        isPaused: newIsPaused
      };

      console.log('💾 TOGGLE PAUSE: Updating employee state...');
      
      // CRITICAL FIX: Wrap in try-catch to handle Firebase errors properly
      try {
        await employeeService.updateEmployee(employeeId, updateData);
        console.log('✅ TOGGLE PAUSE: Employee state updated successfully');
      } catch (updateError) {
        console.error('❌ TOGGLE PAUSE: Firebase update failed:', updateError);
        throw new Error('Error al actualizar estado en la base de datos');
      }

      // CRITICAL: Handle post-update logic only if update was successful
      if (newIsActive && !currentEmployee.isActive) {
        console.log('🎯 RESUME: Employee resuming, attempting auto-assignment...');
        
        // Try auto-assignment after a delay
        setTimeout(async () => {
          try {
            const assignedTicket = await autoAssignNextTicket(employeeId);
            if (assignedTicket) {
              console.log(`✅ RESUME: Auto-assigned ticket ${assignedTicket.number}`);
            } else {
              console.log('📭 RESUME: No tickets available, employee ready');
            }
          } catch (autoAssignError) {
            console.error('❌ RESUME ERROR:', autoAssignError);
            // Don't throw here, auto-assignment failure shouldn't break the toggle
          }
        }, 1000);
      } else if (!newIsActive && currentEmployee.isActive) {
        console.log('⏸️ PAUSE: Employee paused successfully');
      }

    } catch (error) {
      console.error('❌ TOGGLE PAUSE ERROR:', error);
      
      // CRITICAL: Provide user-friendly error message
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