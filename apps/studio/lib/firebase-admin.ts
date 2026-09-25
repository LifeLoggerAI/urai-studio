import * as admin from 'firebase-admin';

type FirebaseAdminMode = 'application-default' | 'verification-required' | 'unconfigured' | 'error';

let firebaseAdminMode: FirebaseAdminMode = 'unconfigured';
let firebaseAdminInitError: string | null = null;

function initAdmin() {
  if (admin.apps.length) {
    firebaseAdminMode = 'application-default';
    return;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const adcVerified = process.env.URAI_STUDIO_FIREBASE_ADMIN_ADC_VERIFIED === '1';

  try {
    if (projectId && adcVerified) {
      // Application Default Credentials covers local ADC, CI workload identity,
      // Cloud Run/App Hosting service identity, and Functions service identity.
      // No long-lived service-account JSON or private key is accepted here.
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
      firebaseAdminMode = 'application-default';
      return;
    }

    if (projectId) {
      firebaseAdminMode = 'verification-required';
      firebaseAdminInitError = 'ADC availability has not been verified for this runtime';
      return;
    }

    firebaseAdminMode = 'unconfigured';
  } catch (error) {
    firebaseAdminMode = 'error';
    firebaseAdminInitError = error instanceof Error ? error.message : 'unknown_firebase_admin_init_error';
  }
}

initAdmin();

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;

export const firebaseAdminReady = Boolean(adminDb && adminAuth);

export const firebaseAdminStatus = {
  ready: firebaseAdminReady,
  mode: firebaseAdminMode,
  error: firebaseAdminInitError,
};
