// @ts-ignore
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';

export const registerUser = async (name: string, email: string, pass: string): Promise<UserCredential> => {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);

  if (auth.currentUser) {
    await updateProfile(auth.currentUser, {
      displayName: name
    });

    // Create the user document in Firestore immediately
    // This prevents "Missing or insufficient permissions" when trying to read non-existent doc
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userData: UserProfile = {
      uid: auth.currentUser.uid,
      email: email,
      displayName: name,
      bands: {}, // Empty bands map
      createdAt: new Date().toISOString()
    };
    await setDoc(userRef, userData);
  }
  return credential;
};

export const loginUser = async (email: string, pass: string): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const logout = async (): Promise<void> => {
  return await signOut(auth);
};