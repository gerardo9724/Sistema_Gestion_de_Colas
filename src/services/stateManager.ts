import { ticketService } from './ticketService';
import { employeeService } from './employeeService';
import type { Ticket, Employee } from '../types';

export interface DerivationData {
  fromEmployeeId: string;
  toEmployeeId?: string;
  reason?: string;
  comment?: string;
  priority?: 'normal' | 'high' | 'urgent';
  newServiceType?: string;
}

export const stateManager = {
  // Update ticket state for derivation
  async updateTicketState(ticket: Ticket, derivation: DerivationData): Promise<void> {
    const updates: Partial<Ticket> = {
      derivedFrom: derivation.fromEmployeeId,
      derivedTo: derivation.toEmployeeId,
      derivedAt: new Date(),
      derivationReason: derivation.reason,
      priority: derivation.priority || ticket.priority || 'normal'
    };

    // Handle service type change
    if (derivation.newServiceType && derivation.newServiceType !== ticket.serviceType) {
      updates.serviceType = derivation.newServiceType;
    }

    // Clean undefined fields for Firestore
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof typeof updates] === undefined) {
        (updates as any)[key] = null;
      }
    });

    await ticketService.updateTicket(ticket.id, updates);
  },

  // Update employee state after derivation
  async updateSourceEmployee(employeeId: string): Promise<void> {
    const employees = await employeeService.getAllEmployees();
    const employee = employees.find(e => e.id === employeeId);
    
    if (employee) {
      await employeeService.updateEmployee(employeeId, {
        ...employee,
        currentTicketId: undefined,
        isPaused: true // Pause employee after derivation
      });
    }
  },

  // Update target employee state
  async updateTargetEmployee(employeeId: string, ticketId?: string): Promise<void> {
    const employees = await employeeService.getAllEmployees();
    const employee = employees.find(e => e.id === employeeId);
    
    if (employee) {
      await employeeService.updateEmployee(employeeId, {
        ...employee,
        currentTicketId: ticketId,
        isPaused: false
      });
    }
  }
};