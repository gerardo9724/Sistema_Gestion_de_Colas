import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { SystemSettings } from '../types';

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

// Convert system settings data from Firestore
const convertFirestoreSystemSettings = (doc: any): SystemSettings => {
  const data = doc.data();
  return {
    id: doc.id,
    printTickets: data.printTickets ?? true,
    printerName: data.printerName || undefined,
    companyName: data.companyName || 'Sistema de Gestión de Colas',
    companyAddress: data.companyAddress || 'Av. Principal 123, Ciudad',
    companyPhone: data.companyPhone || '+1 (555) 123-4567',
    companyEmail: data.companyEmail || undefined,
    companyWebsite: data.companyWebsite || undefined,
    companyLogo: data.companyLogo || undefined,
    selectedTicketTemplate: data.selectedTicketTemplate || '',
    autoAssignTickets: data.autoAssignTickets ?? true,
    enableAudioNotifications: data.enableAudioNotifications ?? true,
    enableVisualNotifications: data.enableVisualNotifications ?? true,
    notificationVolume: data.notificationVolume || 0.8,
    language: data.language || 'es',
    timezone: data.timezone || 'America/Mexico_City',
    dateFormat: data.dateFormat || 'DD/MM/YYYY',
    timeFormat: data.timeFormat || '24h',
    updatedAt: timestampToDate(data.updatedAt),
  };
};

export const systemSettingsService = {
  // Get system settings
  async getSystemSettings(): Promise<SystemSettings | null> {
    try {
      const q = query(collection(db, 'systemSettings'), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create default settings if none exist
        return await this.createDefaultSettings();
      }
      
      return convertFirestoreSystemSettings(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error getting system settings:', error);
      return null;
    }
  },

  // Create default system settings
  async createDefaultSettings(): Promise<SystemSettings> {
    try {
      const defaultData = {
        printTickets: true,
        printerName: null,
        companyName: 'Sistema de Gestión de Colas',
        companyAddress: 'Av. Principal 123, Ciudad',
        companyPhone: '+1 (555) 123-4567',
        companyEmail: null,
        companyWebsite: null,
        companyLogo: null,
        selectedTicketTemplate: '',
        autoAssignTickets: true,
        enableAudioNotifications: true,
        enableVisualNotifications: true,
        notificationVolume: 0.8,
        language: 'es',
        timezone: 'America/Mexico_City',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'systemSettings'), defaultData);
      
      return {
        id: docRef.id,
        ...defaultData,
        printerName: undefined,
        companyEmail: undefined,
        companyWebsite: undefined,
        companyLogo: undefined,
      };
    } catch (error) {
      console.error('Error creating default settings:', error);
      throw new Error('Failed to create default settings');
    }
  },

  // Update system settings
  async updateSystemSettings(settingsId: string, updates: Partial<SystemSettings>): Promise<void> {
    try {
      const settingsRef = doc(db, 'systemSettings', settingsId);
      const updateData: any = { ...updates };
      
      // Convert undefined to null for Firestore
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          updateData[key] = null;
        }
      });
      
      updateData.updatedAt = new Date();
      
      await updateDoc(settingsRef, updateData);
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw new Error('Failed to update system settings');
    }
  },

  // Subscribe to system settings changes (real-time)
  subscribeToSystemSettings(callback: (settings: SystemSettings | null) => void): () => void {
    const q = query(collection(db, 'systemSettings'), limit(1));
    
    return onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        callback(null);
      } else {
        const settings = convertFirestoreSystemSettings(querySnapshot.docs[0]);
        callback(settings);
      }
    }, (error) => {
      console.error('Error in system settings subscription:', error);
    });
  }
};