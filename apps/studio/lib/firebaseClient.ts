import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

type FirebaseClientConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  appId?: string;
};

const firebaseConfig: FirebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedFirestore: Firestore | null = null;

function hasValue(value: string | undefined) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && !normalized.includes('replace-me') && !normalized.includes('your-');
}

export function isFirebaseClientConfigured() {
  return (
    hasValue(firebaseConfig.apiKey) &&
    hasValue(firebaseConfig.authDomain) &&
    hasValue(firebaseConfig.projectId) &&
    hasValue(firebaseConfig.appId)
  );
}

export function getFirebaseClientApp() {
  if (!isFirebaseClientConfigured()) return null;
  if (cachedApp) return cachedApp;

  cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig as Required<FirebaseClientConfig>);
  return cachedApp;
}

export function getFirebaseClientAuth() {
  const app = getFirebaseClientApp();
  if (!app) return null;
  cachedAuth ??= getAuth(app);
  return cachedAuth;
}

export function getFirebaseClientFirestore() {
  const app = getFirebaseClientApp();
  if (!app) return null;
  cachedFirestore ??= getFirestore(app);
  return cachedFirestore;
}

export const firebaseClientConfigStatus = {
  configured: isFirebaseClientConfigured(),
  projectId: firebaseConfig.projectId ?? null,
};
