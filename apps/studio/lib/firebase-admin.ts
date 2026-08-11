import * as admin from 'firebase-admin';

type FirebaseAdminMode =
  | 'application-default'
  | 'unconfigured'
  | 'error';

let firebaseAdminMode: FirebaseAdminMode = 'unconfigured';
let firebaseAdminInitError: string | null = null;

function initAdmin() {
  if (admin.apps.length) {
    firebaseAdminMode = 'application-default';
    return;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  try {
    if (projectId && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });

      firebaseAdminMode = 'application-default';
      return;
    }

    firebaseAdminMode = 'unconfigured';
  } catch (error) {
    firebaseAdminMode = 'error';
    firebaseAdminInitError =
      error instanceof Error
        ? error.message
        : 'unknown_firebase_admin_init_error';
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
