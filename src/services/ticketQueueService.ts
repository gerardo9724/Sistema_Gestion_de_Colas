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

  // FIXED: Derive ticket to another employee with proper assignment
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
      console.log('🔄 DERIVATION: Starting ticket derivation process', {
        ticketId,
        fromEmployeeId,
        toEmployeeId,
        options
      });

      // Get all employees to validate IDs
      const allEmployees = await employeeService.getAllEmployees();
      const targetEmployee = allEmployees.find(e => e.id === toEmployeeId);
      const sourceEmployee = allEmployees.find(e => e.id === fromEmployeeId);

      if (!targetEmployee) {
        throw new Error('Target employee not found');
      }

      if (!sourceEmployee) {
        throw new Error('Source employee not found');
      }

      console.log('👥 DERIVATION: Employee validation successful', {
        targetEmployee: { id: targetEmployee.id, name: targetEmployee.name, busy: !!targetEmployee.currentTicketId },
        sourceEmployee: { id: sourceEmployee.id, name: sourceEmployee.name }
      });

      // CRITICAL FIX: Always clear the source employee's current ticket first
      await employeeService.updateEmployee(fromEmployeeId, {
        ...sourceEmployee,
        currentTicketId: undefined,
        isPaused: true
      });

      console.log('✅ DERIVATION: Source employee cleared successfully');

      // Check if target employee is available for immediate assignment
      if (!targetEmployee.currentTicketId && !targetEmployee.isPaused) {
        console.log('🎯 DERIVATION: Target employee available - IMMEDIATE ASSIGNMENT');
        
        // IMMEDIATE ASSIGNMENT: Employee is free, assign directly
        const now = new Date();
        
        await ticketService.updateTicket(ticketId, {
          status: 'being_served', // CRITICAL: Set to being_served immediately
          servedBy: toEmployeeId, // CRITICAL: Assign to target employee
          servedAt: now, // CRITICAL: Set served time for audio announcement
          derivedFrom: fromEmployeeId,
          derivedTo: toEmployeeId,
          derivedAt: now,
          derivationReason: options?.reason,
          serviceType: options?.newServiceType || undefined,
          priority: options?.priority || 'normal',
          queueType: undefined, // Clear queue type when being served
          assignedToEmployee: undefined, // Clear assignment when being served
        });

        // Update target employee to show they're now serving this ticket
        await employeeService.updateEmployee(toEmployeeId, {
          ...targetEmployee,
          currentTicketId: ticketId,
          isPaused: false
        });

        console.log('✅ DERIVATION: Immediate assignment completed successfully');

      } else {
        console.log('⏳ DERIVATION: Target employee busy - PERSONAL QUEUE ASSIGNMENT');
        
        // PERSONAL QUEUE ASSIGNMENT: Employee is busy, add to their personal queue
        await ticketService.updateTicket(ticketId, {
          status: 'waiting', // Keep as waiting
          servedBy: undefined, // Clear current assignment
          servedAt: undefined, // Clear served time
          queueType: 'personal', // CRITICAL: Set to personal queue
          assignedToEmployee: toEmployeeId, // CRITICAL: Assign to target employee's personal queue
          derivedFrom: fromEmployeeId,
          derivedTo: toEmployeeId,
          derivedAt: new Date(),
          derivationReason: options?.reason,
          serviceType: options?.newServiceType || undefined,
          priority: options?.priority || 'high', // Higher priority for derived tickets
        });

        console.log('✅ DERIVATION: Personal queue assignment completed successfully');
      }

      // Create derivation record for tracking
      await ticketDerivationService.createDerivation({
        ticketId,
        fromEmployeeId,
        toEmployeeId,
        derivationType: 'to_employee',
        reason: options?.reason,
        comment: options?.comment,
        newServiceType: options?.newServiceType,
      });

      console.log('📝 DERIVATION: Derivation record created successfully');
      console.log('🎉 DERIVATION: Complete derivation process finished successfully');

    } catch (error) {
      console.error('❌ DERIVATION ERROR:', error);
      throw error;
    }
  },

  // FIXED: Derive ticket back to general queue with proper cleanup
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
      console.log('🔄 QUEUE DERIVATION: Starting ticket derivation to general queue', {
        ticketId,
        fromEmployeeId,
        options
      });

      // Get source employee
      const allEmployees = await employeeService.getAllEmployees();
      const sourceEmployee = allEmployees.find(e => e.id === fromEmployeeId);
      
      if (!sourceEmployee) {
        throw new Error('Source employee not found');
      }

      // CRITICAL FIX: Return ticket to general queue with proper status
      await ticketService.updateTicket(ticketId, {
        status: 'waiting', // CRITICAL: Set back to waiting
        servedBy: undefined, // CRITICAL: Clear employee assignment
        servedAt: undefined, // CRITICAL: Clear served time
        derivedFrom: fromEmployeeId,
        derivedAt: new Date(),
        derivationReason: options?.reason,
        serviceType: options?.newServiceType || undefined,
        priority: options?.priority || 'normal',
        queueType: 'general', // CRITICAL: Set to general queue
        assignedToEmployee: undefined, // CRITICAL: Clear personal assignment
      });

      // Update source employee to clear current ticket
      await employeeService.updateEmployee(fromEmployeeId, {
        ...sourceEmployee,
        currentTicketId: undefined,
        isPaused: true
      });

      // Create derivation record
      await ticketDerivationService.createDerivation({
        ticketId,
        fromEmployeeId,
        derivationType: 'to_general_queue',
        reason: options?.reason,
        comment: options?.comment,
        newServiceType: options?.newServiceType,
      });

      console.log('✅ QUEUE DERIVATION: Ticket returned to general queue successfully');

    } catch (error) {
      console.error('❌ QUEUE DERIVATION ERROR:', error);
      throw error;
    }
  },

  // FIXED: Auto-assign next ticket with proper validation
  async autoAssignNextTicket(employeeId: string): Promise<Ticket | null> {
    try {
      console.log('🤖 AUTO-ASSIGN: Starting auto-assignment for employee', employeeId);

      const nextTicket = await this.getNextTicketForEmployee(employeeId);
      
      if (!nextTicket) {
        console.log('📭 AUTO-ASSIGN: No tickets available for assignment');
        return null;
      }

      const allEmployees = await employeeService.getAllEmployees();
      const employee = allEmployees.find(e => e.id === employeeId);

      if (!employee) {
        console.log('❌ AUTO-ASSIGN: Employee not found');
        return null;
      }

      if (employee.isPaused) {
        console.log('⏸️ AUTO-ASSIGN: Employee is paused, skipping auto-assignment');
        return null;
      }

      if (employee.currentTicketId) {
        console.log('🚫 AUTO-ASSIGN: Employee already has a ticket assigned');
        return null;
      }

      console.log('🎯 AUTO-ASSIGN: Assigning ticket to employee', {
        ticketId: nextTicket.id,
        ticketNumber: nextTicket.number,
        employeeName: employee.name
      });

      // Calculate wait time
      const waitTime = Math.floor((new Date().getTime() - nextTicket.createdAt.getTime()) / 1000);
      const now = new Date();
      
      // CRITICAL FIX: Assign ticket properly with all required fields
      await ticketService.updateTicket(nextTicket.id, {
        status: 'being_served', // CRITICAL: Set to being_served
        servedBy: employeeId, // CRITICAL: Assign to employee
        servedAt: now, // CRITICAL: Set served time for audio announcement
        waitTime,
        queueType: undefined, // Clear queue type when being served
        assignedToEmployee: undefined, // Clear personal assignment when being served
      });

      // Update employee with current ticket
      await employeeService.updateEmployee(employeeId, {
        ...employee,
        currentTicketId: nextTicket.id,
        isPaused: false
      });

      console.log('✅ AUTO-ASSIGN: Ticket assigned successfully');
      return nextTicket;

    } catch (error) {
      console.error('❌ AUTO-ASSIGN ERROR:', error);
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