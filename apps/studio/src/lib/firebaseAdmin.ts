import * as admin from "firebase-admin";

declare global {
  // eslint-disable-next-line no-var
  var __URAI_ADMIN_APP__: admin.app.App | undefined;
}

function getAdminApp() {
  if (global.__URAI_ADMIN_APP__) return global.__URAI_ADMIN_APP__;
  if (admin.apps.length) {
    global.__URAI_ADMIN_APP__ = admin.app();
    return global.__URAI_ADMIN_APP__;
  }
  // ADC in Firebase/Cloud runtimes; local dev can use GOOGLE_APPLICATION_CREDENTIALS or gcloud auth.
  global.__URAI_ADMIN_APP__ = admin.initializeApp();
  return global.__URAI_ADMIN_APP__;
}

export const adminApp = getAdminApp();
export const adminDb = adminApp.firestore();
export const adminAuth = adminApp.auth();
