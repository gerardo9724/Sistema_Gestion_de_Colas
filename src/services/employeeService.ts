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

  // CRITICAL FIX: Simplified update employee function
  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
    try {
      console.log('💾 EMPLOYEE SERVICE: Starting update operation', {
        employeeId,
        updateKeys: Object.keys(updates)
      });

      if (!employeeId) {
        throw new Error('Employee ID is required for update');
      }

      const employeeRef = doc(db, 'employees', employeeId);
      const updateData: any = { ...updates };
      
      // Convert undefined to null for Firestore
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          updateData[key] = null;
        }
      });
      
      // Always update the timestamp
      updateData.updatedAt = new Date();
      
      console.log('🚀 EMPLOYEE SERVICE: Sending update to Firebase', {
        employeeId,
        finalUpdateData: updateData
      });

      // Direct update without complex timeout handling
      await updateDoc(employeeRef, updateData);
      
      console.log('✅ EMPLOYEE SERVICE: Firebase update completed successfully', {
        employeeId,
        updatedFields: Object.keys(updateData)
      });

      // Log critical state changes
      if (updates.isPaused !== undefined) {
        console.log(`🎯 EMPLOYEE SERVICE: PAUSE STATE UPDATED - Employee ${employeeId} isPaused: ${updates.isPaused}`);
      }

    } catch (error) {
      console.error('❌ EMPLOYEE SERVICE: Update error', {
        employeeId,
        error: error instanceof Error ? {
          message: error.message,
          name: error.name
        } : error
      });
      
      // Provide specific error information
      if (error instanceof Error) {
        throw new Error(`Error al actualizar empleado: ${error.message}`);
      } else {
        throw new Error('Error desconocido al actualizar empleado');
      }
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

  // CRITICAL FIX: Optimized subscription with controlled logging
  subscribeToEmployees(callback: (employees: Employee[]) => void): () => void {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'asc'));
    
    // Track last update time to prevent excessive logging
    const lastLogTimeRef = { value: 0 };
    const LOG_THROTTLE = 5000; // 5 seconds between logs
    
    return onSnapshot(q, (querySnapshot) => {
      const employees = querySnapshot.docs.map(convertFirestoreEmployee);
      
      // Throttle logging to prevent console overflow
      const now = Date.now();
      if (now - lastLogTimeRef.value > LOG_THROTTLE) {
        console.log(`🔄 EMPLOYEE SERVICE: Real-time update received with ${employees.length} employees`);
        lastLogTimeRef.value = now;
      }
      
      callback(employees);
    }, (error) => {
      console.error('❌ EMPLOYEE SERVICE: Real-time subscription error:', error);
    });
  }
};