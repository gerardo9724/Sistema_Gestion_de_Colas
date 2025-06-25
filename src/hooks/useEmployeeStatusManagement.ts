import { useState, useCallback } from 'react';
import { employeeService } from '../services/employeeService';
import { ticketQueueService } from '../services/ticketQueueService';
import type { Employee } from '../types';

export function useEmployeeStatusManagement(employee: Employee | null) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleEmployeeStatus = useCallback(async () => {
    if (!employee) {
      throw new Error('No hay información del empleado disponible');
    }

    console.log('🔄 EMPLOYEE STATUS: Starting status toggle', {
      employeeId: employee.id,
      employeeName: employee.name,
      currentIsActive: employee.isActive,
      currentIsPaused: employee.isPaused,
      hasCurrentTicket: !!employee.currentTicketId
    });

    // Validate employee can change status
    if (employee.currentTicketId) {
      throw new Error('No puedes cambiar tu estado mientras tienes un ticket en atención');
    }

    setIsLoading(true);

    try {
      // CRITICAL: Implement proper isActive/isPaused logic
      // If employee is currently active, make them inactive/paused
      // If employee is currently inactive, make them active/not paused
      const newIsActive = !employee.isActive;
      const newIsPaused = !newIsActive; // Always opposite of isActive

      console.log('🎯 EMPLOYEE STATUS: State transition', {
        from: { isActive: employee.isActive, isPaused: employee.isPaused },
        to: { isActive: newIsActive, isPaused: newIsPaused },
        action: newIsActive ? 'ACTIVATING' : 'DEACTIVATING'
      });

      // CRITICAL: Update employee status in database
      const updateData = {
        isActive: newIsActive,
        isPaused: newIsPaused,
        updatedAt: new Date()
      };

      console.log('💾 EMPLOYEE STATUS: Updating database', {
        employeeId: employee.id,
        updateData
      });

      await employeeService.updateEmployee(employee.id, updateData);

      console.log('✅ EMPLOYEE STATUS: Database updated successfully');

      // CRITICAL: Handle post-update logic
      if (newIsActive) {
        console.log('🎯 EMPLOYEE STATUS: Employee activated - attempting auto-assignment');
        
        // Try to auto-assign a ticket after a short delay
        setTimeout(async () => {
          try {
            const assignedTicket = await ticketQueueService.autoAssignNextTicket(employee.id);
            if (assignedTicket) {
              console.log(`✅ EMPLOYEE STATUS: Auto-assigned ticket ${assignedTicket.number} to ${employee.name}`);
            } else {
              console.log('📭 EMPLOYEE STATUS: No tickets available for auto-assignment');
            }
          } catch (error) {
            console.error('❌ EMPLOYEE STATUS: Auto-assignment error:', error);
          }
        }, 1000);
      } else {
        console.log('⏸️ EMPLOYEE STATUS: Employee deactivated/paused');
      }

    } catch (error) {
      console.error('❌ EMPLOYEE STATUS ERROR:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [employee]);

  return {
    isLoading,
    handleToggleEmployeeStatus
  };
}