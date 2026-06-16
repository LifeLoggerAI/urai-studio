import React from 'react';

const SettingsPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Account</h2>
          <p>Manage your account settings here.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">API Keys</h2>
          <p>Manage your API keys here.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Consent</h2>
          <p>Manage your consent settings here.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
