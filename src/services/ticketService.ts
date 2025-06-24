import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { Ticket } from '../types';

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

// Convert ticket data from Firestore
const convertFirestoreTicket = (doc: any): Ticket => {
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
    // NEW: Employee queue fields
    queuedForEmployee: data.queuedForEmployee || undefined,
    queuedAt: data.queuedAt ? timestampToDate(data.queuedAt) : undefined,
    derivedFrom: data.derivedFrom || undefined,
  };
};

export const ticketService = {
  // Get today's ticket number (for daily reset)
  async getTodayTicketNumber(): Promise<number> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const q = query(
        collection(db, 'tickets'),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<', Timestamp.fromDate(endOfDay)),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return 1;
      }
      
      const lastTicket = querySnapshot.docs[0].data();
      return (lastTicket.number || 0) + 1;
    } catch (error) {
      console.error('Error getting today ticket number:', error);
      return 1;
    }
  },

  // Create a new ticket
  async createTicket(serviceType: string, serviceSubtype?: string): Promise<Ticket> {
    try {
      const ticketNumber = await this.getTodayTicketNumber();
      
      // Get current queue position - only need count, no ordering required
      const waitingTicketsQuery = query(
        collection(db, 'tickets'),
        where('status', '==', 'waiting')
      );
      
      const waitingTickets = await getDocs(waitingTicketsQuery);
      const queuePosition = waitingTickets.size + 1;
      
      const ticketData = {
        number: ticketNumber,
        serviceType,
        serviceSubtype: serviceSubtype || null,
        status: 'waiting',
        queuePosition,
        createdAt: Timestamp.fromDate(new Date()),
        servedAt: null,
        completedAt: null,
        cancelledAt: null,
        servedBy: null,
        cancelledBy: null,
        waitTime: null,
        serviceTime: null,
        totalTime: null,
        cancellationReason: null,
        cancellationComment: null,
        // NEW: Employee queue fields
        queuedForEmployee: null,
        queuedAt: null,
        derivedFrom: null,
      };
      
      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      
      return {
        id: docRef.id,
        number: ticketNumber,
        serviceType,
        serviceSubtype,
        status: 'waiting',
        queuePosition,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw new Error('Failed to create ticket');
    }
  },

  // NEW: Queue ticket for specific employee
  async queueTicketForEmployee(ticketId: string, employeeId: string, derivedFromEmployeeId?: string): Promise<void> {
    try {
      const updateData: any = {
        status: 'queued_for_employee',
        queuedForEmployee: employeeId,
        queuedAt: Timestamp.fromDate(new Date()),
      };

      if (derivedFromEmployeeId) {
        updateData.derivedFrom = derivedFromEmployeeId;
      }

      await updateDoc(doc(db, 'tickets', ticketId), updateData);
    } catch (error) {
      console.error('Error queuing ticket for employee:', error);
      throw new Error('Failed to queue ticket for employee');
    }
  },

  // NEW: Get next queued ticket for employee
  async getNextQueuedTicketForEmployee(employeeId: string): Promise<Ticket | null> {
    try {
      const q = query(
        collection(db, 'tickets'),
        where('status', '==', 'queued_for_employee'),
        where('queuedForEmployee', '==', employeeId),
        orderBy('queuedAt', 'asc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      return convertFirestoreTicket(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error getting next queued ticket:', error);
      return null;
    }
  },

  // NEW: Get queued tickets count for employee
  async getQueuedTicketsCountForEmployee(employeeId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'tickets'),
        where('status', '==', 'queued_for_employee'),
        where('queuedForEmployee', '==', employeeId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting queued tickets count:', error);
      return 0;
    }
  },

  // Get all tickets
  async getAllTickets(): Promise<Ticket[]> {
    try {
      const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(convertFirestoreTicket);
    } catch (error) {
      console.error('Error getting tickets:', error);
      return [];
    }
  },

  // Get waiting tickets
  async getWaitingTickets(): Promise<Ticket[]> {
    try {
      const q = query(
        collection(db, 'tickets'),
        where('status', '==', 'waiting'),
        orderBy('createdAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirestoreTicket);
    } catch (error) {
      console.error('Error getting waiting tickets:', error);
      return [];
    }
  },

  // Subscribe to ticket changes (real-time)
  subscribeToTickets(callback: (tickets: Ticket[]) => void): () => void {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const tickets = querySnapshot.docs.map(convertFirestoreTicket);
      callback(tickets);
    }, (error) => {
      console.error('Error in tickets subscription:', error);
    });
  },

  // Update ticket
  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<void> {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const updateData: any = { ...updates };
      
      // Convert dates to Firestore timestamps
      if (updateData.servedAt) updateData.servedAt = Timestamp.fromDate(updateData.servedAt);
      if (updateData.completedAt) updateData.completedAt = Timestamp.fromDate(updateData.completedAt);
      if (updateData.cancelledAt) updateData.cancelledAt = Timestamp.fromDate(updateData.cancelledAt);
      if (updateData.queuedAt) updateData.queuedAt = Timestamp.fromDate(updateData.queuedAt);
      
      await updateDoc(ticketRef, updateData);
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw new Error('Failed to update ticket');
    }
  }
};