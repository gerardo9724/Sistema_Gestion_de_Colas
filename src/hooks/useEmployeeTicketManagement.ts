import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { ticketService } from '../services/ticketService';
import { employeeService } from '../services/employeeService';
import type { Ticket } from '../types';

export function useEmployeeTicketManagement(employeeId: string) {
  const { state, deriveTicketToEmployee, deriveTicketToQueue, autoAssignNextTicket } = useApp();
  const [isLoading, setIsLoading] = useState(false);

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
        isActive: true // CRITICAL: Ensure employee is active when serving
      });
    } catch (error) {
      console.error('Error starting service:', error);
      alert('Error al iniciar la atención del ticket');
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL FIX: Enhanced complete ticket with proper "call next" behavior
  const handleCompleteTicket = async (ticketId: string, callNext: boolean = false) => {
    if (!currentEmployee || !currentTicket) return;

    setIsLoading(true);
    try {
      const now = new Date();
      const serviceTime = currentTicket.servedAt 
        ? Math.floor((now.getTime() - new Date(currentTicket.servedAt).getTime()) / 1000)
        : 0;
      const totalTime = Math.floor((now.getTime() - currentTicket.createdAt.getTime()) / 1000);
      
      // Complete the current ticket
      await ticketService.updateTicket(ticketId, {
        status: 'completed',
        completedAt: now,
        serviceTime,
        totalTime
      });

      console.log(`🎯 COMPLETE TICKET: Completing ticket ${currentTicket.number}, callNext: ${callNext}`);

      // CRITICAL FIX: Handle employee state based on callNext parameter
      if (callNext) {
        console.log('🔄 CALL NEXT: Attempting to auto-assign next ticket...');
        
        // First update employee stats but keep them active (not paused)
        await employeeService.updateEmployee(employeeId, {
          ...currentEmployee,
          currentTicketId: undefined,
          totalTicketsServed: currentEmployee.totalTicketsServed + 1,
          isPaused: false, // CRITICAL: Keep employee ACTIVE for auto-assignment
          isActive: true // CRITICAL: Ensure employee remains active
        });

        // Try to auto-assign next ticket immediately
        setTimeout(async () => {
          try {
            const assignedTicket = await autoAssignNextTicket(employeeId);
            if (assignedTicket) {
              console.log(`✅ CALL NEXT: Auto-assigned ticket ${assignedTicket.number} to ${currentEmployee.name}`);
            } else {
              console.log('📭 CALL NEXT: No tickets available, employee remains ACTIVE and ready');
              // CRITICAL: Employee stays active (not paused) even when no tickets available
              // This ensures immediate assignment when new tickets arrive
            }
          } catch (error) {
            console.error('❌ CALL NEXT ERROR: Failed to auto-assign ticket:', error);
            // Even on error, keep employee active for manual assignment
          }
        }, 500);
        
      } else {
        console.log('⏸️ COMPLETE ONLY: Completing ticket and pausing employee');
        
        // Regular completion - pause the employee but keep them active in the system
        await employeeService.updateEmployee(employeeId, {
          ...currentEmployee,
          currentTicketId: undefined,
          totalTicketsServed: currentEmployee.totalTicketsServed + 1,
          isPaused: true, // Pause employee for regular completion
          isActive: true // CRITICAL: Keep employee active in the system
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
        isActive: true // CRITICAL: Keep employee active in the system
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

  // NEW: Recall ticket function
  const handleRecallTicket = async (ticketId: string) => {
    if (!currentEmployee || !currentTicket) return;

    setIsLoading(true);
    try {
      // Update the servedAt time to trigger a new audio announcement
      const now = new Date();
      await ticketService.updateTicket(ticketId, {
        servedAt: now, // This will trigger the audio system to announce again
      });

      console.log(`🔊 RECALL: Ticket ${currentTicket.number} recalled by ${currentEmployee.name}`);
    } catch (error) {
      console.error('Error recalling ticket:', error);
      alert('Error al volver a llamar el ticket');
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL FIX: COMPLETELY REWRITTEN toggle pause function with proper isActive management
  const handleTogglePause = async () => {
    console.log('🔄 TOGGLE PAUSE HOOK: Function called with comprehensive validation');
    
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

    console.log('👤 TOGGLE PAUSE: Employee validation successful', {
      employeeId,
      employeeName: currentEmployee.name,
      currentPauseState: currentEmployee.isPaused,
      currentActiveState: currentEmployee.isActive,
      hasCurrentTicket: !!currentTicket,
      currentTicketId: currentEmployee.currentTicketId
    });

    // CRITICAL: Only check for current ticket, not for waiting tickets
    if (currentTicket) {
      console.log('🚫 TOGGLE PAUSE: Blocked due to current ticket');
      alert('No puedes pausar mientras tienes un ticket en atención. Finaliza el ticket primero.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const newPauseState = !currentEmployee.isPaused;
      // CRITICAL FIX: When resuming (unpausing), employee becomes ACTIVE
      // When pausing, employee becomes INACTIVE for proper queue management
      const newActiveState = !newPauseState; // Active when not paused, inactive when paused
      
      console.log(`🔄 TOGGLE PAUSE: Changing employee state`, {
        from: { isPaused: currentEmployee.isPaused, isActive: currentEmployee.isActive },
        to: { isPaused: newPauseState, isActive: newActiveState },
        action: newPauseState ? 'PAUSING (DEACTIVATING)' : 'RESUMING (ACTIVATING)',
        employeeId
      });
      
      // CRITICAL FIX: Create a COMPLETE update object with ALL required fields including isActive
      const completeUpdateData = {
        name: currentEmployee.name,
        position: currentEmployee.position,
        isActive: newActiveState, // CRITICAL: Update isActive based on pause state
        currentTicketId: currentEmployee.currentTicketId || undefined,
        totalTicketsServed: currentEmployee.totalTicketsServed || 0,
        totalTicketsCancelled: currentEmployee.totalTicketsCancelled || 0,
        isPaused: newPauseState, // CRITICAL: The main field we're updating
        userId: currentEmployee.userId || undefined,
        createdAt: currentEmployee.createdAt
      };

      console.log('💾 TOGGLE PAUSE: Sending COMPLETE update to Firebase:', {
        employeeId,
        updateData: completeUpdateData,
        criticalFields: {
          isPaused: `${currentEmployee.isPaused} → ${newPauseState}`,
          isActive: `${currentEmployee.isActive} → ${newActiveState}`
        }
      });

      // CRITICAL FIX: Direct Firebase update with error handling
      await employeeService.updateEmployee(employeeId, completeUpdateData);

      console.log(`✅ TOGGLE PAUSE: Firebase update completed successfully`);
      console.log(`🎯 TOGGLE PAUSE: Employee state changed - isPaused: ${currentEmployee.isPaused} → ${newPauseState}, isActive: ${currentEmployee.isActive} → ${newActiveState}`);

      // CRITICAL FIX: If resuming (unpausing), employee becomes ACTIVE immediately
      if (currentEmployee.isPaused && !newPauseState) {
        console.log('🎯 RESUME: Employee resuming and becoming ACTIVE immediately');
        
        // IMPORTANT: Employee is now ACTIVE and ready to receive tickets
        // Try to auto-assign if there are tickets available
        setTimeout(async () => {
          try {
            console.log('🤖 RESUME: Attempting auto-assignment...');
            const assignedTicket = await autoAssignNextTicket(employeeId);
            if (assignedTicket) {
              console.log(`✅ RESUME: Auto-assigned ticket ${assignedTicket.number} to ${currentEmployee.name}`);
            } else {
              console.log('📭 RESUME: No tickets available, but employee is now ACTIVE and ready');
            }
          } catch (error) {
            console.error('❌ RESUME ERROR: Failed to auto-assign ticket:', error);
            // Employee is still active even if auto-assignment fails
          }
        }, 1000); // Increased delay to ensure Firebase update is complete
        
      } else if (!currentEmployee.isPaused && newPauseState) {
        console.log('⏸️ PAUSE: Employee paused and deactivated successfully');
      }
      
    } catch (error) {
      console.error('❌ TOGGLE PAUSE CRITICAL ERROR:', error);
      
      // ENHANCED ERROR HANDLING: Provide specific error information
      let errorMessage = 'Error desconocido al cambiar estado de pausa';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('❌ TOGGLE PAUSE ERROR DETAILS:', {
          message: error.message,
          stack: error.stack,
          employeeId,
          currentEmployee: currentEmployee.name
        });
      }
      
      alert(`Error al cambiar estado de pausa: ${errorMessage}`);
      
      // CRITICAL: Try to reload employee data to ensure UI consistency
      try {
        console.log('🔄 TOGGLE PAUSE: Attempting to refresh employee data after error...');
        // The real-time listeners should handle this, but we log for debugging
      } catch (refreshError) {
        console.error('❌ TOGGLE PAUSE: Failed to refresh employee data:', refreshError);
      }
      
    } finally {
      setIsLoading(false);
      console.log('🔓 TOGGLE PAUSE: Loading state cleared, operation complete');
    }
  };

  // CRITICAL DEBUG: Log the function being returned with validation
  useEffect(() => {
    console.log('🔧 HOOK VALIDATION: useEmployeeTicketManagement hook state', {
      employeeId,
      currentEmployeeExists: !!currentEmployee,
      currentEmployeeName: currentEmployee?.name,
      currentEmployeeActive: currentEmployee?.isActive,
      currentEmployeePaused: currentEmployee?.isPaused,
      handleTogglePauseType: typeof handleTogglePause,
      handleTogglePauseIsFunction: typeof handleTogglePause === 'function',
      hookIsReady: !!currentEmployee && typeof handleTogglePause === 'function'
    });
  }, [employeeId, currentEmployee, handleTogglePause]);

  return {
    currentTicket,
    waitingTickets,
    handleStartService,
    handleCompleteTicket,
    handleCancelTicket,
    handleDeriveTicket,
    handleRecallTicket,
    handleTogglePause, // CRITICAL: Ensure this function is properly returned
    isLoading
  };
}