import type { Employee, Ticket } from '../types';
import { employeeService } from './employeeService';
import { ticketService } from './ticketService';
import { ticketQueueService } from './ticketQueueService';

export interface DerivationOptions {
  reason?: string;
  comment?: string;
  newServiceType?: string;
  priority?: 'normal' | 'high' | 'urgent';
}

export const validationService = {
  // Validate if a ticket can be derived
  async validateDerivation(ticketId: string, targetEmployeeId: string): Promise<void> {
    // Get employee data
    const employees = await employeeService.getAllEmployees();
    const employee = employees.find(e => e.id === targetEmployeeId);
    
    if (!employee) {
      throw new Error('Empleado no encontrado');
    }
    
    if (!employee.isActive) {
      throw new Error('El empleado no está activo');
    }
    
    // Get personal queue for the employee
    const personalQueue = await ticketQueueService.getPersonalQueue(targetEmployeeId);
    const maxQueueSize = employee.maxPersonalQueueSize || 10;
    
    if (personalQueue.length >= maxQueueSize) {
      throw new Error(`La cola personal del empleado está llena (máximo ${maxQueueSize} tickets)`);
    }
    
    // Validate ticket exists and is in correct state
    const tickets = await ticketService.getAllTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }
    
    if (ticket.status !== 'being_served') {
      throw new Error('Solo se pueden derivar tickets que están siendo atendidos');
    }
  },

  // Validate derivation to general queue
  async validateDerivationToQueue(ticketId: string): Promise<void> {
    const tickets = await ticketService.getAllTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }
    
    if (ticket.status !== 'being_served') {
      throw new Error('Solo se pueden derivar tickets que están siendo atendidos');
    }
  }
};