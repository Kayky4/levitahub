import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// @ts-ignore
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { registerUser, loginUser, logout } from '../services/auth';
import { UserContextType } from '../services/types';

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    await loginUser(email, pass);
  };

  const signUp = async (name: string, email: string, pass: string) => {
    await registerUser(name, email, pass);
  };

  const signOutUser = async () => {
    await logout();
  };

  const value = {
    user,
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