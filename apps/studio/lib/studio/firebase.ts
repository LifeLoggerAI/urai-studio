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

function runtimeProjectId(): string | null {
  return (
    envValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID') ??
    envValue('FIREBASE_PROJECT_ID') ??
    envValue('GOOGLE_CLOUD_PROJECT') ??
    envValue('GCLOUD_PROJECT')
  );
}

const projectId = runtimeProjectId();
const adcVerified = envValue('URAI_STUDIO_FIREBASE_ADMIN_ADC_VERIFIED') === '1';

export const firebaseDiagnostics: FirebaseDiagnostics = {
  configured: Boolean(projectId),
  projectId,
  hostingSite: envValue('NEXT_PUBLIC_HOSTING_SITE') ?? 'urai-studio',
  adminAvailable: Boolean(projectId && adcVerified),
  emulator: {
    firestore: Boolean(envValue('FIRESTORE_EMULATOR_HOST')),
    auth: Boolean(envValue('FIREBASE_AUTH_EMULATOR_HOST')),
    storage: Boolean(envValue('FIREBASE_STORAGE_EMULATOR_HOST')),
  },
};
