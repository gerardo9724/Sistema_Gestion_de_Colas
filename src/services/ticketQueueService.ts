import { ticketService } from './ticketService';
import { employeeService } from './employeeService';
import { ticketDerivationService } from './ticketDerivationService';
import type { Ticket, Employee } from '../types';

export const ticketQueueService = {
  // Get tickets in general queue (waiting status, no assigned employee)
  async getGeneralQueue(): Promise<Ticket[]> {
    try {
      const allTickets = await ticketService.getAllTickets();
      return allTickets
        .filter(ticket => 
          ticket.status === 'waiting' && 
          (!ticket.queueType || ticket.queueType === 'general') &&
          !ticket.assignedToEmployee
        )
        .sort((a, b) => {
          // Sort by priority first, then by creation time
          const priorityOrder = { 'urgent': 3, 'high': 2, 'normal': 1 };
          const aPriority = priorityOrder[a.priority || 'normal'];
          const bPriority = priorityOrder[b.priority || 'normal'];
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
          }
          
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    } catch (error) {
      console.error('Error getting general queue:', error);
      return [];
    }
  },

  // Get personal queue for a specific employee
  async getPersonalQueue(employeeId: string): Promise<Ticket[]> {
    try {
      const allTickets = await ticketService.getAllTickets();
      return allTickets
        .filter(ticket => 
          ticket.status === 'waiting' && 
          ticket.queueType === 'personal' &&
          ticket.assignedToEmployee === employeeId
        )
        .sort((a, b) => {
          // Sort by priority first, then by derivation/creation time
          const priorityOrder = { 'urgent': 3, 'high': 2, 'normal': 1 };
          const aPriority = priorityOrder[a.priority || 'normal'];
          const bPriority = priorityOrder[b.priority || 'normal'];
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
          }
          
          // Use derivation time if available, otherwise creation time
          const aTime = a.derivedAt ? new Date(a.derivedAt).getTime() : new Date(a.createdAt).getTime();
          const bTime = b.derivedAt ? new Date(b.derivedAt).getTime() : new Date(b.createdAt).getTime();
          
          return aTime - bTime; // Older first
        });
    } catch (error) {
      console.error('Error getting personal queue:', error);
      return [];
    }
  },

  // Get next ticket for an employee (personal queue first, then general queue)
  async getNextTicketForEmployee(employeeId: string): Promise<Ticket | null> {
    try {
      // First check personal queue
      const personalQueue = await this.getPersonalQueue(employeeId);
      if (personalQueue.length > 0) {
        return personalQueue[0];
      }

      // Then check general queue
      const generalQueue = await this.getGeneralQueue();
      if (generalQueue.length > 0) {
        return generalQueue[0];
      }

      return null;
    } catch (error) {
      console.error('Error getting next ticket for employee:', error);
      return null;
    }
  },

  // FIXED: Derive ticket to another employee with proper assignment handling
  async deriveTicketToEmployee(
    ticketId: string, 
    fromEmployeeId: string, 
    toEmployeeId: string,
    options?: {
      reason?: string;
      comment?: string;
      newServiceType?: string;
      priority?: 'normal' | 'high' | 'urgent';
    }
  ): Promise<void> {
    try {
      console.log('🔄 STARTING TICKET DERIVATION:', {
        ticketId,
        fromEmployeeId,
        toEmployeeId,
        options
      });

      // Get all employees to find target employee
      const allEmployees = await employeeService.getAllEmployees();
      const targetEmployee = allEmployees.find(e => e.id === toEmployeeId);
      const sourceEmployee = allEmployees.find(e => e.id === fromEmployeeId);

      if (!targetEmployee) {
        throw new Error('Target employee not found');
      }

      if (!sourceEmployee) {
        throw new Error('Source employee not found');
      }

      console.log('👥 EMPLOYEES FOUND:', {
        targetEmployee: { id: targetEmployee.id, name: targetEmployee.name, busy: !!targetEmployee.currentTicketId },
        sourceEmployee: { id: sourceEmployee.id, name: sourceEmployee.name }
      });

      // CRITICAL FIX: Check if target employee is available
      if (targetEmployee.currentTicketId || targetEmployee.isPaused) {
        console.log('🔄 TARGET EMPLOYEE IS BUSY - ADDING TO PERSONAL QUEUE');
        
        // Employee is busy or paused, add to their personal queue
        await ticketService.updateTicket(ticketId, {
          status: 'waiting', // CRITICAL: Keep as waiting
          queueType: 'personal',
          assignedToEmployee: toEmployeeId,
          derivedFrom: fromEmployeeId,
          derivedTo: toEmployeeId,
          derivedAt: new Date(),
          derivationReason: options?.reason,
          serviceType: options?.newServiceType || undefined,
          priority: options?.priority || 'normal',
          // CRITICAL: Clear current serving assignment but keep derivation info
          servedBy: undefined,
          servedAt: undefined,
        });

        console.log('✅ TICKET ADDED TO PERSONAL QUEUE');
      } else {
        console.log('⚡ TARGET EMPLOYEE IS AVAILABLE - IMMEDIATE ASSIGNMENT');
        
        // Employee is available, assign immediately
        const now = new Date();
        const originalTicket = await ticketService.getAllTickets().then(tickets => 
          tickets.find(t => t.id === ticketId)
        );
        
        if (!originalTicket) {
          throw new Error('Original ticket not found');
        }

        const waitTime = Math.floor((now.getTime() - originalTicket.createdAt.getTime()) / 1000);

        await ticketService.updateTicket(ticketId, {
          status: 'being_served',
          servedBy: toEmployeeId,
          servedAt: now,
          waitTime,
          derivedFrom: fromEmployeeId,
          derivedTo: toEmployeeId,
          derivedAt: new Date(),
          derivationReason: options?.reason,
          serviceType: options?.newServiceType || undefined,
          priority: options?.priority || 'normal',
          // CRITICAL: Clear queue assignment when being served
          queueType: undefined,
          assignedToEmployee: undefined,
        });

        // Update target employee
        await employeeService.updateEmployee(toEmployeeId, {
          ...targetEmployee,
          currentTicketId: ticketId,
          isPaused: false
        });

        console.log('✅ TICKET ASSIGNED IMMEDIATELY TO TARGET EMPLOYEE');
      }

      // ALWAYS update source employee (clear current ticket and pause)
      await employeeService.updateEmployee(fromEmployeeId, {
        ...sourceEmployee,
        currentTicketId: undefined,
        isPaused: true
      });

      // Create derivation record
      await ticketDerivationService.createDerivation({
        ticketId,
        fromEmployeeId,
        toEmployeeId,
        derivationType: 'to_employee',
        reason: options?.reason,
        comment: options?.comment,
        newServiceType: options?.newServiceType,
      });

      console.log('✅ DERIVATION COMPLETED SUCCESSFULLY');
    } catch (error) {
      console.error('❌ ERROR IN TICKET DERIVATION:', error);
      throw error;
    }
  },

  // Derive ticket back to general queue
  async deriveTicketToGeneralQueue(
    ticketId: string, 
    fromEmployeeId: string,
    options?: {
      reason?: string;
      comment?: string;
      newServiceType?: string;
      priority?: 'normal' | 'high' | 'urgent';
    }
  ): Promise<void> {
    try {
      console.log('🔄 DERIVING TICKET TO GENERAL QUEUE:', { ticketId, fromEmployeeId });

      // Return ticket to general queue
      await ticketService.updateTicket(ticketId, {
        status: 'waiting',
        servedBy: undefined,
        servedAt: undefined,
        derivedFrom: fromEmployeeId,
        derivedAt: new Date(),
        derivationReason: options?.reason,
        serviceType: options?.newServiceType || undefined,
        priority: options?.priority || 'normal',
        queueType: 'general',
        assignedToEmployee: undefined,
      });

      // Update source employee
      const allEmployees = await employeeService.getAllEmployees();
      const sourceEmployee = allEmployees.find(e => e.id === fromEmployeeId);
      
      if (sourceEmployee) {
        await employeeService.updateEmployee(fromEmployeeId, {
          ...sourceEmployee,
          currentTicketId: undefined,
          isPaused: true
        });
      }

      // Create derivation record
      await ticketDerivationService.createDerivation({
        ticketId,
        fromEmployeeId,
        derivationType: 'to_general_queue',
        reason: options?.reason,
        comment: options?.comment,
        newServiceType: options?.newServiceType,
      });

      console.log('✅ TICKET RETURNED TO GENERAL QUEUE');
    } catch (error) {
      console.error('❌ ERROR DERIVING TO GENERAL QUEUE:', error);
      throw error;
    }
  },

  // ENHANCED: Auto-assign next ticket when employee finishes current one
  async autoAssignNextTicket(employeeId: string): Promise<Ticket | null> {
    try {
      console.log('🔄 AUTO-ASSIGNING NEXT TICKET FOR EMPLOYEE:', employeeId);

      const nextTicket = await this.getNextTicketForEmployee(employeeId);
      
      if (nextTicket) {
        const allEmployees = await employeeService.getAllEmployees();
        const employee = allEmployees.find(e => e.id === employeeId);

        if (employee && !employee.isPaused) {
          console.log('🎫 FOUND NEXT TICKET:', {
            ticketId: nextTicket.id,
            ticketNumber: nextTicket.number,
            queueType: nextTicket.queueType || 'general',
            assignedTo: nextTicket.assignedToEmployee
          });

          // Calculate wait time
          const waitTime = Math.floor((new Date().getTime() - nextTicket.createdAt.getTime()) / 1000);
          
          // CRITICAL: Assign ticket to employee with proper field clearing
          await ticketService.updateTicket(nextTicket.id, {
            status: 'being_served',
            servedBy: employeeId,
            servedAt: new Date(),
            waitTime,
            // CRITICAL: Clear queue-related fields when ticket is being served
            queueType: undefined,
            assignedToEmployee: undefined,
          });

          // Update employee
          await employeeService.updateEmployee(employeeId, {
            ...employee,
            currentTicketId: nextTicket.id,
            isPaused: false
          });

          console.log('✅ NEXT TICKET AUTO-ASSIGNED SUCCESSFULLY');
          return nextTicket;
        } else {
          console.log('⏸️ EMPLOYEE IS PAUSED - NO AUTO-ASSIGNMENT');
        }
      } else {
        console.log('📭 NO TICKETS AVAILABLE FOR AUTO-ASSIGNMENT');
      }

      return null;
    } catch (error) {
      console.error('❌ ERROR IN AUTO-ASSIGNMENT:', error);
      return null;
    }
  },

  // Get queue statistics for an employee
  async getEmployeeQueueStats(employeeId: string): Promise<{
    personalQueueCount: number;
    generalQueueCount: number;
    totalWaitingCount: number;
    nextTicketType: 'personal' | 'general' | 'none';
  }> {
    try {
      const personalQueue = await this.getPersonalQueue(employeeId);
      const generalQueue = await this.getGeneralQueue();
      
      return {
        personalQueueCount: personalQueue.length,
        generalQueueCount: generalQueue.length,
        totalWaitingCount: personalQueue.length + generalQueue.length,
        nextTicketType: personalQueue.length > 0 ? 'personal' : 
                       generalQueue.length > 0 ? 'general' : 'none'
      };
    } catch (error) {
      console.error('Error getting employee queue stats:', error);
      return {
        personalQueueCount: 0,
        generalQueueCount: 0,
        totalWaitingCount: 0,
        nextTicketType: 'none'
      };
    }
  }
};