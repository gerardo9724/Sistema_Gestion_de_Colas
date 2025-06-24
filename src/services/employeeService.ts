import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
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
    
    // NEW: Employee Queue Fields
    personalQueueCount: data.personalQueueCount || 0,
    maxPersonalQueueSize: data.maxPersonalQueueSize || 5,
    autoProcessPersonalQueue: data.autoProcessPersonalQueue ?? true,
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

  // Get employee by ID
  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    try {
      const docRef = doc(db, 'employees', employeeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return convertFirestoreEmployee(docSnap);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting employee by ID:', error);
      return null;
    }
  },

  // Create a new employee
  async createEmployee(employeeData: {
    name: string;
    position: string;
    isActive?: boolean;
    maxPersonalQueueSize?: number;
    autoProcessPersonalQueue?: boolean;
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
        
        // NEW: Employee Queue Fields
        personalQueueCount: 0,
        maxPersonalQueueSize: employeeData.maxPersonalQueueSize || 5,
        autoProcessPersonalQueue: employeeData.autoProcessPersonalQueue ?? true,
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
  },

  // NEW: Get available employees (not paused, no current ticket, can accept more in queue)
  async getAvailableEmployees(): Promise<Employee[]> {
    try {
      const allEmployees = await this.getAllEmployees();
      return allEmployees.filter(emp => 
        emp.isActive && 
        !emp.isPaused && 
        !emp.currentTicketId
      );
    } catch (error) {
      console.error('Error getting available employees:', error);
      return [];
    }
  },

  // NEW: Get employees who can accept tickets in their personal queue
  async getEmployeesAcceptingQueue(): Promise<Employee[]> {
    try {
      const allEmployees = await this.getAllEmployees();
      return allEmployees.filter(emp => 
        emp.isActive && 
        (emp.personalQueueCount || 0) < (emp.maxPersonalQueueSize || 5)
      );
    } catch (error) {
      console.error('Error getting employees accepting queue:', error);
      return [];
    }
  },

  // NEW: Update employee's personal queue count
  async updatePersonalQueueCount(employeeId: string, count: number): Promise<void> {
    try {
      const employeeRef = doc(db, 'employees', employeeId);
      await updateDoc(employeeRef, {
        personalQueueCount: count,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating personal queue count:', error);
      throw new Error('Failed to update personal queue count');
    }
  }
};