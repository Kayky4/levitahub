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
  serverTimestamp,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from './firebase';
import { Song, SongSection, UserRole } from './types';

const COLLECTION_NAME = 'songs';

export const getBandSongs = async (
  bandId: string,
  lastDoc: any = null,
  limitCount: number = 20
): Promise<{ songs: Song[], lastDoc: any }> => {
  let q = query(
    collection(db, `bands/${bandId}/${COLLECTION_NAME}`),
    orderBy('title', 'asc'),
    limit(limitCount)
  );

  if (lastDoc) {
    // @ts-ignore - Firebase types can be tricky with startAfter
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);

  const songs = snapshot.docs.map(doc => {
    const s = { id: doc.id, ...doc.data() } as Song;
    if ((!s.sections || s.sections.length === 0) && s.content) {
      s.sections = [{ id: 'legacy', index: 0, name: 'Geral', content: s.content }];
    }
    return s;
  });

  return {
    songs,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
  };
};

export const getSong = async (bandId: string, songId: string): Promise<Song | null> => {
  const docRef = doc(db, `bands/${bandId}/${COLLECTION_NAME}`, songId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;

  const song = { id: snap.id, ...snap.data() } as Song;

  // ROBUST FIX: Normalize Legacy Data (Missing sections but has content)
  // This prevents blank screens if sections array is missing/empty
  if ((!song.sections || song.sections.length === 0) && song.content) {
    song.sections = [{
      id: 'legacy-section-auto',
      index: 0,
      name: 'Arquivo Completo',
      content: song.content,
      cues: ''
    }];
  }

  // Ensure sections is at least an empty array to prevent crashes in maps
  if (!song.sections) {
    song.sections = [];
  }

  return song;
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