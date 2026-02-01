'use client';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    <div>
      <h1>URAI Studio</h1>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}!</p>
          <button onClick={signOut}>Sign Out</button>
          <a href="/app">Go to App</a>
        </div>
      ) : (
        <button onClick={signInWithGoogle}>Sign in with Google</button>
      )}
    </div>
  );
}
