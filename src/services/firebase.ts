import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase';

// Initialize Firebase once and share the instances.
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
