import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { RegencySession, UserRole } from './types';

const REGENCY_PATH = (bandId: string) => `bands/${bandId}/regency/session`;

// --- Permissions ---
export const canControlRegency = (role: UserRole): boolean => {
  return ['leader', 'vice', 'regente'].includes(role);
};

// --- Actions ---

export const startSession = async (
  bandId: string,
  playlistId?: string,
  initialSongId?: string
): Promise<{ created: boolean; session: RegencySession }> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const sessionRef = doc(db, REGENCY_PATH(bandId));
  const now = new Date().toISOString();

  const snap = await getDoc(sessionRef);

  if (snap.exists()) {
    const data = snap.data() as RegencySession;

    // Check if we should RESUME the existing session
    // Condition: Session is Active AND (No specific playlist requested OR requested playlist matches active)
    if (data.isActive) {
      const isSameContext = !playlistId || playlistId === data.playlistId;

      if (isSameContext) {
        console.log("Regency: Resuming/Taking over existing session.");

        // Update leader info and timestamp, but KEEP other state (song, scroll, etc.)
        const updates: Partial<RegencySession> = {
          leaderId: user.uid,
          leaderName: user.displayName || "Líder",
          updatedAt: now
        };

        await updateDoc(sessionRef, updates);

        // Return the CURRENT (merged) state so the UI can hydrate immediately
        return {
          created: false,
          session: { ...data, ...updates }
        };
      }
    }
  }

  // Start FRESH session (Reset everything)
  const sessionData: RegencySession = {
    isActive: true,
    currentSongId: initialSongId || null,
    currentSectionIndex: initialSongId ? 0 : null,
    transposeAmount: 0,
    scrollState: {
      isPlaying: false,
      speed: 20,
    },
    cue: null,
    leaderId: user.uid,
    leaderName: user.displayName || "Regente",
    updatedAt: now,
    playlistId: playlistId || null
  };

  await setDoc(sessionRef, sessionData);
  return { created: true, session: sessionData };
};

export const endSession = async (bandId: string): Promise<void> => {
  const sessionRef = doc(db, REGENCY_PATH(bandId));
  await updateDoc(sessionRef, {
    isActive: false,
    currentSongId: null,
    currentSectionIndex: null,
    transposeAmount: 0,
    scrollState: { isPlaying: false, speed: 0 },
    cue: null,
    leaderId: null,
    updatedAt: new Date().toISOString()
  });
};

export const setCurrentSong = async (bandId: string, songId: string, defaultKey?: string): Promise<void> => {
  const sessionRef = doc(db, REGENCY_PATH(bandId));
  await updateDoc(sessionRef, {
    currentSongId: songId,
    currentSectionIndex: 0,
    transposeAmount: 0,
    'scrollState.isPlaying': false, // Stop scrolling on new song
    cue: null,
    updatedAt: new Date().toISOString()
  });
};

export const setTranspose = async (bandId: string, amount: number): Promise<void> => {
  const sessionRef = doc(db, REGENCY_PATH(bandId));
  await updateDoc(sessionRef, {
    transposeAmount: amount,
    updatedAt: new Date().toISOString()
  });
};

export const setCurrentSection = async (bandId: string, index: number): Promise<void> => {
  const sessionRef = doc(db, REGENCY_PATH(bandId));
  await updateDoc(sessionRef, {
    currentSectionIndex: index,
    updatedAt: new Date().toISOString()
  });
};

// --- Teleprompter Controls ---

export const toggleScrollPlay = async (bandId: string, isPlaying: boolean): Promise<void> => {
  const sessionRef = doc(db, REGENCY_PATH(bandId));
  // Use dot notation to update nested field without overwriting the whole object
  await updateDoc(sessionRef, {
    'scrollState.isPlaying': isPlaying,
    updatedAt: new Date().toISOString()
  });
};

export const setScrollSpeed = async (bandId: string, speed: number): Promise<void> => {
  const sessionRef = doc(db, REGENCY_PATH(bandId));
  await updateDoc(sessionRef, {
    'scrollState.speed': speed,
    updatedAt: new Date().toISOString()
  });
};

export const syncScrollPosition = async (bandId: string, scrollTop: number): Promise<void> => {
  const sessionRef = doc(db, REGENCY_PATH(bandId));
  await updateDoc(sessionRef, {
    'scrollState.scrollTop': scrollTop
  });
};

export const sendCue = async (bandId: string, message: string, type: 'preset' | 'custom' = 'preset'): Promise<void> => {
  const sessionRef = doc(db, REGENCY_PATH(bandId));
  await updateDoc(sessionRef, {
    cue: {
      id: crypto.randomUUID(),
      type,
      message,
      createdAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  });
};

// --- Listener ---

export const subscribeToSession = (bandId: string, callback: (session: RegencySession | null) => void) => {
  const sessionRef = doc(db, REGENCY_PATH(bandId));

  return onSnapshot(sessionRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure backward compatibility with sessions without scrollState
      const safeData = {
        ...data,
        transposeAmount: data.transposeAmount || 0,
        scrollState: data.scrollState || { isPlaying: false, speed: 0 }
      } as RegencySession;
      callback(safeData);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Regency listener error:", error);
    callback(null);
  });
};