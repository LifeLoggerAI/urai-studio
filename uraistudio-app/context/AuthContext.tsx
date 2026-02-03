'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseClient';
import { StudioUser } from '@/lib/types';

interface AuthContextType {
  user: FirebaseUser | null;
  studioUser: StudioUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, studioUser: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [studioUser, setStudioUser] = useState<StudioUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'studioUsers', user.uid);
        const unsub = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setStudioUser(doc.data() as StudioUser);
          }
          setLoading(false);
        });
        return () => unsub();
      } else {
        setStudioUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, studioUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
