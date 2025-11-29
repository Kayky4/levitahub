import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc, 
  deleteField, 
  serverTimestamp, 
  writeBatch, 
  increment 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Band, BandMember, UserRole, UserProfile, BandUpdateData, BandBilling } from './types';

// Helper to generate random code like BANDA-X92Z
const generateBandCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BANDA-${result}`;
};

// --- BAND MANAGEMENT ---

export const createBand = async (name: string, city: string, themeColor?: string, description?: string): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const batch = writeBatch(db);
  const bandRef = doc(collection(db, 'bands'));
  const bandId = bandRef.id;
  const code = generateBandCode();
  const now = new Date().toISOString();

  // 1. Create Band Document
  const bandData: Band = {
    id: bandId,
    name,
    city,
    description: description || '',
    style: '', // Deprecated but keeping empty string for schema consistency
    code,
    ownerId: user.uid,
    createdAt: now,
    memberCount: 1,
    themeColor: themeColor || 'from-indigo-600 via-purple-600 to-pink-500',
    logoSymbol: name.substring(0, 2).toUpperCase() // Default logo symbol
  };
  batch.set(bandRef, bandData);

  // 2. Add User as Leader in Band's subcollection
  const memberRef = doc(db, `bands/${bandId}/members`, user.uid);
  const memberData: BandMember = {
    userId: user.uid,
    name: user.displayName || "Unknown",
    email: user.email || "",
    role: 'leader',
    joinedAt: now
  };
  batch.set(memberRef, memberData);

  // 3. Update User Profile (Create if doesn't exist, or update)
  const userRef = doc(db, 'users', user.uid);
  batch.set(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    bands: {
      [bandId]: {
        role: 'leader',
        name: name
      }
    }
  }, { merge: true });

  // 4. Initialize Billing Document
  // Using 'subscription' as doc ID inside 'billing' subcollection matching services/billing.ts
  const billingDocRef = doc(db, `bands/${bandId}/billing`, 'subscription'); 
  const billingData: BandBilling = {
    subscriptionStatus: 'inactive',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    trialEndsAt: null,
    currentPeriodEnd: null,
    pastDueAt: null,
    graceEndsAt: null,
    updatedAt: now
  };
  batch.set(billingDocRef, billingData);

  await batch.commit();
  return bandId;
};

export const joinBand = async (code: string, instrument?: string): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // 1. Find Band by Code
  const q = query(collection(db, 'bands'), where('code', '==', code));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Banda não encontrada com este código.");
  }

  const bandDoc = querySnapshot.docs[0];
  const band = bandDoc.data() as Band;
  const bandId = band.id;

  // 2. Check if already a member
  const memberRef = doc(db, `bands/${bandId}/members`, user.uid);
  const memberSnap = await getDoc(memberRef);

  if (memberSnap.exists()) {
    return bandId; // Already joined, just redirect
  }

  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // 3. Add Member
  const memberData: BandMember = {
    userId: user.uid,
    name: user.displayName || user.email || "Member",
    email: user.email || "",
    role: 'musico', // Default role
    instrument: instrument || "Vocal",
    joinedAt: now
  };
  batch.set(memberRef, memberData);

  // 4. Update Band Member Count
  batch.update(bandDoc.ref, {
    memberCount: increment(1)
  });

  // 5. Update User Profile
  const userRef = doc(db, 'users', user.uid);
  batch.set(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    bands: {
      [bandId]: {
        role: 'musico',
        name: band.name
      }
    }
  }, { merge: true });

  await batch.commit();
  return bandId;
};

export const updateBand = async (bandId: string, data: BandUpdateData) => {
  const bandRef = doc(db, 'bands', bandId);
  await updateDoc(bandRef, { ...data });
};

export const deleteBand = async (bandId: string) => {
  const members = await getBandMembers(bandId);
  const batch = writeBatch(db);

  // 1. Delete Band
  const bandRef = doc(db, 'bands', bandId);
  batch.delete(bandRef);

  // 2. Remove band reference from all members
  members.forEach(member => {
    const userRef = doc(db, 'users', member.userId);
    batch.update(userRef, {
      [`bands.${bandId}`]: deleteField()
    });
  });

  await batch.commit();
};

export const getUserBands = async (): Promise<UserProfile['bands']> => {
  const user = auth.currentUser;
  if (!user) return {};

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      return data.bands || {};
    }
  } catch (error: any) {
    console.warn("Error fetching user bands:", error.message);
    return {};
  }
  return {};
};

export const getBandDetails = async (bandId: string): Promise<Band | null> => {
  const docRef = doc(db, 'bands', bandId);
  const snap = await getDoc(docRef);
  return snap.exists() ? (snap.data() as Band) : null;
};

// --- MEMBER MANAGEMENT ---

export const getBandMembers = async (bandId: string): Promise<BandMember[]> => {
  const q = query(collection(db, `bands/${bandId}/members`));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as BandMember);
};

export const updateMemberRole = async (bandId: string, memberId: string, newRole: UserRole) => {
  const batch = writeBatch(db);

  // Update Member Subdoc
  const memberRef = doc(db, `bands/${bandId}/members`, memberId);
  batch.update(memberRef, { role: newRole });

  // Update User Profile Denormalized Data
  const userRef = doc(db, 'users', memberId);
  batch.update(userRef, {
    [`bands.${bandId}.role`]: newRole
  });

  await batch.commit();
};

export const removeMember = async (bandId: string, memberId: string) => {
  const batch = writeBatch(db);

  // Delete Member Subdoc
  const memberRef = doc(db, `bands/${bandId}/members`, memberId);
  batch.delete(memberRef);

  // Update Band Count
  const bandRef = doc(db, 'bands', bandId);
  batch.update(bandRef, { memberCount: increment(-1) });

  // Remove from User Profile
  const userRef = doc(db, 'users', memberId);
  
  batch.update(userRef, {
    [`bands.${bandId}`]: deleteField()
  });

  await batch.commit();
};

// --- PERMISSIONS HELPER ---

export const canManageMembers = (currentUserRole: UserRole, targetMemberRole: UserRole): boolean => {
  const hierarchy = { leader: 3, vice: 2, regente: 1, musico: 0 };
  if (hierarchy[currentUserRole] < 2) return false;
  return hierarchy[currentUserRole] > hierarchy[targetMemberRole];
};

export const canEditBand = (currentUserRole: UserRole): boolean => {
  return currentUserRole === 'leader' || currentUserRole === 'vice';
};

export const canDeleteBand = (currentUserRole: UserRole): boolean => {
  return currentUserRole === 'leader';
};