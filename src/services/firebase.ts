import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDI4aaQkOyTUD080OxXEH8VgdAbM8mRHOE",
  authDomain: "sistema-gestion-cola.firebaseapp.com",
  projectId: "sistema-gestion-cola",
  storageBucket: "sistema-gestion-cola.firebasestorage.app",
  messagingSenderId: "479556988706",
  appId: "1:479556988706:web:5226f137e75561e199bf7b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Test connection function
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const testDoc = await getDoc(doc(db, 'test', 'connection'));
    console.log('✅ Firebase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};

export default app;