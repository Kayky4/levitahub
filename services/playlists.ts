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
  where,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Playlist, PlaylistSong, UserRole } from './types';

const COLLECTION_NAME = 'playlists';

export const getBandPlaylists = async (bandId: string): Promise<Playlist[]> => {
  const q = query(
    collection(db, `bands/${bandId}/${COLLECTION_NAME}`),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist));
};

export const getNextBandEvent = async (bandId: string): Promise<Playlist | null> => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const q = query(
    collection(db, `bands/${bandId}/${COLLECTION_NAME}`),
    where('date', '>=', today),
    orderBy('date', 'asc'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Playlist;
};

export const getPlaylist = async (bandId: string, playlistId: string): Promise<Playlist | null> => {
  const docRef = doc(db, `bands/${bandId}/${COLLECTION_NAME}`, playlistId);
  const snap = await getDoc(docRef);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Playlist) : null;
};

export const createPlaylist = async (
  bandId: string, 
  data: Omit<Playlist, 'id' | 'createdAt' | 'songs'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, `bands/${bandId}/${COLLECTION_NAME}`), {
    ...data,
    songs: [],
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updatePlaylist = async (
  bandId: string, 
  playlistId: string, 
  data: Partial<Omit<Playlist, 'id' | 'createdAt'>>
): Promise<void> => {
  const docRef = doc(db, `bands/${bandId}/${COLLECTION_NAME}`, playlistId);
  await updateDoc(docRef, data);
};

export const deletePlaylist = async (bandId: string, playlistId: string): Promise<void> => {
  await deleteDoc(doc(db, `bands/${bandId}/${COLLECTION_NAME}`, playlistId));
};

export const updatePlaylistOrder = async (
  bandId: string, 
  playlistId: string, 
  songs: PlaylistSong[]
): Promise<void> => {
  const docRef = doc(db, `bands/${bandId}/${COLLECTION_NAME}`, playlistId);
  
  // Re-index order just in case
  const reindexedSongs = songs.map((s, idx) => ({ ...s, order: idx }));
  
  await updateDoc(docRef, { songs: reindexedSongs });
};

// Permissions Logic
export const canManagePlaylists = (role: UserRole): boolean => {
  return ['leader', 'vice', 'regente'].includes(role);
};