import { validationService, type DerivationOptions } from './validationService';
import { stateManager } from './stateManager';
import { notificationService } from './notificationService';
import { auditService } from './auditService';
import { ticketService } from './ticketService';
import { employeeService } from './employeeService';
import { ticketDerivationService } from './ticketDerivationService';
import { ticketQueueService } from './ticketQueueService';
import type { Ticket, Employee } from '../types';

export const derivationWorkflowService = {
  // Complete derivation workflow
  async deriveTicketComplete(
    ticketId: string,
    fromEmployeeId: string,
    toEmployeeId: string,
    options: DerivationOptions = {}
  ): Promise<void> {
    try {
      console.log('🎯 Starting complete derivation workflow:', {
        ticketId,
        fromEmployeeId,
        toEmployeeId,
        options
      });

      // 1. Validate derivation
      await validationService.validateDerivation(ticketId, toEmployeeId);
      console.log('✅ Validation passed');

      // 2. Obtain data
      const [tickets, employees] = await Promise.all([
        ticketService.getAllTickets(),
        employeeService.getAllEmployees()
      ]);

      const ticket = tickets.find(t => t.id === ticketId);
      const targetEmployee = employees.find(e => e.id === toEmployeeId);
      const sourceEmployee = employees.find(e => e.id === fromEmployeeId);

      if (!ticket || !targetEmployee || !sourceEmployee) {
        throw new Error('Datos requeridos no encontrados');
      }

      console.log('📊 Data obtained:', {
        ticket: ticket.number,
        targetEmployee: targetEmployee.name,
        sourceEmployee: sourceEmployee.name,
        targetHasCurrentTicket: !!targetEmployee.currentTicketId
      });

      // 3. Determine assignment type
      if (targetEmployee.currentTicketId) {
        // Target employee is busy - add to personal queue
        await this._assignToPersonalQueue(ticket, targetEmployee, sourceEmployee, options);
        console.log('📋 Assigned to personal queue');
      } else {
        // Target employee is available - immediate assignment
        await this._assignImmediately(ticket, targetEmployee, sourceEmployee, options);
        console.log('⚡ Assigned immediately');
      }

      // 4. Register derivation
      const derivation = await ticketDerivationService.createDerivation({
        ticketId,
        fromEmployeeId,
        toEmployeeId,
        derivationType: 'to_employee',
        reason: options.reason,
        comment: options.comment,
        newServiceType: options.newServiceType,
      });
      console.log('📝 Derivation record created');

      // 5. Update source employee
      await stateManager.updateSourceEmployee(fromEmployeeId);
      console.log('👤 Source employee updated');

      // 6. Notify and audit
      notificationService.showDerivationNotification(derivation, ticket, targetEmployee);
      await auditService.logDerivation(derivation, ticket, sourceEmployee, targetEmployee);
      console.log('🔔 Notifications and audit completed');

      console.log('✅ Complete derivation workflow finished successfully');

    } catch (error) {
      console.error('❌ Error in complete derivation workflow:', error);
      notificationService.showErrorNotification(
        error instanceof Error ? error.message : 'Error desconocido en la derivación'
      );
      throw error;
    }
  },

  // Derive ticket to general queue
  async deriveTicketToGeneralQueue(
    ticketId: string,
    fromEmployeeId: string,
    options: DerivationOptions = {}
  ): Promise<void> {
    try {
      console.log('🎯 Starting derivation to general queue:', {
        ticketId,
        fromEmployeeId,
        options
      });

      // 1. Validate derivation
      await validationService.validateDerivationToQueue(ticketId);

      // 2. Use existing queue service
      await ticketQueueService.deriveTicketToGeneralQueue(ticketId, fromEmployeeId, {
        reason: options.reason,
        comment: options.comment,
        newServiceType: options.newServiceType,
        priority: options.priority
      });

      // 3. Get data for notifications and audit
      const [tickets, employees] = await Promise.all([
        ticketService.getAllTickets(),
        employeeService.getAllEmployees()
      ]);

      const ticket = tickets.find(t => t.id === ticketId);
      const sourceEmployee = employees.find(e => e.id === fromEmployeeId);

      if (ticket && sourceEmployee) {
        // 4. Create derivation record
        const derivation = await ticketDerivationService.createDerivation({
          ticketId,
          fromEmployeeId,
          derivationType: 'to_general_queue',
          reason: options.reason,
          comment: options.comment,
          newServiceType: options.newServiceType,
        });

        // 5. Notify and audit
        notificationService.showDerivationNotification(derivation, ticket);
        await auditService.logDerivation(derivation, ticket, sourceEmployee);
      }

      console.log('✅ Derivation to general queue completed successfully');

    } catch (error) {
      console.error('❌ Error in derivation to general queue:', error);
      notificationService.showErrorNotification(
        error instanceof Error ? error.message : 'Error desconocido en la derivación'
      );
      throw error;
    }
  },

  // Assign ticket to personal queue (internal method)
  async _assignToPersonalQueue(
    ticket: Ticket,
    targetEmployee: Employee,
    sourceEmployee: Employee,
    options: DerivationOptions
  ): Promise<void> {
    // Update ticket state for personal queue
    await ticketService.updateTicket(ticket.id, {
      status: 'waiting',
      queueType: 'personal',
      assignedToEmployee: targetEmployee.id,
      derivedFrom: sourceEmployee.id,
      derivedTo: targetEmployee.id,
      derivedAt: new Date(),
      derivationReason: options.reason,
      serviceType: options.newServiceType || ticket.serviceType,
      priority: options.priority || ticket.priority || 'normal',
      servedBy: undefined, // Clear current assignment
      servedAt: undefined,
    });

    console.log(`📋 Ticket ${ticket.number} added to ${targetEmployee.name}'s personal queue`);
  },

  // Assign ticket immediately (internal method)
  async _assignImmediately(
    ticket: Ticket,
    targetEmployee: Employee,
    sourceEmployee: Employee,
    options: DerivationOptions
  ): Promise<void> {
    // Update ticket for immediate assignment
    await ticketService.updateTicket(ticket.id, {
      status: 'being_served',
      servedBy: targetEmployee.id,
      servedAt: new Date(),
      derivedFrom: sourceEmployee.id,
      derivedTo: targetEmployee.id,
      derivedAt: new Date(),
      derivationReason: options.reason,
      serviceType: options.newServiceType || ticket.serviceType,
      priority: options.priority || ticket.priority || 'normal',
      queueType: undefined, // Clear queue type when being served
      assignedToEmployee: undefined,
    });

    // Update target employee
    await stateManager.updateTargetEmployee(targetEmployee.id, ticket.id);

    console.log(`⚡ Ticket ${ticket.number} assigned immediately to ${targetEmployee.name}`);
  }
};