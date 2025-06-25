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

// CRITICAL FIX: Track update operations to prevent excessive calls
const updateOperationsTracker = {
  lastUpdateTime: new Map<string, number>(),
  pendingUpdates: new Map<string, Promise<void>>(),
  
  // Check if update is too frequent
  isTooFrequent(employeeId: string): boolean {
    const lastUpdate = this.lastUpdateTime.get(employeeId) || 0;
    const now = Date.now();
    const timeDiff = now - lastUpdate;
    
    // CRITICAL: Minimum 1 second between updates for same employee
    return timeDiff < 1000;
  },
  
  // Record update time
  recordUpdate(employeeId: string): void {
    this.lastUpdateTime.set(employeeId, Date.now());
  },
  
  // Check if update is already pending
  hasPendingUpdate(employeeId: string): boolean {
    return this.pendingUpdates.has(employeeId);
  },
  
  // Set pending update
  setPendingUpdate(employeeId: string, promise: Promise<void>): void {
    this.pendingUpdates.set(employeeId, promise);
    
    // Clean up when promise resolves
    promise.finally(() => {
      this.pendingUpdates.delete(employeeId);
    });
  }
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

  // CRITICAL FIX: Heavily optimized update employee function with debouncing
  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
    try {
      console.log('💾 EMPLOYEE SERVICE: Update request received', {
        employeeId,
        updateKeys: Object.keys(updates),
        timestamp: new Date().toISOString()
      });

      if (!employeeId) {
        throw new Error('Employee ID is required for update');
      }

      // CRITICAL: Check for too frequent updates
      if (updateOperationsTracker.isTooFrequent(employeeId)) {
        console.log('🚫 EMPLOYEE SERVICE: Update blocked - too frequent', {
          employeeId,
          lastUpdate: updateOperationsTracker.lastUpdateTime.get(employeeId)
        });
        return;
      }

      // CRITICAL: Check for pending updates
      if (updateOperationsTracker.hasPendingUpdate(employeeId)) {
        console.log('⏳ EMPLOYEE SERVICE: Update blocked - already pending', {
          employeeId
        });
        
        // Wait for pending update to complete
        await updateOperationsTracker.pendingUpdates.get(employeeId);
        return;
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

      // CRITICAL: Create and track the update promise
      const updatePromise = updateDoc(employeeRef, updateData);
      updateOperationsTracker.setPendingUpdate(employeeId, updatePromise);
      updateOperationsTracker.recordUpdate(employeeId);

      // Execute the update
      await updatePromise;
      
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

  // CRITICAL FIX: Optimized subscription with controlled logging and change detection
  subscribeToEmployees(callback: (employees: Employee[]) => void): () => void {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'asc'));
    
    // Track last update time to prevent excessive logging
    let lastLogTime = 0;
    let lastEmployeeStates = new Map<string, { isActive: boolean; isPaused: boolean }>();
    const LOG_THROTTLE = 3000; // 3 seconds between logs
    
    return onSnapshot(q, (querySnapshot) => {
      const employees = querySnapshot.docs.map(convertFirestoreEmployee);
      
      // CRITICAL: Only log significant changes, not every update
      const now = Date.now();
      let hasSignificantChanges = false;
      
      // Check for significant state changes
      employees.forEach(employee => {
        const lastState = lastEmployeeStates.get(employee.id);
        const currentState = { isActive: employee.isActive, isPaused: employee.isPaused };
        
        if (!lastState || 
            lastState.isActive !== currentState.isActive || 
            lastState.isPaused !== currentState.isPaused) {
          hasSignificantChanges = true;
          lastEmployeeStates.set(employee.id, currentState);
          
          console.log(`🔄 EMPLOYEE STATE CHANGE: ${employee.name}`, {
            employeeId: employee.id,
            previous: lastState,
            current: currentState,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Throttle general logging but always log significant changes
      if (hasSignificantChanges || (now - lastLogTime > LOG_THROTTLE)) {
        if (!hasSignificantChanges) {
          console.log(`🔄 EMPLOYEE SERVICE: Routine update received with ${employees.length} employees`);
        }
        lastLogTime = now;
      }
      
      callback(employees);
    }, (error) => {
      console.error('❌ EMPLOYEE SERVICE: Real-time subscription error:', error);
    });
  }
};