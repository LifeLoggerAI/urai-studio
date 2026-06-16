
'use client';

import { useEffect } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase/client'; // Assuming firebase/client.ts initializes firebase
import { useRouter } from 'next/navigation';

const auth = getAuth(app);
const db = getFirestore(app);

export default function LoginPage() {
  const router = useRouter();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        const userRef = doc(db, 'studioUsers', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            email: user.email,
            plan: 'free',
            role: 'user',
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        router.push('/studio');
      }
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <button
        onClick={handleSignIn}
        className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
      >
        Sign in with Google
      </button>
    </div>
  );
}
