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
import type { NodeConfiguration } from '../types';

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

// Convert node configuration data from Firestore
const convertFirestoreNodeConfiguration = (doc: any): NodeConfiguration => {
  const data = doc.data();
  return {
    id: doc.id,
    // Display Settings
    autoRotationInterval: data.autoRotationInterval || 5000,
    showQueueInfo: data.showQueueInfo ?? true,
    showCompanyLogo: data.showCompanyLogo ?? true,
    maxTicketsDisplayed: data.maxTicketsDisplayed || 6,
    showDateTime: data.showDateTime ?? true,
    showConnectionStatus: data.showConnectionStatus ?? true,
    showHeader: data.showHeader ?? true,
    showCarousel: data.showCarousel ?? true, // NEW: Carousel visibility
    compactMode: data.compactMode ?? false,
    
    // Audio Settings
    enableAudio: data.enableAudio ?? true,
    audioVolume: data.audioVolume || 0.8,
    selectedVoice: data.selectedVoice || 'auto-female',
    speechRate: data.speechRate || 0.75,
    
    // Visual Settings
    backgroundColor: data.backgroundColor || '#F1F5F9',
    headerColor: data.headerColor || '#3B82F6',
    textColor: data.textColor || '#1F2937',
    accentColor: data.accentColor || '#10B981',
    
    // Animation Settings
    enableAnimations: data.enableAnimations ?? true,
    highlightDuration: data.highlightDuration || 10000,
    transitionDuration: data.transitionDuration || 1000,
    
    // Content Settings
    showImageDescriptions: data.showImageDescriptions ?? true,
    showImageIndicators: data.showImageIndicators ?? true,
    pauseOnHover: data.pauseOnHover ?? false,
    
    // NEW: Carousel Text Settings
    carouselTitle: data.carouselTitle || 'Publicidad',
    enableScrollingText: data.enableScrollingText ?? false,
    scrollingSpeed: data.scrollingSpeed || 5,
    
    // Metadata
    isActive: data.isActive ?? true,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
};

export const nodeConfigurationService = {
  // Get node configuration (there should be only one main configuration)
  async getNodeConfiguration(): Promise<NodeConfiguration | null> {
    try {
      const q = query(
        collection(db, 'nodeConfigurations'),
        where('isActive', '==', true),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create default configuration if none exists
        return await this.createDefaultConfiguration();
      }
      
      return convertFirestoreNodeConfiguration(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error getting node configuration:', error);
      return null;
    }
  },

  // Create default node configuration
  async createDefaultConfiguration(): Promise<NodeConfiguration> {
    try {
      console.log('🔧 Creating default node configuration in Firebase...');
      
      const defaultData = {
        // Display Settings
        autoRotationInterval: 5000,
        showQueueInfo: true,
        showCompanyLogo: true,
        maxTicketsDisplayed: 6,
        showDateTime: true,
        showConnectionStatus: true,
        showHeader: true,
        showCarousel: true, // NEW: Default to show carousel
        compactMode: false,
        
        // Audio Settings
        enableAudio: true,
        audioVolume: 0.8,
        selectedVoice: 'auto-female',
        speechRate: 0.75,
        
        // Visual Settings
        backgroundColor: '#F1F5F9',
        headerColor: '#3B82F6',
        textColor: '#1F2937',
        accentColor: '#10B981',
        
        // Animation Settings
        enableAnimations: true,
        highlightDuration: 10000,
        transitionDuration: 1000,
        
        // Content Settings
        showImageDescriptions: true,
        showImageIndicators: true,
        pauseOnHover: false,
        
        // NEW: Carousel Text Settings
        carouselTitle: 'Publicidad',
        enableScrollingText: false,
        scrollingSpeed: 5,
        
        // Metadata
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      };
      
      const docRef = await addDoc(collection(db, 'nodeConfigurations'), defaultData);
      
      console.log('✅ Default node configuration created with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...defaultData,
        createdBy: undefined,
        updatedBy: undefined,
      };
    } catch (error) {
      console.error('Error creating default node configuration:', error);
      throw new Error('Failed to create default node configuration');
    }
  },

  // Update node configuration
  async updateNodeConfiguration(configId: string, updates: Partial<NodeConfiguration>): Promise<void> {
    try {
      console.log('💾 Updating node configuration in Firebase:', configId);
      console.log('📊 Updates to apply:', updates);
      
      const configRef = doc(db, 'nodeConfigurations', configId);
      const updateData: any = { ...updates };
      
      // Convert undefined to null for Firestore
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          updateData[key] = null;
        }
      });
      
      updateData.updatedAt = new Date();
      
      await updateDoc(configRef, updateData);
      
      console.log('✅ Node configuration updated successfully in Firebase');
    } catch (error) {
      console.error('❌ Error updating node configuration:', error);
      throw new Error('Failed to update node configuration');
    }
  },

  // Subscribe to node configuration changes (real-time)
  subscribeToNodeConfiguration(callback: (config: NodeConfiguration | null) => void): () => void {
    const q = query(
      collection(db, 'nodeConfigurations'),
      where('isActive', '==', true),
      limit(1)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        callback(null);
      } else {
        const config = convertFirestoreNodeConfiguration(querySnapshot.docs[0]);
        console.log('🔄 Node configuration updated from Firebase:', config);
        callback(config);
      }
    }, (error) => {
      console.error('Error in node configuration subscription:', error);
    });
  },

  // Create a complete configuration update (for saving all settings at once)
  async saveCompleteConfiguration(config: Partial<NodeConfiguration>): Promise<void> {
    try {
      console.log('💾 SAVING COMPLETE NODE CONFIGURATION TO FIREBASE...');
      console.log('📊 Complete configuration to save:', config);
      
      // Get existing configuration
      const existingConfig = await this.getNodeConfiguration();
      
      if (existingConfig) {
        // Update existing configuration
        await this.updateNodeConfiguration(existingConfig.id, config);
      } else {
        // Create new configuration with provided data
        const completeConfig = {
          // Display Settings
          autoRotationInterval: config.autoRotationInterval || 5000,
          showQueueInfo: config.showQueueInfo ?? true,
          showCompanyLogo: config.showCompanyLogo ?? true,
          maxTicketsDisplayed: config.maxTicketsDisplayed || 6,
          showDateTime: config.showDateTime ?? true,
          showConnectionStatus: config.showConnectionStatus ?? true,
          showHeader: config.showHeader ?? true,
          showCarousel: config.showCarousel ?? true, // NEW: Carousel visibility
          compactMode: config.compactMode ?? false,
          
          // Audio Settings
          enableAudio: config.enableAudio ?? true,
          audioVolume: config.audioVolume || 0.8,
          selectedVoice: config.selectedVoice || 'auto-female',
          speechRate: config.speechRate || 0.75,
          
          // Visual Settings
          backgroundColor: config.backgroundColor || '#F1F5F9',
          headerColor: config.headerColor || '#3B82F6',
          textColor: config.textColor || '#1F2937',
          accentColor: config.accentColor || '#10B981',
          
          // Animation Settings
          enableAnimations: config.enableAnimations ?? true,
          highlightDuration: config.highlightDuration || 10000,
          transitionDuration: config.transitionDuration || 1000,
          
          // Content Settings
          showImageDescriptions: config.showImageDescriptions ?? true,
          showImageIndicators: config.showImageIndicators ?? true,
          pauseOnHover: config.pauseOnHover ?? false,
          
          // NEW: Carousel Text Settings
          carouselTitle: config.carouselTitle || 'Publicidad',
          enableScrollingText: config.enableScrollingText ?? false,
          scrollingSpeed: config.scrollingSpeed || 5,
          
          // Metadata
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
        };
        
        await addDoc(collection(db, 'nodeConfigurations'), completeConfig);
      }
      
      console.log('✅ COMPLETE NODE CONFIGURATION SAVED SUCCESSFULLY TO FIREBASE');
    } catch (error) {
      console.error('❌ ERROR SAVING COMPLETE NODE CONFIGURATION:', error);
      throw error;
    }
  }
};