import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, Employee } from '../types';

// Simple password hashing (in production, use proper bcrypt)
const hashPassword = (password: string): string => {
  return btoa(password + 'salt_key_2024');
};

// Verify password against hash
const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  employee?: Employee;
  error?: string;
}

export const authService = {
  // Login with username and password
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const { username, password } = credentials;

      if (!username || !password) {
        return {
          success: false,
          error: 'Usuario y contraseña son requeridos'
        };
      }

      // Query user from Firestore
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', username),
        limit(1)
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();

      // Verify password
      if (!userData.password) {
        return {
          success: false,
          error: 'Usuario sin contraseña configurada'
        };
      }

      const isPasswordValid = verifyPassword(password, userData.password);

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Contraseña incorrecta'
        };
      }

      // Check if user type requires authentication
      if (!['empleado', 'administrador'].includes(userData.type)) {
        return {
          success: false,
          error: 'Tipo de usuario no válido para login'
        };
      }

      const user: User = {
        id: userDoc.id,
        name: userData.name,
        username: userData.username,
        type: userData.type,
        employeeId: userData.employeeId || undefined,
        isActive: userData.isActive ?? true,
        createdAt: userData.createdAt?.toDate() || new Date(),
      };

      // Get employee data if user is an employee
      let employee: Employee | undefined;
      if (userData.employeeId) {
        try {
          const employeeQuery = query(
            collection(db, 'employees'),
            where('__name__', '==', userData.employeeId),
            limit(1)
          );
          const employeeSnapshot = await getDocs(employeeQuery);
          
          if (!employeeSnapshot.empty) {
            const employeeDoc = employeeSnapshot.docs[0];
            const employeeData = employeeDoc.data();
            
            employee = {
              id: employeeDoc.id,
              name: employeeData.name,
              position: employeeData.position,
              isActive: employeeData.isActive ?? true,
              currentTicketId: employeeData.currentTicketId || undefined,
              totalTicketsServed: employeeData.totalTicketsServed || 0,
              totalTicketsCancelled: employeeData.totalTicketsCancelled || 0,
              isPaused: employeeData.isPaused ?? false,
              userId: employeeData.userId || undefined,
              createdAt: employeeData.createdAt?.toDate() || new Date(),
            };
          }
        } catch (error) {
          console.warn('Could not fetch employee data:', error);
        }
      }

      return {
        success: true,
        user,
        employee
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  },

  // Create a new user
  async createUser(userData: {
    name: string;
    username: string;
    password?: string;
    type: 'empleado' | 'administrador';
    employeeId?: string;
  }): Promise<LoginResult> {
    try {
      const { name, username, password = '123', type, employeeId } = userData;

      // Check if username already exists
      const existingUserQuery = query(
        collection(db, 'users'),
        where('username', '==', username),
        limit(1)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (!existingUserSnapshot.empty) {
        return {
          success: false,
          error: 'El nombre de usuario ya existe'
        };
      }

      // Hash the password
      const hashedPassword = hashPassword(password);

      // Create user in database
      const userDocRef = await addDoc(collection(db, 'users'), {
        name,
        username,
        password: hashedPassword,
        type,
        employeeId: employeeId || null,
        isActive: true,
        createdAt: new Date(),
      });

      const user: User = {
        id: userDocRef.id,
        name,
        username,
        type,
        employeeId,
        isActive: true,
        createdAt: new Date(),
      };

      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  },

  // Update user password
  async updatePassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const hashedPassword = hashPassword(newPassword);
      const userRef = doc(db, 'users', userId);

      await updateDoc(userRef, {
        password: hashedPassword,
        updatedAt: new Date(),
      });

      return { success: true };

    } catch (error) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: {
    name?: string;
    username?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if username is being changed and if it already exists
      if (updates.username) {
        const existingUserQuery = query(
          collection(db, 'users'),
          where('username', '==', updates.username),
          limit(1)
        );
        const existingUserSnapshot = await getDocs(existingUserQuery);

        if (!existingUserSnapshot.empty && existingUserSnapshot.docs[0].id !== userId) {
          return {
            success: false,
            error: 'El nombre de usuario ya existe'
          };
        }
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      });

      return { success: true };

    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }
};