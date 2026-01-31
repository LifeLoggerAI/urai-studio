import admin from "firebase-admin";

declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_ADMIN__: admin.app.App | undefined;
}

export function getAdmin() {
  if (!global.__FIREBASE_ADMIN__) {
    global.__FIREBASE_ADMIN__ = admin.initializeApp({
      projectId: process.env.GCLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-urai-studio"
    });
  }
  return global.__FIREBASE_ADMIN__;
}