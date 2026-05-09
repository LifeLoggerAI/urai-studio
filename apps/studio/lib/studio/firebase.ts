export interface FirebaseDiagnostics {
  configured: boolean;
  projectId: string | null;
  hostingSite: string;
  adminAvailable: boolean;
  emulator: {
    firestore: boolean;
    auth: boolean;
    storage: boolean;
  };
}

function envValue(key: string): string | null {
  const value = process.env[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export const firebaseDiagnostics: FirebaseDiagnostics = {
  configured: Boolean(envValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID') || envValue('FIREBASE_PROJECT_ID')),
  projectId: envValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID') ?? envValue('FIREBASE_PROJECT_ID'),
  hostingSite: envValue('NEXT_PUBLIC_HOSTING_SITE') ?? 'urai-studio',
  adminAvailable: Boolean(envValue('GOOGLE_APPLICATION_CREDENTIALS') || envValue('FIREBASE_PROJECT_ID')),
  emulator: {
    firestore: Boolean(envValue('FIRESTORE_EMULATOR_HOST')),
    auth: Boolean(envValue('FIREBASE_AUTH_EMULATOR_HOST')),
    storage: Boolean(envValue('FIREBASE_STORAGE_EMULATOR_HOST')),
  },
};
