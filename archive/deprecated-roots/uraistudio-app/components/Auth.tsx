'use client';

import React from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getFirebase } from '@/lib/firebaseClient';

const Auth = () => {
  const { auth } = getFirebase();
  const [user, loading, error] = useAuthState(auth);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-zinc-400">Welcome, {user.displayName}</div>
        <button onClick={logOut} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium border border-zinc-700 transition hover:border-zinc-500">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button onClick={signIn} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium border border-zinc-700 transition hover:border-zinc-500">
      Sign in with Google
    </button>
  );
};

export default Auth;
