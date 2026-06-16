'use client';
import { useAuth } from '../../context/AuthContext';

export default function App() {
  const { user, signOut } = useAuth();

  return (
    <div>
      <h1>Welcome to the App!</h1>
      {user && <p>You are signed in as {user.displayName}</p>}
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
