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

  // CRITICAL FIX: Enhanced update employee function with better error handling
  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
    try {
      console.log('💾 EMPLOYEE SERVICE: Starting update operation', {
        employeeId,
        updateKeys: Object.keys(updates),
        updateValues: updates
      });

      if (!employeeId) {
        throw new Error('Employee ID is required for update');
      }

      // CRITICAL: Validate Firebase connection
      if (!db) {
        throw new Error('Firebase database not initialized');
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

      // CRITICAL FIX: Add timeout and better error handling
      const updatePromise = updateDoc(employeeRef, updateData);
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Update operation timed out')), 10000);
      });

      await Promise.race([updatePromise, timeoutPromise]);
      
      console.log('✅ EMPLOYEE SERVICE: Firebase update completed successfully', {
        employeeId,
        updatedFields: Object.keys(updateData)
      });

      // Log critical state changes
      if (updates.isActive !== undefined) {
        console.log(`🎯 EMPLOYEE SERVICE: ACTIVE STATE UPDATED - Employee ${employeeId} isActive: ${updates.isActive}`);
      }
      
      if (updates.isPaused !== undefined) {
        console.log(`🎯 EMPLOYEE SERVICE: PAUSE STATE UPDATED - Employee ${employeeId} isPaused: ${updates.isPaused}`);
      }

    } catch (error) {
      console.error('❌ EMPLOYEE SERVICE: Update error', {
        employeeId,
        error: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : error
      });
      
      // CRITICAL: Provide specific error information
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('La operación tardó demasiado tiempo. Verifica tu conexión a internet.');
        } else if (error.message.includes('permission')) {
          throw new Error('Sin permisos para actualizar empleado. Contacta al administrador.');
        } else if (error.message.includes('not-found')) {
          throw new Error('Empleado no encontrado en la base de datos.');
        } else {
          throw new Error(`Error al actualizar empleado: ${error.message}`);
        }
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

  // CRITICAL FIX: Enhanced subscription with proper error handling
  subscribeToEmployees(callback: (employees: Employee[]) => void): () => void {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'asc'));
    
    // Track last update time to prevent excessive logging
    const lastLogTimeRef = { value: 0 };
    const LOG_THROTTLE = 5000; // 5 seconds between logs
    
    return onSnapshot(q, (querySnapshot) => {
      try {
        const employees = querySnapshot.docs.map(convertFirestoreEmployee);
        
        // Throttle logging to prevent console overflow
        const now = Date.now();
        if (now - lastLogTimeRef.value > LOG_THROTTLE) {
          console.log(`🔄 EMPLOYEE SERVICE: Real-time update received with ${employees.length} employees`);
          lastLogTimeRef.value = now;
        }
        
        callback(employees);
      } catch (conversionError) {
        console.error('❌ EMPLOYEE SERVICE: Error converting employee data:', conversionError);
        // Still call callback with empty array to prevent UI from breaking
        callback([]);
      }
    }, (error) => {
      console.error('❌ EMPLOYEE SERVICE: Real-time subscription error:', error);
      // CRITICAL FIX: Don't throw here, just log the error
      // This prevents uncaught promise rejections
    });
  }
};