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

  // Derive ticket to another employee
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
      const targetEmployee = await employeeService.getAllEmployees().then(employees => 
        employees.find(e => e.id === toEmployeeId)
      );

      if (!targetEmployee) {
        throw new Error('Target employee not found');
      }

      // Check if target employee is available
      if (targetEmployee.currentTicketId) {
        // Employee is busy, add to their personal queue
        await ticketService.updateTicket(ticketId, {
          queueType: 'personal',
          assignedToEmployee: toEmployeeId,
          derivedFrom: fromEmployeeId,
          derivedTo: toEmployeeId,
          derivedAt: new Date(),
          derivationReason: options?.reason,
          serviceType: options?.newServiceType || undefined,
          priority: options?.priority || 'normal',
          servedBy: undefined, // Clear current assignment
          servedAt: undefined,
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

        // Update source employee
        const sourceEmployee = await employeeService.getAllEmployees().then(employees => 
          employees.find(e => e.id === fromEmployeeId)
        );
        
        if (sourceEmployee) {
          await employeeService.updateEmployee(fromEmployeeId, {
            ...sourceEmployee,
            currentTicketId: undefined,
            isPaused: true
          });
        }
      } else {
        // Employee is available, assign immediately
        await ticketService.updateTicket(ticketId, {
          status: 'being_served',
          servedBy: toEmployeeId,
          servedAt: new Date(),
          derivedFrom: fromEmployeeId,
          derivedTo: toEmployeeId,
          derivedAt: new Date(),
          derivationReason: options?.reason,
          serviceType: options?.newServiceType || undefined,
          priority: options?.priority || 'normal',
          queueType: undefined, // Clear queue type when being served
          assignedToEmployee: undefined,
        });

        // Update target employee
        await employeeService.updateEmployee(toEmployeeId, {
          ...targetEmployee,
          currentTicketId: ticketId,
          isPaused: false
        });

        // Update source employee
        const sourceEmployee = await employeeService.getAllEmployees().then(employees => 
          employees.find(e => e.id === fromEmployeeId)
        );
        
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
          toEmployeeId,
          derivationType: 'to_employee',
          reason: options?.reason,
          comment: options?.comment,
          newServiceType: options?.newServiceType,
        });
      }
    } catch (error) {
      console.error('Error deriving ticket to employee:', error);
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
      const sourceEmployee = await employeeService.getAllEmployees().then(employees => 
        employees.find(e => e.id === fromEmployeeId)
      );
      
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
    } catch (error) {
      console.error('Error deriving ticket to general queue:', error);
      throw error;
    }
  },

  // Auto-assign next ticket when employee finishes current one
  async autoAssignNextTicket(employeeId: string): Promise<Ticket | null> {
    try {
      const nextTicket = await this.getNextTicketForEmployee(employeeId);
      
      if (nextTicket) {
        const employee = await employeeService.getAllEmployees().then(employees => 
          employees.find(e => e.id === employeeId)
        );

        if (employee && !employee.isPaused) {
          // Calculate wait time
          const waitTime = Math.floor((new Date().getTime() - nextTicket.createdAt.getTime()) / 1000);
          
          // Assign ticket to employee
          await ticketService.updateTicket(nextTicket.id, {
            status: 'being_served',
            servedBy: employeeId,
            servedAt: new Date(),
            waitTime,
            queueType: undefined, // Clear queue type when being served
            assignedToEmployee: undefined,
          });

          // Update employee
          await employeeService.updateEmployee(employeeId, {
            ...employee,
            currentTicketId: nextTicket.id,
            isPaused: false
          });

          return nextTicket;
        }
      }

      return null;
    } catch (error) {
      console.error('Error auto-assigning next ticket:', error);
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