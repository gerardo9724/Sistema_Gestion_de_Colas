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
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { ServiceCategory, ServiceSubcategory } from '../types';

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

export const serviceService = {
  // Get all service categories with subcategories
  async getAllServiceCategories(): Promise<ServiceCategory[]> {
    try {
      // Get categories
      const categoriesQuery = query(
        collection(db, 'serviceCategories'),
        orderBy('displayOrder', 'asc')
      );
      
      const categoriesSnapshot = await getDocs(categoriesQuery);
      
      // Get subcategories for each category
      const categories = await Promise.all(
        categoriesSnapshot.docs.map(async (categoryDoc) => {
          const categoryData = categoryDoc.data();
          
          const subcategoriesQuery = query(
            collection(db, 'serviceSubcategories'),
            where('serviceCategoryId', '==', categoryDoc.id),
            orderBy('displayOrder', 'asc')
          );
          
          const subcategoriesSnapshot = await getDocs(subcategoriesQuery);
          
          const subcategories: ServiceSubcategory[] = subcategoriesSnapshot.docs.map(subDoc => {
            const subData = subDoc.data();
            return {
              id: subDoc.id,
              serviceCategoryId: categoryDoc.id,
              name: subData.name,
              identifier: subData.identifier,
              description: subData.description || undefined,
              isActive: subData.isActive ?? true,
              displayOrder: subData.displayOrder || 0,
              estimatedTime: subData.estimatedTime || undefined,
              createdAt: timestampToDate(subData.createdAt),
            };
          });
          
          return {
            id: categoryDoc.id,
            name: categoryData.name,
            identifier: categoryData.identifier,
            description: categoryData.description || undefined,
            isActive: categoryData.isActive ?? true,
            displayOrder: categoryData.displayOrder || 0,
            icon: categoryData.icon || undefined,
            color: categoryData.color || undefined,
            createdAt: timestampToDate(categoryData.createdAt),
            subcategories,
          };
        })
      );
      
      return categories;
    } catch (error) {
      console.error('Error getting service categories:', error);
      return [];
    }
  },

  // Subscribe to service categories changes (real-time)
  subscribeToServiceCategories(callback: (categories: ServiceCategory[]) => void): () => void {
    const categoriesQuery = query(
      collection(db, 'serviceCategories'),
      orderBy('displayOrder', 'asc')
    );
    
    return onSnapshot(categoriesQuery, async (categoriesSnapshot) => {
      try {
        const categories = await Promise.all(
          categoriesSnapshot.docs.map(async (categoryDoc) => {
            const categoryData = categoryDoc.data();
            
            const subcategoriesQuery = query(
              collection(db, 'serviceSubcategories'),
              where('serviceCategoryId', '==', categoryDoc.id),
              orderBy('displayOrder', 'asc')
            );
            
            const subcategoriesSnapshot = await getDocs(subcategoriesQuery);
            
            const subcategories: ServiceSubcategory[] = subcategoriesSnapshot.docs.map(subDoc => {
              const subData = subDoc.data();
              return {
                id: subDoc.id,
                serviceCategoryId: categoryDoc.id,
                name: subData.name,
                identifier: subData.identifier,
                description: subData.description || undefined,
                isActive: subData.isActive ?? true,
                displayOrder: subData.displayOrder || 0,
                estimatedTime: subData.estimatedTime || undefined,
                createdAt: timestampToDate(subData.createdAt),
              };
            });
            
            return {
              id: categoryDoc.id,
              name: categoryData.name,
              identifier: categoryData.identifier,
              description: categoryData.description || undefined,
              isActive: categoryData.isActive ?? true,
              displayOrder: categoryData.displayOrder || 0,
              icon: categoryData.icon || undefined,
              color: categoryData.color || undefined,
              createdAt: timestampToDate(categoryData.createdAt),
              subcategories,
            };
          })
        );
        
        callback(categories);
      } catch (error) {
        console.error('Error in service categories subscription:', error);
      }
    }, (error) => {
      console.error('Error in service categories subscription:', error);
    });
  },

  // Create service category
  async createServiceCategory(name: string, identifier: string): Promise<ServiceCategory> {
    try {
      const categoryData = {
        name,
        identifier: identifier.toUpperCase(),
        description: null,
        isActive: true,
        displayOrder: 0,
        icon: null,
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'serviceCategories'), categoryData);
      
      return {
        id: docRef.id,
        ...categoryData,
        subcategories: [],
      };
    } catch (error) {
      console.error('Error creating service category:', error);
      throw new Error('Failed to create service category');
    }
  },

  // Update service category
  async updateServiceCategory(categoryId: string, updates: Partial<ServiceCategory>): Promise<void> {
    try {
      const categoryRef = doc(db, 'serviceCategories', categoryId);
      const updateData: any = { ...updates };
      
      // Convert undefined to null for Firestore
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          updateData[key] = null;
        }
      });
      
      updateData.updatedAt = new Date();
      
      await updateDoc(categoryRef, updateData);
    } catch (error) {
      console.error('Error updating service category:', error);
      throw new Error('Failed to update service category');
    }
  },

  // Delete service category
  async deleteServiceCategory(categoryId: string): Promise<void> {
    try {
      // First check if there are any subcategories
      const subcategoriesQuery = query(
        collection(db, 'serviceSubcategories'),
        where('serviceCategoryId', '==', categoryId)
      );
      
      const subcategoriesSnapshot = await getDocs(subcategoriesQuery);
      
      if (!subcategoriesSnapshot.empty) {
        throw new Error('Cannot delete service category with existing subcategories');
      }
      
      await deleteDoc(doc(db, 'serviceCategories', categoryId));
    } catch (error) {
      console.error('Error deleting service category:', error);
      throw error;
    }
  },

  // Create service subcategory
  async createServiceSubcategory(
    serviceCategoryId: string, 
    name: string, 
    identifier: string
  ): Promise<ServiceSubcategory> {
    try {
      const subcategoryData = {
        serviceCategoryId,
        name,
        identifier: identifier.toUpperCase(),
        description: null,
        isActive: true,
        displayOrder: 0,
        estimatedTime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'serviceSubcategories'), subcategoryData);
      
      return {
        id: docRef.id,
        ...subcategoryData,
      };
    } catch (error) {
      console.error('Error creating service subcategory:', error);
      throw new Error('Failed to create service subcategory');
    }
  },

  // Update service subcategory
  async updateServiceSubcategory(subcategoryId: string, updates: Partial<ServiceSubcategory>): Promise<void> {
    try {
      const subcategoryRef = doc(db, 'serviceSubcategories', subcategoryId);
      const updateData: any = { ...updates };
      
      // Convert undefined to null for Firestore
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          updateData[key] = null;
        }
      });
      
      updateData.updatedAt = new Date();
      
      await updateDoc(subcategoryRef, updateData);
    } catch (error) {
      console.error('Error updating service subcategory:', error);
      throw new Error('Failed to update service subcategory');
    }
  },

  // Delete service subcategory
  async deleteServiceSubcategory(subcategoryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'serviceSubcategories', subcategoryId));
    } catch (error) {
      console.error('Error deleting service subcategory:', error);
      throw new Error('Failed to delete service subcategory');
    }
  }
};