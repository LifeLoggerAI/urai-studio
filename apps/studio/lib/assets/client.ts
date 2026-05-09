'use client';

import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { firebaseClientConfigured, firestore } from '@/lib/firebaseClient';
import { StudioAssetManifest, StudioGenerationJob } from './types';

const noop = () => undefined;

export function subscribeAssetManifests(
  onData: (manifests: StudioAssetManifest[]) => void,
  onError?: (error: Error) => void,
) {
  if (!firebaseClientConfigured || !firestore) {
    onData([]);
    onError?.(new Error('Firebase client is not configured. Asset manifests are unavailable.'));
    return noop;
  }

  const q = query(collection(firestore, 'assetManifests'), orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((doc) => ({ ...(doc.data() as StudioAssetManifest), manifestId: doc.id })));
    },
    (error) => onError?.(error as Error),
  );
}

export function subscribeGenerationJobs(
  onData: (jobs: StudioGenerationJob[]) => void,
  onError?: (error: Error) => void,
) {
  if (!firebaseClientConfigured || !firestore) {
    onData([]);
    onError?.(new Error('Firebase client is not configured. Generation jobs are unavailable.'));
    return noop;
  }

  const q = query(collection(firestore, 'generationJobs'), orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((doc) => ({ ...(doc.data() as StudioGenerationJob), jobId: doc.id })));
    },
    (error) => onError?.(error as Error),
  );
}
