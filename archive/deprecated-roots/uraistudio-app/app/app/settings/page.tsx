'use client';

import { useAuth } from '../../../../context/AuthContext'; // Adjust as needed

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Settings</h1>
      <h2>Account Information</h2>
      <p><strong>Email:</strong> {user?.email}</p>
      {/* Add form to update displayName */}

      <h2>API Keys</h2>
      <p><em>(Placeholder for API key management)</em></p>

      <h2>Consent</h2>
      <p><em>(Placeholder for consent management)</em></p>
    </div>
  );
}
