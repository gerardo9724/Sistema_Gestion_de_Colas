import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { TicketDerivation, Ticket, Employee } from '../types';

export interface AuditLog {
  id?: string;
  action: string;
  ticketId: string;
  fromEmployee?: string;
  toEmployee?: string;
  timestamp: Date;
  details: any;
  userId?: string;
  ipAddress?: string;
}

export const auditService = {
  // Log ticket derivation
  async logDerivation(
    derivation: TicketDerivation, 
    ticket: Ticket, 
    fromEmployee: Employee, 
    toEmployee?: Employee
  ): Promise<void> {
    try {
      const logData = {
        action: 'ticket_derived',
        ticketId: derivation.ticketId,
        fromEmployee: fromEmployee.name,
        toEmployee: toEmployee?.name || 'Cola General',
        timestamp: Timestamp.fromDate(new Date()),
        details: {
          ticketNumber: ticket.number,
          derivationType: derivation.derivationType,
          reason: derivation.reason,
          comment: derivation.comment,
          newServiceType: derivation.newServiceType,
          priority: ticket.priority,
          originalServiceType: ticket.serviceType
        },
        userId: null, // Could be set if we have user context
        ipAddress: null // Could be captured if needed
      };

      await addDoc(collection(db, 'auditLogs'), logData);
      console.log('✅ Derivation logged successfully:', logData);
    } catch (error) {
      console.error('❌ Error logging derivation:', error);
      // Don't throw error to avoid breaking the derivation process
    }
  },

  // Log ticket completion
  async logTicketCompletion(ticket: Ticket, employee: Employee): Promise<void> {
    try {
      const logData = {
        action: 'ticket_completed',
        ticketId: ticket.id,
        employeeName: employee.name,
        timestamp: Timestamp.fromDate(new Date()),
        details: {
          ticketNumber: ticket.number,
          serviceType: ticket.serviceType,
          serviceTime: ticket.serviceTime,
          totalTime: ticket.totalTime,
          wasDerived: !!ticket.derivedFrom
        }
      };

      await addDoc(collection(db, 'auditLogs'), logData);
    } catch (error) {
      console.error('Error logging ticket completion:', error);
    }
  },

  // Log employee state changes
  async logEmployeeStateChange(
    employee: Employee, 
    action: string, 
    details: any
  ): Promise<void> {
    try {
      const logData = {
        action: `employee_${action}`,
        employeeId: employee.id,
        employeeName: employee.name,
        timestamp: Timestamp.fromDate(new Date()),
        details
      };

      await addDoc(collection(db, 'auditLogs'), logData);
    } catch (error) {
      console.error('Error logging employee state change:', error);
    }
  }
};