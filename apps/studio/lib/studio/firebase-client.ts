'use client';

import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';

import type { StudioAssetType, StudioDashboardSummary, StudioMode } from './types';

type CallablePayload = Record<string, unknown>;

type ProjectInput = {
  title?: string;
  mode?: StudioMode;
};

type ScriptInput = {
  projectId?: string;
  prompt?: string;
  style?: string;
  title?: string;
};

type AssetJobInput = {
  projectId?: string;
  type?: StudioAssetType;
  prompt?: string;
};

type ExportJobInput = {
  projectId?: string;
  type?: string;
};

function getFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function hasFirebaseClientConfig(): boolean {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId && config.appId);
}

export function getStudioFirebaseApp(): FirebaseApp | null {
  if (!hasFirebaseClientConfig()) return null;
  return getApps()[0] ?? initializeApp(getFirebaseConfig());
}

export function getStudioAuth(): Auth | null {
  const app = getStudioFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getStudioFunctions(): Functions | null {
  const app = getStudioFirebaseApp();
  return app ? getFunctions(app, 'us-central1') : null;
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

async function callStudioFunction<T>(name: string, payload: CallablePayload = {}): Promise<T> {
  await ensureStudioUser();
  const functions = getStudioFunctions();
  if (!functions) {
    throw new Error('Firebase Functions client is unavailable.');
  }
  const callable = httpsCallable<CallablePayload, T>(functions, name);
  const response = await callable(payload);
  return response.data;
}

function toPayload<T extends object>(input: T): CallablePayload {
  return { ...input } as CallablePayload;
}

export const studioApi = {
  ping: () => callStudioFunction<{ ok: boolean; service: string; timestamp: string }>('ping'),
  createStudioProject: (input: ProjectInput) =>
    callStudioFunction<{ ok: boolean; projectId: string }>('createStudioProject', toPayload(input)),
  seedStudioDemo: (input: { title?: string } = {}) =>
    callStudioFunction<{ ok: boolean; projectId: string; sceneIds: string[]; assetIds: string[]; scriptId: string; scrollId: string; exportJobId: string }>(
      'seedStudioDemo',
      toPayload(input),
    ),
  generateStudioScript: (input: ScriptInput) =>
    callStudioFunction<{ ok: boolean; scriptId: string; body: string }>('generateStudioScript', toPayload(input)),
  createAssetJob: (input: AssetJobInput) =>
    callStudioFunction<{ ok: boolean; assetJobId: string }>('createAssetJob', toPayload(input)),
  createExportJob: (input: ExportJobInput) =>
    callStudioFunction<{ ok: boolean; exportJobId: string }>('createExportJob', toPayload(input)),
  processExportJob: (input: { exportJobId: string }) =>
    callStudioFunction<{ ok: boolean; exportJobId: string; manifest: Record<string, unknown> }>('processExportJob', toPayload(input)),
  getExportJobStatus: (input: { exportJobId: string }) =>
    callStudioFunction<{ ok: boolean; exportJob: Record<string, unknown> }>('getExportJobStatus', toPayload(input)),
  getStudioDashboard: () => callStudioFunction<StudioDashboardSummary>('getStudioDashboard'),
  logStudioEvent: (input: { type: string; projectId?: string; metadata?: Record<string, unknown> }) =>
    callStudioFunction<{ ok: boolean; eventId: string }>('logStudioEvent', toPayload(input)),
};
