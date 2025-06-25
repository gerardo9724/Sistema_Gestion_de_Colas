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

  // NEW: Calculate employee workload score for load balancing
  async calculateEmployeeWorkload(employee: Employee): Promise<number> {
    try {
      let workloadScore = 0;

      // Factor 1: Current ticket (highest weight)
      if (employee.currentTicketId) {
        workloadScore += 100; // Employee is busy
      }

      // Factor 2: Personal queue count
      const personalQueue = await this.getPersonalQueue(employee.id);
      workloadScore += personalQueue.length * 10; // Each ticket in personal queue adds 10 points

      // Factor 3: Recent performance (tickets served today)
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // This would ideally come from a more detailed query, but for now we'll use total served
      // In a real implementation, you'd query tickets served today
      const recentPerformance = employee.totalTicketsServed;
      workloadScore += Math.floor(recentPerformance / 10); // Every 10 tickets adds 1 point

      // CRITICAL FIX: Use isActive instead of isPaused for workload calculation
      // Factor 4: Active status (primary factor)
      if (!employee.isActive) {
        workloadScore += 2000; // Inactive employees get highest score (unavailable)
      }

      // Factor 5: Pause status (secondary factor, should align with isActive)
      if (employee.isPaused) {
        workloadScore += 1000; // Paused employees get very high score (unavailable)
      }

      console.log(`📊 WORKLOAD CALCULATION for ${employee.name}:`, {
        currentTicket: employee.currentTicketId ? 100 : 0,
        personalQueueCount: personalQueue.length,
        personalQueueScore: personalQueue.length * 10,
        isActive: employee.isActive ? 0 : 2000,
        isPaused: employee.isPaused ? 1000 : 0,
        totalScore: workloadScore
      });

      return workloadScore;
    } catch (error) {
      console.error('Error calculating employee workload:', error);
      return 9999; // Return high score on error to avoid assignment
    }
  },

  // NEW: Find best available employee based on workload
  async findBestAvailableEmployee(): Promise<Employee | null> {
    try {
      const allEmployees = await employeeService.getAllEmployees();
      
      // CRITICAL FIX: Filter to only active employees (isActive: true)
      const activeEmployees = allEmployees.filter(emp => emp.isActive);
      
      if (activeEmployees.length === 0) {
        console.log('📭 AUTO-ASSIGN: No active employees available');
        return null;
      }

      // Calculate workload for each employee
      const employeeWorkloads = await Promise.all(
        activeEmployees.map(async (employee) => ({
          employee,
          workload: await this.calculateEmployeeWorkload(employee)
        }))
      );

      // Sort by workload (lowest first = least busy)
      employeeWorkloads.sort((a, b) => a.workload - b.workload);

      console.log('🎯 WORKLOAD RANKING:', employeeWorkloads.map(ew => ({
        name: ew.employee.name,
        workload: ew.workload,
        available: ew.workload < 100 // Less than 100 means available
      })));

      // Find the employee with the lowest workload who is actually available
      const bestEmployee = employeeWorkloads.find(ew => ew.workload < 100); // Less than 100 means available

      if (bestEmployee) {
        console.log(`✅ BEST EMPLOYEE FOUND: ${bestEmployee.employee.name} (workload: ${bestEmployee.workload})`);
        return bestEmployee.employee;
      }

      console.log('⏳ AUTO-ASSIGN: All employees are busy, no immediate assignment possible');
      return null;
    } catch (error) {
      console.error('Error finding best available employee:', error);
      return null;
    }
  },

  // CRITICAL FIX: Enhanced auto-assign for new tickets with proper validation
  async autoAssignNewTicket(ticketId: string): Promise<boolean> {
    try {
      console.log('🚀 AUTO-ASSIGN NEW TICKET: Starting workload-based assignment for ticket', ticketId);

      // Get the ticket first to validate it exists and is eligible
      const allTickets = await ticketService.getAllTickets();
      const ticket = allTickets.find(t => t.id === ticketId);
      
      if (!ticket) {
        console.log('❌ AUTO-ASSIGN: Ticket not found');
        return false;
      }

      // CRITICAL: Only assign tickets that are waiting and in general queue
      if (ticket.status !== 'waiting') {
        console.log('📋 AUTO-ASSIGN: Ticket is not in waiting status, skipping assignment');
        return false;
      }

      if (ticket.queueType === 'personal' && ticket.assignedToEmployee) {
        console.log('👤 AUTO-ASSIGN: Ticket is in personal queue, skipping general assignment');
        return false;
      }

      // Find the best available employee
      const bestEmployee = await this.findBestAvailableEmployee();
      
      if (!bestEmployee) {
        console.log('📭 AUTO-ASSIGN: No employees available for immediate assignment');
        return false;
      }

      console.log(`🎯 AUTO-ASSIGN: Assigning ticket ${ticket.number} to ${bestEmployee.name}`);

      // Calculate wait time
      const waitTime = Math.floor((new Date().getTime() - ticket.createdAt.getTime()) / 1000);
      const now = new Date();
      
      // CRITICAL FIX: Assign ticket to the best employee with proper audio trigger
      await ticketService.updateTicket(ticketId, {
        status: 'being_served',
        servedBy: bestEmployee.id,
        servedAt: now, // CRITICAL: This triggers the audio announcement
        waitTime,
        queueType: undefined,
        assignedToEmployee: undefined,
      });

      // CRITICAL FIX: Update employee with current ticket and ensure proper isActive/isPaused state
      await employeeService.updateEmployee(bestEmployee.id, {
        currentTicketId: ticketId,
        isActive: true,    // CRITICAL: Employee becomes active when serving
        isPaused: false    // CRITICAL: Employee is not paused when serving
      });

      console.log(`✅ AUTO-ASSIGN: Ticket ${ticket.number} successfully assigned to ${bestEmployee.name}`);
      return true;

    } catch (error) {
      console.error('❌ AUTO-ASSIGN ERROR:', error);
      return false;
    }
  },

  // CRITICAL FIX: Derive ticket to another employee with IMMEDIATE source employee liberation
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

      // CRITICAL FIX: IMMEDIATELY clear the source employee's current ticket and set to inactive/paused
      await employeeService.updateEmployee(fromEmployeeId, {
        currentTicketId: undefined, // CRITICAL: Clear current ticket immediately
        isActive: false,            // CRITICAL: Set to inactive
        isPaused: true              // CRITICAL: Set to paused
      });

      console.log('✅ DERIVATION: Source employee IMMEDIATELY cleared and set to inactive/paused');

      // Check if target employee is available for immediate assignment
      if (!targetEmployee.currentTicketId && targetEmployee.isActive) {
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

        // CRITICAL FIX: Update target employee to show they're now serving this ticket
        await employeeService.updateEmployee(toEmployeeId, {
          currentTicketId: ticketId,
          isActive: true,    // CRITICAL: Employee becomes active when serving
          isPaused: false    // CRITICAL: Employee is not paused when serving
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
      
      // CRITICAL SUCCESS: Source employee is now FREE to continue with other tickets
      console.log('🎉 DERIVATION COMPLETE: Source employee set to inactive/paused state');

    } catch (error) {
      console.error('❌ DERIVATION ERROR:', error);
      throw error;
    }
  },

  // CRITICAL FIX: Derive ticket back to general queue with IMMEDIATE source employee liberation
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

      // CRITICAL FIX: IMMEDIATELY clear source employee and set to inactive/paused
      await employeeService.updateEmployee(fromEmployeeId, {
        currentTicketId: undefined, // CRITICAL: Clear current ticket immediately
        isActive: false,            // CRITICAL: Set to inactive
        isPaused: true              // CRITICAL: Set to paused
      });

      console.log('✅ QUEUE DERIVATION: Source employee IMMEDIATELY cleared and set to inactive/paused');

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
      console.log('🎉 QUEUE DERIVATION COMPLETE: Source employee set to inactive/paused state');

    } catch (error) {
      console.error('❌ QUEUE DERIVATION ERROR:', error);
      throw error;
    }
  },

  // ENHANCED: Auto-assign next ticket with improved validation and logging
  async autoAssignNextTicket(employeeId: string): Promise<Ticket | null> {
    try {
      console.log('🤖 AUTO-ASSIGN: Starting auto-assignment for employee', employeeId);

      // Get fresh employee data to ensure we have the latest state
      const allEmployees = await employeeService.getAllEmployees();
      const employee = allEmployees.find(e => e.id === employeeId);

      if (!employee) {
        console.log('❌ AUTO-ASSIGN: Employee not found');
        return null;
      }

      // CRITICAL FIX: Check all conditions before proceeding using isActive
      if (!employee.isActive) {
        console.log('⏸️ AUTO-ASSIGN: Employee is inactive, skipping auto-assignment');
        return null;
      }

      if (employee.currentTicketId) {
        console.log('🚫 AUTO-ASSIGN: Employee already has a ticket assigned');
        return null;
      }

      // Get next available ticket
      const nextTicket = await this.getNextTicketForEmployee(employeeId);
      
      if (!nextTicket) {
        console.log('📭 AUTO-ASSIGN: No tickets available for assignment');
        return null;
      }

      console.log('🎯 AUTO-ASSIGN: Assigning ticket to employee', {
        ticketId: nextTicket.id,
        ticketNumber: nextTicket.number,
        employeeName: employee.name,
        ticketType: nextTicket.queueType || 'general'
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

      // CRITICAL FIX: Update employee with current ticket and proper isActive/isPaused state
      await employeeService.updateEmployee(employeeId, {
        currentTicketId: nextTicket.id,
        isActive: true,    // CRITICAL: Ensure employee is active when serving
        isPaused: false    // CRITICAL: Ensure employee is not paused when serving
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