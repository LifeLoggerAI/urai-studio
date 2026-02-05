/**
 * SSR-safe Firebase client.
 * IMPORTANT: Never initialize Firebase client SDK during Next build/SSR.
 * This prevents auth/invalid-api-key crashes during "Collecting page data".
 */
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

function canUseClientFirebase(): boolean {
  return (
    typeof window !== "undefined" &&
    !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

function getClientApp(): FirebaseApp | null {
  if (!canUseClientFirebase()) return null;
  return getApps().length ? getApp() : initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

// Exported singletons (may be null during SSR/build)
export const app: FirebaseApp | null = getClientApp();
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;

// Optional helpers for callers that want a hard failure in browser runtime
export function requireAuth(): Auth {
  if (!auth) throw new Error("firebase_client_auth_unavailable");
  return auth;
}
export function requireDb(): Firestore {
  if (!db) throw new Error("firebase_client_db_unavailable");
  return db;
}

// ---- legacy aliases (keep existing imports working) ----
export const firebaseApp = app;
export const firebaseAuth = auth;
export const firebaseDb = db;
