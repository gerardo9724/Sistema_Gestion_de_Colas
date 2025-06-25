import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { ticketService } from '../services/ticketService';
import { employeeService } from '../services/employeeService';
import type { Ticket } from '../types';

export function useEmployeeTicketManagement(employeeId: string) {
  const { state, deriveTicketToEmployee, deriveTicketToQueue, autoAssignNextTicket } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  
  // CRITICAL FIX: Prevent multiple simultaneous toggle operations
  const isToggleInProgressRef = useRef<boolean>(false);
  const lastToggleTimeRef = useRef<number>(0);
  
  // CRITICAL NEW: Track if auto-activation has been attempted
  const autoActivationAttemptedRef = useRef<boolean>(false);

  const currentEmployee = state.employees.find(e => e.id === employeeId);
  
  const currentTicket = state.tickets.find(ticket => 
    ticket.status === 'being_served' && ticket.servedBy === employeeId
  );

  const waitingTickets = state.tickets
    .filter(ticket => ticket.status === 'waiting')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // CRITICAL NEW: Auto-activate employee on login if not already attempted
  useEffect(() => {
    const autoActivateOnLogin = async () => {
      if (!currentEmployee || !state.isFirebaseConnected || autoActivationAttemptedRef.current) {
        return;
      }

      // CRITICAL: Only auto-activate if employee is currently inactive
      if (!currentEmployee.isActive) {
        console.log('🚀 AUTO-ACTIVATION ON LOGIN: Employee is inactive, activating...', {
          employeeId: currentEmployee.id,
          employeeName: currentEmployee.name,
          currentIsActive: currentEmployee.isActive,
          currentIsPaused: currentEmployee.isPaused
        });

        try {
          autoActivationAttemptedRef.current = true;
          
          await employeeService.updateEmployee(employeeId, {
            isActive: true,    // CRITICAL: Activate employee on login
            isPaused: false    // CRITICAL: Unpause employee on login
          });

          console.log('✅ AUTO-ACTIVATION: Employee activated successfully on login');
        } catch (error) {
          console.error('❌ AUTO-ACTIVATION ERROR:', error);
          autoActivationAttemptedRef.current = false; // Allow retry on error
        }
      } else {
        console.log('✅ AUTO-ACTIVATION: Employee already active, no action needed');
        autoActivationAttemptedRef.current = true;
      }
    };

    // Run auto-activation when employee data is available
    if (currentEmployee && state.isFirebaseConnected) {
      autoActivateOnLogin();
    }
  }, [currentEmployee?.id, currentEmployee?.isActive, state.isFirebaseConnected, employeeId]);

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

  // CRITICAL FIX: Completely rewritten toggle pause with proper state management
  const handleTogglePause = useCallback(async () => {
    const now = Date.now();
    
    // CRITICAL: Strict time-based debouncing (minimum 3 seconds between toggles)
    if (now - lastToggleTimeRef.current < 3000) {
      console.log('🚫 TOGGLE BLOCKED: Too rapid, minimum 3 seconds required');
      return;
    }

    // CRITICAL: Prevent multiple simultaneous executions
    if (isToggleInProgressRef.current) {
      console.log('🚫 TOGGLE BLOCKED: Already in progress');
      return;
    }

    // CRITICAL: Validate employee exists
    if (!currentEmployee) {
      console.error('❌ TOGGLE ERROR: No current employee found');
      return;
    }

    if (!employeeId) {
      console.error('❌ TOGGLE ERROR: No employee ID provided');
      return;
    }

    // CRITICAL: Check for current ticket
    if (currentTicket) {
      console.log('🚫 TOGGLE BLOCKED: Employee has current ticket');
      alert('No puedes pausar mientras tienes un ticket en atención. Finaliza el ticket primero.');
      return;
    }

    // CRITICAL: Set protection flags
    isToggleInProgressRef.current = true;
    lastToggleTimeRef.current = now;
    setIsLoading(true);

    console.log('🔄 TOGGLE PAUSE: Starting execution', {
      employeeId,
      employeeName: currentEmployee.name,
      currentIsActive: currentEmployee.isActive,
      currentIsPaused: currentEmployee.isPaused,
      timestamp: new Date().toISOString()
    });

    try {
      // CRITICAL FIX: Simple and clear state toggle logic
      const newIsActive = !currentEmployee.isActive;
      const newIsPaused = !newIsActive; // isPaused is always opposite of isActive
      
      console.log(`🔄 TOGGLE PAUSE: State transition`, {
        from: { isActive: currentEmployee.isActive, isPaused: currentEmployee.isPaused },
        to: { isActive: newIsActive, isPaused: newIsPaused },
        action: newIsActive ? 'ACTIVATING/RESUMING' : 'DEACTIVATING/PAUSING'
      });
      
      // CRITICAL: Update employee state with explicit values
      await employeeService.updateEmployee(employeeId, {
        isActive: newIsActive,
        isPaused: newIsPaused
      });

      console.log(`✅ TOGGLE PAUSE: Database update completed successfully`);

      // CRITICAL: Handle post-update logic
      if (!currentEmployee.isActive && newIsActive) {
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
          } catch (error) {
            console.error('❌ RESUME ERROR:', error);
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ TOGGLE PAUSE ERROR:', error);
      alert(`Error al cambiar estado del empleado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
    } finally {
      // CRITICAL: Always reset flags with delay
      setTimeout(() => {
        setIsLoading(false);
        isToggleInProgressRef.current = false;
        console.log('🔓 TOGGLE PAUSE: All flags reset');
      }, 1500); // Increased delay to prevent rapid clicks
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