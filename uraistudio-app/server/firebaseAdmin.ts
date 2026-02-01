import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://demo-urai-studio.firebaseio.com",
  });
}

export const adminDb = admin.firestore();
