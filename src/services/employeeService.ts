import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { Employee } from '../types';

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

// Convert employee data from Firestore
const convertFirestoreEmployee = (doc: any): Employee => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    position: data.position,
    isActive: data.isActive ?? true,
    currentTicketId: data.currentTicketId || undefined,
    totalTicketsServed: data.totalTicketsServed || 0,
    totalTicketsCancelled: data.totalTicketsCancelled || 0,
    isPaused: data.isPaused ?? false,
    userId: data.userId || undefined,
    createdAt: timestampToDate(data.createdAt),
  };
};

export const employeeService = {
  // Get all employees
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const q = query(collection(db, 'employees'), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(convertFirestoreEmployee);
    } catch (error) {
      console.error('Error getting employees:', error);
      return [];
    }
  },

  // Create a new employee
  async createEmployee(employeeData: {
    name: string;
    position: string;
    isActive?: boolean;
  }): Promise<Employee> {
    try {
      const data = {
        name: employeeData.name,
        position: employeeData.position,
        isActive: employeeData.isActive ?? true,
        currentTicketId: null,
        totalTicketsServed: 0,
        totalTicketsCancelled: 0,
        isPaused: false,
        userId: null,
        createdAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'employees'), data);
      
      return {
        id: docRef.id,
        ...data,
        currentTicketId: undefined,
        userId: undefined,
      };
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error('Failed to create employee');
    }
  },

  // Update employee
  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
    try {
      const employeeRef = doc(db, 'employees', employeeId);
      const updateData: any = { ...updates };
      
      // Convert undefined to null for Firestore
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          updateData[key] = null;
        }
      });
      
      updateData.updatedAt = new Date();
      
      await updateDoc(employeeRef, updateData);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error('Failed to update employee');
    }
  },

  // Delete employee
  async deleteEmployee(employeeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'employees', employeeId));
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw new Error('Failed to delete employee');
    }
  },

  // Subscribe to employee changes (real-time)
  subscribeToEmployees(callback: (employees: Employee[]) => void): () => void {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'asc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const employees = querySnapshot.docs.map(convertFirestoreEmployee);
      callback(employees);
    }, (error) => {
      console.error('Error in employees subscription:', error);
    });
  }
};