"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth, signOut } from "firebase/auth";

export default function SettingsPage() {
  const auth = getAuth();
  const [user] = useAuthState(auth);

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Account</h2>
        <p>Email: {user?.email}</p>
        <button onClick={() => signOut(auth)} className="mt-4 px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700">
          Sign out
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">API Keys</h2>
        <p>API keys are not yet available.</p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Consent</h2>
        <p>Consent management is not yet available.</p>
      </div>
    </div>
  );
}
