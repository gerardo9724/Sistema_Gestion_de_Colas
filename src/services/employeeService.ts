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

  // CRITICAL FIX: Enhanced update employee with comprehensive validation and error handling
  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
    try {
      console.log('💾 EMPLOYEE SERVICE: Starting update operation', {
        employeeId,
        updates,
        updateKeys: Object.keys(updates),
        criticalFields: {
          isPaused: updates.isPaused,
          currentTicketId: updates.currentTicketId,
          isActive: updates.isActive
        }
      });

      if (!employeeId) {
        throw new Error('Employee ID is required for update');
      }

      const employeeRef = doc(db, 'employees', employeeId);
      const updateData: any = { ...updates };
      
      // CRITICAL: Validate required fields are present
      const requiredFields = ['name', 'position', 'isActive'];
      const missingFields = requiredFields.filter(field => 
        updateData[field] === undefined && field !== 'isActive' // isActive can be false
      );
      
      if (missingFields.length > 0) {
        console.warn('⚠️ EMPLOYEE SERVICE: Missing required fields, but proceeding with partial update', {
          missingFields,
          providedFields: Object.keys(updateData)
        });
      }

      // Convert undefined to null for Firestore compatibility
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          updateData[key] = null;
        }
      });
      
      // CRITICAL: Always update the updatedAt timestamp
      updateData.updatedAt = new Date();
      
      console.log('🚀 EMPLOYEE SERVICE: Sending update to Firebase', {
        employeeId,
        finalUpdateData: updateData,
        documentPath: `employees/${employeeId}`
      });

      // CRITICAL FIX: Direct Firebase update with enhanced error handling
      await updateDoc(employeeRef, updateData);
      
      console.log('✅ EMPLOYEE SERVICE: Firebase update completed successfully', {
        employeeId,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString()
      });

      // VALIDATION: Log the critical state change if isPaused was updated
      if (updates.isPaused !== undefined) {
        console.log(`🎯 EMPLOYEE SERVICE: PAUSE STATE UPDATED - Employee ${employeeId} isPaused: ${updates.isPaused}`);
      }

    } catch (error) {
      console.error('❌ EMPLOYEE SERVICE: Critical update error', {
        employeeId,
        updates,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error
      });
      
      // ENHANCED ERROR: Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          throw new Error(`Permisos insuficientes para actualizar empleado: ${error.message}`);
        } else if (error.message.includes('not-found')) {
          throw new Error(`Empleado no encontrado: ${employeeId}`);
        } else if (error.message.includes('network')) {
          throw new Error(`Error de conexión: ${error.message}`);
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

  // Subscribe to employee changes (real-time)
  subscribeToEmployees(callback: (employees: Employee[]) => void): () => void {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'asc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const employees = querySnapshot.docs.map(convertFirestoreEmployee);
      
      // CRITICAL DEBUG: Log real-time updates for pause state changes
      employees.forEach(employee => {
        console.log(`🔄 REAL-TIME UPDATE: Employee ${employee.name} - isPaused: ${employee.isPaused}, currentTicket: ${employee.currentTicketId || 'none'}`);
      });
      
      callback(employees);
    }, (error) => {
      console.error('❌ EMPLOYEE SERVICE: Real-time subscription error:', error);
    });
  }
};