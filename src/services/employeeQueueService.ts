import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { ticketService } from './ticketService';
import { employeeService } from './employeeService';
import type { Ticket, Employee, EmployeeQueueInfo } from '../types';

// Utility function to convert Firestore timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  if (timestamp && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp || Date.now());
};

export const employeeQueueService = {
  // Get employee's personal queue
  async getEmployeePersonalQueue(employeeId: string): Promise<Ticket[]> {
    try {
      const q = query(
        collection(db, 'tickets'),
        where('queuedForEmployee', '==', employeeId),
        where('status', '==', 'queued_for_employee'),
        orderBy('queuedAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          number: data.number,
          serviceType: data.serviceType || '',
          serviceSubtype: data.serviceSubtype || undefined,
          status: data.status,
          queuePosition: data.queuePosition,
          createdAt: timestampToDate(data.createdAt),
          servedAt: data.servedAt ? timestampToDate(data.servedAt) : undefined,
          completedAt: data.completedAt ? timestampToDate(data.completedAt) : undefined,
          cancelledAt: data.cancelledAt ? timestampToDate(data.cancelledAt) : undefined,
          servedBy: data.servedBy || undefined,
          cancelledBy: data.cancelledBy || undefined,
          waitTime: data.waitTime || undefined,
          serviceTime: data.serviceTime || undefined,
          totalTime: data.totalTime || undefined,
          cancellationReason: data.cancellationReason || undefined,
          cancellationComment: data.cancellationComment || undefined,
          queuedForEmployee: data.queuedForEmployee || undefined,
          queuedAt: data.queuedAt ? timestampToDate(data.queuedAt) : undefined,
          derivedFrom: data.derivedFrom || undefined,
          derivationReason: data.derivationReason || undefined,
          queuePositionForEmployee: data.queuePositionForEmployee || undefined,
        };
      });
    } catch (error) {
      console.error('Error getting employee personal queue:', error);
      return [];
    }
  },

  // Derive ticket to employee (smart derivation)
  async deriveTicketToEmployee(
    ticketId: string, 
    targetEmployeeId: string, 
    sourceEmployeeId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get target employee
      const targetEmployee = await employeeService.getEmployeeById(targetEmployeeId);
      if (!targetEmployee) {
        return { success: false, message: 'Empleado destino no encontrado' };
      }

      // Check if target employee is available
      const isEmployeeAvailable = !targetEmployee.currentTicketId && !targetEmployee.isPaused;
      
      if (isEmployeeAvailable) {
        // IMMEDIATE ASSIGNMENT - Employee is available
        console.log('🎯 IMMEDIATE ASSIGNMENT - Employee is available');
        
        await ticketService.updateTicket(ticketId, {
          status: 'being_served',
          servedBy: targetEmployeeId,
          servedAt: new Date(),
          derivedFrom: sourceEmployeeId,
          derivationReason: reason
        });

        await employeeService.updateEmployee(targetEmployeeId, {
          ...targetEmployee,
          currentTicketId: ticketId,
          isPaused: false
        });

        return { 
          success: true, 
          message: `Ticket asignado inmediatamente a ${targetEmployee.name}` 
        };
      } else {
        // QUEUE FOR EMPLOYEE - Employee is busy
        console.log('📋 QUEUE FOR EMPLOYEE - Employee is busy');
        
        // Get current queue position
        const personalQueue = await this.getEmployeePersonalQueue(targetEmployeeId);
        const queuePosition = personalQueue.length + 1;
        
        await ticketService.updateTicket(ticketId, {
          status: 'queued_for_employee',
          queuedForEmployee: targetEmployeeId,
          queuedAt: new Date(),
          derivedFrom: sourceEmployeeId,
          derivationReason: reason,
          queuePositionForEmployee: queuePosition,
          servedBy: undefined // Clear current assignment
        });

        return { 
          success: true, 
          message: `Ticket agregado a la cola personal de ${targetEmployee.name} (posición ${queuePosition})` 
        };
      }
    } catch (error) {
      console.error('Error deriving ticket to employee:', error);
      return { success: false, message: 'Error al derivar ticket' };
    }
  },

  // Process employee's personal queue (auto-assign next ticket)
  async processEmployeePersonalQueue(employeeId: string): Promise<{ success: boolean; ticket?: Ticket }> {
    try {
      const personalQueue = await this.getEmployeePersonalQueue(employeeId);
      
      if (personalQueue.length === 0) {
        return { success: false };
      }

      // Get the next ticket in queue (first in line)
      const nextTicket = personalQueue[0];
      
      console.log('🔄 PROCESSING PERSONAL QUEUE - Auto-assigning next ticket:', {
        employeeId,
        ticketId: nextTicket.id,
        ticketNumber: nextTicket.number,
        queuePosition: nextTicket.queuePositionForEmployee
      });

      // Assign ticket to employee
      await ticketService.updateTicket(nextTicket.id, {
        status: 'being_served',
        servedBy: employeeId,
        servedAt: new Date(),
        queuedForEmployee: undefined,
        queuedAt: undefined,
        queuePositionForEmployee: undefined
      });

      // Update employee
      const employee = await employeeService.getEmployeeById(employeeId);
      if (employee) {
        await employeeService.updateEmployee(employeeId, {
          ...employee,
          currentTicketId: nextTicket.id,
          isPaused: false
        });
      }

      // Update queue positions for remaining tickets
      await this.updateQueuePositions(employeeId);

      return { success: true, ticket: nextTicket };
    } catch (error) {
      console.error('Error processing employee personal queue:', error);
      return { success: false };
    }
  },

  // Update queue positions after ticket removal
  async updateQueuePositions(employeeId: string): Promise<void> {
    try {
      const personalQueue = await this.getEmployeePersonalQueue(employeeId);
      
      // Update positions for remaining tickets
      for (let i = 0; i < personalQueue.length; i++) {
        const ticket = personalQueue[i];
        if (ticket.queuePositionForEmployee !== i + 1) {
          await ticketService.updateTicket(ticket.id, {
            queuePositionForEmployee: i + 1
          });
        }
      }
    } catch (error) {
      console.error('Error updating queue positions:', error);
    }
  },

  // Get employee queue information
  async getEmployeeQueueInfo(employeeId: string): Promise<EmployeeQueueInfo> {
    try {
      const personalQueue = await this.getEmployeePersonalQueue(employeeId);
      const nextTicket = personalQueue.length > 0 ? personalQueue[0] : undefined;
      
      return {
        employeeId,
        personalQueue,
        isProcessingQueue: false,
        nextTicketInQueue: nextTicket,
        queueProcessingPaused: false
      };
    } catch (error) {
      console.error('Error getting employee queue info:', error);
      return {
        employeeId,
        personalQueue: [],
        isProcessingQueue: false,
        nextTicketInQueue: undefined,
        queueProcessingPaused: false
      };
    }
  },

  // Subscribe to employee's personal queue changes
  subscribeToEmployeeQueue(employeeId: string, callback: (tickets: Ticket[]) => void): () => void {
    const q = query(
      collection(db, 'tickets'),
      where('queuedForEmployee', '==', employeeId),
      where('status', '==', 'queued_for_employee'),
      orderBy('queuedAt', 'asc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const tickets = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          number: data.number,
          serviceType: data.serviceType || '',
          serviceSubtype: data.serviceSubtype || undefined,
          status: data.status,
          queuePosition: data.queuePosition,
          createdAt: timestampToDate(data.createdAt),
          servedAt: data.servedAt ? timestampToDate(data.servedAt) : undefined,
          completedAt: data.completedAt ? timestampToDate(data.completedAt) : undefined,
          cancelledAt: data.cancelledAt ? timestampToDate(data.cancelledAt) : undefined,
          servedBy: data.servedBy || undefined,
          cancelledBy: data.cancelledBy || undefined,
          waitTime: data.waitTime || undefined,
          serviceTime: data.serviceTime || undefined,
          totalTime: data.totalTime || undefined,
          cancellationReason: data.cancellationReason || undefined,
          cancellationComment: data.cancellationComment || undefined,
          queuedForEmployee: data.queuedForEmployee || undefined,
          queuedAt: data.queuedAt ? timestampToDate(data.queuedAt) : undefined,
          derivedFrom: data.derivedFrom || undefined,
          derivationReason: data.derivationReason || undefined,
          queuePositionForEmployee: data.queuePositionForEmployee || undefined,
        };
      });
      callback(tickets);
    }, (error) => {
      console.error('Error in employee queue subscription:', error);
    });
  },

  // Check if employee can accept more tickets in personal queue
  async canAcceptMoreTickets(employeeId: string, maxQueueSize: number = 5): Promise<boolean> {
    try {
      const personalQueue = await this.getEmployeePersonalQueue(employeeId);
      return personalQueue.length < maxQueueSize;
    } catch (error) {
      console.error('Error checking if employee can accept more tickets:', error);
      return false;
    }
  },

  // Get all employees with their queue information
  async getAllEmployeesWithQueueInfo(): Promise<{ employee: Employee; queueInfo: EmployeeQueueInfo }[]> {
    try {
      const employees = await employeeService.getAllEmployees();
      const employeesWithQueues = await Promise.all(
        employees.map(async (employee) => {
          const queueInfo = await this.getEmployeeQueueInfo(employee.id);
          return { employee, queueInfo };
        })
      );
      
      return employeesWithQueues;
    } catch (error) {
      console.error('Error getting all employees with queue info:', error);
      return [];
    }
  }
};