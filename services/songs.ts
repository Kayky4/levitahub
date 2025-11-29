import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Song, SongSection, UserRole } from './types';

const COLLECTION_NAME = 'songs';

export const getBandSongs = async (bandId: string): Promise<Song[]> => {
  const q = query(
    collection(db, `bands/${bandId}/${COLLECTION_NAME}`),
    orderBy('title', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
};

export const getSong = async (bandId: string, songId: string): Promise<Song | null> => {
  const docRef = doc(db, `bands/${bandId}/${COLLECTION_NAME}`, songId);
  const snap = await getDoc(docRef);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Song) : null;
};

export const createSong = async (
  bandId: string, 
  data: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, `bands/${bandId}/${COLLECTION_NAME}`), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateSong = async (
  bandId: string, 
  songId: string, 
  data: Partial<Omit<Song, 'id' | 'createdAt'>>
): Promise<void> => {
  const docRef = doc(db, `bands/${bandId}/${COLLECTION_NAME}`, songId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const deleteSong = async (bandId: string, songId: string): Promise<void> => {
  await deleteDoc(doc(db, `bands/${bandId}/${COLLECTION_NAME}`, songId));
};

// Permissions Logic
export const canEditMusic = (role: UserRole): boolean => {
  return ['leader', 'vice', 'regente'].includes(role);
};
