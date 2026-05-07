import * as admin from 'firebase-admin';

function isPemPrivateKey(value: string) {
  return value.includes('-----BEGIN PRIVATE KEY-----') && value.includes('-----END PRIVATE KEY-----');
}

function initAdmin() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    if (!isPemPrivateKey(privateKey)) return;

    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } catch {
      return;
    }
    return;
  }

  if (projectId) {
    try {
      admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId });
    } catch {
      return;
    }
  }
}

initAdmin();

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
