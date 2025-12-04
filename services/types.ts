
// @ts-ignore
import { User as FirebaseUser } from 'firebase/auth';

export interface UserContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

export interface AuthError {
  code: string;
  message: string;
}

// --- PHASE 2 TYPES ---

export type UserRole = 'leader' | 'vice' | 'regente' | 'musico';

export interface BandMember {
  userId: string;
  name: string; // Denormalized for display
  email: string; // Denormalized for display
  role: UserRole;
  instrument?: string;
  joinedAt: string; // ISO String
}

export interface Band {
  id: string;
  name: string;
  city?: string;
  description?: string; // New: General info
  style?: string; // Deprecated but kept for type safety with old data
  code: string; // Unique Join Code
  ownerId: string;
  createdAt: string;
  memberCount: number;
  themeColor?: string; // Visual Identity (Gradient classes)
  logoSymbol?: string; // New: Custom 1-2 char symbol for the logo
}

export interface BandUpdateData {
  name?: string;
  city?: string;
  description?: string;
  style?: string;
  themeColor?: string;
  logoSymbol?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  bio?: string; // New: Global Bio
  instruments?: string[]; // New: Global Instruments list
  bands: {
    [bandId: string]: {
      role: UserRole;
      name: string;
    };
  };
}

// --- PHASE 3 TYPES (MUSICAL MODULE) ---

export interface SongSection {
  id: string; // UUID for internal reference
  index: number;
  name: string; // e.g., "Intro", "Chorus", "Verse 1"
  content: string; // The chords/lyrics
  cues?: string; // Optional instructions for HUD
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string; // Musical key (e.g., "G", "Cm")
  bpm?: number;
  content?: string; // Raw legacy content backup
  sections: SongSection[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistSong {
  songId: string;
  title: string;
  artist: string;
  key: string;
  order: number;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  date: string; // Scheduled date for the event
  songs: PlaylistSong[];
}

// --- PHASE 4 TYPES (REGENCY MODE) ---

export interface RegencyCue {
  id: string;
  type: 'preset' | 'custom';
  message: string;
  createdAt: string; // ISO timestamp
}

export interface ScrollState {
  isPlaying: boolean;
  speed: number; // 0 to 100 (percentage of max speed)
  targetY?: number; // Optional: For snap scrolling
  scrollTop?: number; // For sync
}

export interface RegencySession {
  isActive: boolean;
  currentSongId: string | null;
  currentSectionIndex: number | null;
  transposeAmount: number;
  scrollState: ScrollState; // NEW: Teleprompter state
  cue: RegencyCue | null;
  leaderId: string | null;
  leaderName?: string;
  updatedAt: string; // ISO timestamp
  playlistId?: string | null; // Optional: If running from a playlist
}

// --- PHASE 5 TYPES (BILLING & SUBSCRIPTION) ---

export type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'blocked';

export interface BandBilling {
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: number | null; // Timestamp in ms
  currentPeriodEnd: number | null; // Timestamp in ms
  pastDueAt: number | null; // Timestamp in ms
  graceEndsAt: number | null; // Timestamp in ms
  updatedAt: string; // ISO
}

// Webhook Event Types (Mock)
export interface MockStripeEvent {
  id: string;
  type: 'checkout.session.completed' | 'invoice.paid' | 'invoice.payment_failed' | 'customer.subscription.updated' | 'customer.subscription.deleted';
  data: {
    object: any;
  };
  created: number;
}

export interface BillingLog {
  id: string;
  eventId: string;
  type: string;
  status: string;
  details: string;
  createdAt: string;
}