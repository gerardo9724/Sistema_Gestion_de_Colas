import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { TicketDerivation } from '../types';

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

// Convert derivation data from Firestore
const convertFirestoreDerivation = (doc: any): TicketDerivation => {
  const data = doc.data();
  return {
    id: doc.id,
    ticketId: data.ticketId,
    fromEmployeeId: data.fromEmployeeId,
    toEmployeeId: data.toEmployeeId || undefined,
    derivationType: data.derivationType,
    reason: data.reason || undefined,
    comment: data.comment || undefined,
    newServiceType: data.newServiceType || undefined,
    derivedAt: timestampToDate(data.derivedAt),
    acceptedAt: data.acceptedAt ? timestampToDate(data.acceptedAt) : undefined,
    rejectedAt: data.rejectedAt ? timestampToDate(data.rejectedAt) : undefined,
    status: data.status,
  };
};

export const ticketDerivationService = {
  // Create a new ticket derivation
  async createDerivation(derivationData: {
    ticketId: string;
    fromEmployeeId: string;
    toEmployeeId?: string;
    derivationType: 'to_employee' | 'to_general_queue';
    reason?: string;
    comment?: string;
    newServiceType?: string;
  }): Promise<TicketDerivation> {
    try {
      const data = {
        ticketId: derivationData.ticketId,
        fromEmployeeId: derivationData.fromEmployeeId,
        toEmployeeId: derivationData.toEmployeeId || null,
        derivationType: derivationData.derivationType,
        reason: derivationData.reason || null,
        comment: derivationData.comment || null,
        newServiceType: derivationData.newServiceType || null,
        derivedAt: Timestamp.fromDate(new Date()),
        acceptedAt: null,
        rejectedAt: null,
        status: derivationData.derivationType === 'to_general_queue' ? 'auto_assigned' : 'pending',
      };
      
      const docRef = await addDoc(collection(db, 'ticketDerivations'), data);
      
      return {
        id: docRef.id,
        ...data,
        toEmployeeId: data.toEmployeeId || undefined,
        reason: data.reason || undefined,
        comment: data.comment || undefined,
        newServiceType: data.newServiceType || undefined,
        derivedAt: new Date(),
        acceptedAt: undefined,
        rejectedAt: undefined,
      };
    } catch (error) {
      console.error('Error creating derivation:', error);
      throw new Error('Failed to create derivation');
    }
  },

  // Accept a derivation
  async acceptDerivation(derivationId: string): Promise<void> {
    try {
      const derivationRef = doc(db, 'ticketDerivations', derivationId);
      await updateDoc(derivationRef, {
        status: 'accepted',
        acceptedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error accepting derivation:', error);
      throw new Error('Failed to accept derivation');
    }
  },

  // Reject a derivation
  async rejectDerivation(derivationId: string): Promise<void> {
    try {
      const derivationRef = doc(db, 'ticketDerivations', derivationId);
      await updateDoc(derivationRef, {
        status: 'rejected',
        rejectedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error rejecting derivation:', error);
      throw new Error('Failed to reject derivation');
    }
  },

  // Get all derivations
  async getAllDerivations(): Promise<TicketDerivation[]> {
    try {
      const q = query(collection(db, 'ticketDerivations'), orderBy('derivedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(convertFirestoreDerivation);
    } catch (error) {
      console.error('Error getting derivations:', error);
      return [];
    }
  },

  // Get derivations for a specific employee
  async getEmployeeDerivations(employeeId: string): Promise<TicketDerivation[]> {
    try {
      const q = query(
        collection(db, 'ticketDerivations'),
        where('toEmployeeId', '==', employeeId),
        where('status', '==', 'pending'),
        orderBy('derivedAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirestoreDerivation);
    } catch (error) {
      console.error('Error getting employee derivations:', error);
      return [];
    }
  },

  // Subscribe to derivations changes (real-time)
  subscribeToDerivations(callback: (derivations: TicketDerivation[]) => void): () => void {
    const q = query(collection(db, 'ticketDerivations'), orderBy('derivedAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const derivations = querySnapshot.docs.map(convertFirestoreDerivation);
      callback(derivations);
    }, (error) => {
      console.error('Error in derivations subscription:', error);
    });
  }
};