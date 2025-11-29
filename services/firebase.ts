// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Safely access environment variables
const env = (import.meta as any).env || {};

// Configuration provided in instructions
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAVQ1HjKFyzxKrioLXlqfTuFcBua4JcdpM",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "mvp1-levitahub.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "mvp1-levitahub",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "mvp1-levitahub.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "19540533890",
  appId: env.VITE_FIREBASE_APP_ID || "1:19540533890:web:6db2a9cee6c045edb20a9b",
  measurementId: "G-0DDSCTGKNT"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;