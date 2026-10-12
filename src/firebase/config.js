import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBh7STRfeihAxrgFpT50QMT1EoDn6wtLOs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'korvil-task-flow.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'korvil-task-flow',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'korvil-task-flow.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '849448339064',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:849448339064:web:1031b05d5813d70cc74f8d',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Pre-configured admin emails
export const INITIAL_ADMIN_EMAILS = [
  'janaganmeenambikai@gmail.com',
  'mithunsabari.rms@gmail.com',
];

// Primary admin who can manage other admins
export const PRIMARY_ADMIN_EMAIL = 'janaganmeenambikai@gmail.com';
