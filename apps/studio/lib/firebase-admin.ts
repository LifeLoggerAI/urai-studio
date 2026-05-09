import * as admin from 'firebase-admin';

type FirebaseAdminMode =
  | 'service-account'
  | 'application-default'
  | 'unconfigured'
  | 'error';

let firebaseAdminMode: FirebaseAdminMode = 'unconfigured';
let firebaseAdminInitError: string | null = null;

function hasPemShape(value: string | undefined): value is string {
  return (
    !!value &&
    value.includes('-----BEGIN PRIVATE KEY-----') &&
    value.includes('-----END PRIVATE KEY-----')
  );
}

function initAdmin() {
  if (admin.apps.length) {
    firebaseAdminMode = 'service-account';
    return;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  try {
    if (projectId && clientEmail && hasPemShape(privateKey)) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });

      firebaseAdminMode = 'service-account';
      return;
    }

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