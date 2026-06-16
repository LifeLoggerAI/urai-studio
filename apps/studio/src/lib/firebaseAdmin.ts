import "server-only";
import * as admin from "firebase-admin";

type GlobalWithUraiAdminApp = typeof globalThis & {
  __URAI_ADMIN_APP__?: admin.app.App;
};

const globalForAdmin = globalThis as GlobalWithUraiAdminApp;

function getAdminApp() {
  if (globalForAdmin.__URAI_ADMIN_APP__) return globalForAdmin.__URAI_ADMIN_APP__;

  if (admin.apps.length) {
    const existingApp = admin.app();
    globalForAdmin.__URAI_ADMIN_APP__ = existingApp;
    return existingApp;
  }

  // ADC in Firebase/Cloud runtimes; local dev can use GOOGLE_APPLICATION_CREDENTIALS or gcloud auth.
  const initializedApp = admin.initializeApp();
  globalForAdmin.__URAI_ADMIN_APP__ = initializedApp;
  return initializedApp;
}

export const adminApp = getAdminApp();
export const adminDb = adminApp.firestore();
export const adminAuth = adminApp.auth();
