import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { CarouselImage } from '../types';

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

// Convert carousel image data from Firestore
const convertFirestoreCarouselImage = (doc: any): CarouselImage => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    url: data.url,
    description: data.description || undefined,
    isActive: data.isActive ?? true,
    displayOrder: data.displayOrder || 0,
    displayDuration: data.displayDuration || undefined,
    uploadedAt: timestampToDate(data.uploadedAt),
    createdBy: data.createdBy || undefined,
  };
};

export const carouselService = {
  // Get all carousel images
  async getAllCarouselImages(): Promise<CarouselImage[]> {
    try {
      const q = query(
        collection(db, 'carouselImages'),
        orderBy('displayOrder', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(convertFirestoreCarouselImage);
    } catch (error) {
      console.error('Error getting carousel images:', error);
      return [];
    }
  },

  // Create a new carousel image
  async createCarouselImage(imageData: {
    name: string;
    url: string;
    description?: string;
  }): Promise<CarouselImage> {
    try {
      const data = {
        name: imageData.name,
        url: imageData.url,
        description: imageData.description || null,
        isActive: true,
        displayOrder: 0,
        displayDuration: 5000, // 5 seconds default
        uploadedAt: new Date(),
        createdBy: null,
      };
      
      const docRef = await addDoc(collection(db, 'carouselImages'), data);
      
      return {
        id: docRef.id,
        ...data,
        description: data.description || undefined,
        createdBy: undefined,
      };
    } catch (error) {
      console.error('Error creating carousel image:', error);
      throw new Error('Failed to create carousel image');
    }
  },

  // Delete carousel image
  async deleteCarouselImage(imageId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'carouselImages', imageId));
    } catch (error) {
      console.error('Error deleting carousel image:', error);
      throw new Error('Failed to delete carousel image');
    }
  },

  // Subscribe to carousel images changes (real-time)
  subscribeToCarouselImages(callback: (images: CarouselImage[]) => void): () => void {
    const q = query(
      collection(db, 'carouselImages'),
      orderBy('displayOrder', 'asc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const images = querySnapshot.docs.map(convertFirestoreCarouselImage);
      callback(images);
    }, (error) => {
      console.error('Error in carousel images subscription:', error);
    });
  }
};