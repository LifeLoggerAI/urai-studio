'use client';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';

import type { StudioDashboardSummary, StudioMode, StudioAssetType } from './types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function hasFirebaseClientConfig(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

export function getStudioFirebaseApp(): FirebaseApp | null {
  if (!hasFirebaseClientConfig()) return null;
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

export function getStudioAuth(): Auth | null {
  const app = getStudioFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getStudioFunctions(): Functions | null {
  const app = getStudioFirebaseApp();
  return app ? getFunctions(app) : null;
}

export async function ensureStudioUser(): Promise<User> {
  const auth = getStudioAuth();
  if (!auth) {
    throw new Error('Firebase client config is missing. Add NEXT_PUBLIC_FIREBASE_* values before using live Studio actions.');
  }
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

async function callStudioFunction<T>(name: string, payload: Record<string, unknown> = {}): Promise<T> {
  await ensureStudioUser();
  const functions = getStudioFunctions();
  if (!functions) {
    throw new Error('Firebase Functions client is unavailable.');
  }
  const callable = httpsCallable<Record<string, unknown>, T>(functions, name);
  const response = await callable(payload);
  return response.data;
}

export const studioApi = {
  ping: () => callStudioFunction<{ ok: boolean; service: string; timestamp: string }>('ping'),
  createStudioProject: (input: { title?: string; mode?: StudioMode }) =>
    callStudioFunction<{ ok: boolean; projectId: string }>('createStudioProject', input),
  seedStudioDemo: (input: { title?: string } = {}) =>
    callStudioFunction<{ ok: boolean; projectId: string; sceneIds: string[]; assetIds: string[]; scriptId: string; scrollId: string; exportJobId: string }>(
      'seedStudioDemo',
      input,
    ),
  generateStudioScript: (input: { projectId?: string; prompt?: string; style?: string; title?: string }) =>
    callStudioFunction<{ ok: boolean; scriptId: string; body: string }>('generateStudioScript', input),
  createAssetJob: (input: { projectId?: string; type?: StudioAssetType; prompt?: string }) =>
    callStudioFunction<{ ok: boolean; assetJobId: string }>('createAssetJob', input),
  createExportJob: (input: { projectId?: string; type?: string }) =>
    callStudioFunction<{ ok: boolean; exportJobId: string }>('createExportJob', input),
  processExportJob: (input: { exportJobId: string }) =>
    callStudioFunction<{ ok: boolean; exportJobId: string; manifest: Record<string, unknown> }>('processExportJob', input),
  getExportJobStatus: (input: { exportJobId: string }) =>
    callStudioFunction<{ ok: boolean; exportJob: Record<string, unknown> }>('getExportJobStatus', input),
  getStudioDashboard: () => callStudioFunction<StudioDashboardSummary>('getStudioDashboard'),
  logStudioEvent: (input: { type: string; projectId?: string; metadata?: Record<string, unknown> }) =>
    callStudioFunction<{ ok: boolean; eventId: string }>('logStudioEvent', input),
};
