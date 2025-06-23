import { 
  collection, 
  doc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { User } from '../types';

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

// Convert user data from Firestore
const convertFirestoreUser = (doc: any): User => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    username: data.username || undefined,
    type: data.type,
    employeeId: data.employeeId || undefined,
    isActive: data.isActive ?? true,
    createdAt: timestampToDate(data.createdAt),
  };
};

export const userService = {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(convertFirestoreUser);
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  },

  // Subscribe to user changes (real-time)
  subscribeToUsers(callback: (users: User[]) => void): () => void {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(convertFirestoreUser);
      callback(users);
    }, (error) => {
      console.error('Error in users subscription:', error);
    });
  }
};