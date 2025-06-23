import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { ComputerProfile } from '../types';

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

// Convert computer profile data from Firestore
const convertFirestoreComputerProfile = (doc: any): ComputerProfile => {
  const data = doc.data();
  return {
    id: doc.id,
    computerIdentifier: data.computerIdentifier,
    profileType: data.profileType,
    profileName: data.profileName,
    isActive: data.isActive ?? true,
    assignedUserId: data.assignedUserId || undefined,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
};

// Generate unique computer identifier
export const getComputerIdentifier = (): string => {
  let identifier = localStorage.getItem('computer_identifier');
  if (!identifier) {
    identifier = 'PC-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    localStorage.setItem('computer_identifier', identifier);
  }
  return identifier;
};

export const computerProfileService = {
  // Get all computer profiles
  async getAllComputerProfiles(): Promise<ComputerProfile[]> {
    try {
      const q = query(collection(db, 'computerProfiles'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(convertFirestoreComputerProfile);
    } catch (error) {
      console.error('Error getting computer profiles:', error);
      return [];
    }
  },

  // Get profile by computer identifier
  async getProfileByComputerIdentifier(computerIdentifier: string): Promise<ComputerProfile | null> {
    try {
      const q = query(
        collection(db, 'computerProfiles'),
        where('computerIdentifier', '==', computerIdentifier),
        where('isActive', '==', true),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      return convertFirestoreComputerProfile(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error getting profile by computer identifier:', error);
      return null;
    }
  },

  // Create a new computer profile
  async createComputerProfile(profileData: {
    computerIdentifier: string;
    profileType: 'botonera' | 'nodo' | 'empleado';
    profileName: string;
    assignedUserId?: string;
  }): Promise<ComputerProfile> {
    try {
      const data = {
        computerIdentifier: profileData.computerIdentifier,
        profileType: profileData.profileType,
        profileName: profileData.profileName,
        isActive: true,
        assignedUserId: profileData.assignedUserId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'computerProfiles'), data);
      
      return {
        id: docRef.id,
        ...data,
        assignedUserId: data.assignedUserId || undefined,
      };
    } catch (error) {
      console.error('Error creating computer profile:', error);
      throw new Error('Failed to create computer profile');
    }
  },

  // Update computer profile
  async updateComputerProfile(profileId: string, updates: Partial<ComputerProfile>): Promise<void> {
    try {
      const profileRef = doc(db, 'computerProfiles', profileId);
      const updateData: any = { ...updates };
      
      // Convert undefined to null for Firestore
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          updateData[key] = null;
        }
      });
      
      updateData.updatedAt = new Date();
      
      await updateDoc(profileRef, updateData);
    } catch (error) {
      console.error('Error updating computer profile:', error);
      throw new Error('Failed to update computer profile');
    }
  },

  // Delete computer profile
  async deleteComputerProfile(profileId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'computerProfiles', profileId));
    } catch (error) {
      console.error('Error deleting computer profile:', error);
      throw new Error('Failed to delete computer profile');
    }
  },

  // Subscribe to computer profiles changes (real-time)
  subscribeToComputerProfiles(callback: (profiles: ComputerProfile[]) => void): () => void {
    const q = query(collection(db, 'computerProfiles'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const profiles = querySnapshot.docs.map(convertFirestoreComputerProfile);
      callback(profiles);
    }, (error) => {
      console.error('Error in computer profiles subscription:', error);
    });
  }
};