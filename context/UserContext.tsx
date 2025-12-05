import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// @ts-ignore
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteField, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { registerUser, loginUser, logout } from '../services/auth';
import { UserContextType, UserProfile } from '../services/types';

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);

      if (currentUser) {
        // Real-time listener for User Profile
        const userRef = doc(db, 'users', currentUser.uid);

        // Unsubscribe previous listener if exists
        if (unsubscribeProfile) unsubscribeProfile();

        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);

            // --- SELF-HEALING: Validate Bands ---
            if (profile.bands) {
              const bandsToRemove: string[] = [];

              // Check validity of each band membership
              await Promise.all(Object.keys(profile.bands).map(async (bandId) => {
                try {
                  const memberRef = doc(db, `bands/${bandId}/members`, currentUser.uid);
                  const memberSnap = await getDoc(memberRef);

                  if (!memberSnap.exists()) {
                    bandsToRemove.push(bandId);
                  }
                } catch (error) {
                  console.warn(`Error validating band ${bandId}, marking for removal`, error);
                  bandsToRemove.push(bandId);
                }
              }));

              // Apply fixes if needed
              if (bandsToRemove.length > 0) {
                console.log('Self-healing: Removing ghost bands:', bandsToRemove);
                const updates: any = {};
                bandsToRemove.forEach(bid => {
                  updates[`bands.${bid}`] = deleteField();
                });

                // This update will trigger onSnapshot again, but next time bandsToRemove will be empty
                await updateDoc(userRef, updates);
              }
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setLoading(false);
        });

      } else {
        setUserProfile(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    await loginUser(email, pass);
  };

  const signUp = async (name: string, email: string, pass: string) => {
    await registerUser(name, email, pass);
  };

  const signOutUser = async () => {
    await logout();
    setUserProfile(null);
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOutUser
  };

  return (
    <UserContext.Provider value={value}>
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};