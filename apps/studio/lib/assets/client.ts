'use client';

import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getFirebaseClientFirestore } from '@/lib/firebaseClient';
import { StudioAssetManifest, StudioGenerationJob } from './types';

type Unsubscribe = () => void;

function noopUnsubscribe(): Unsubscribe {
  return () => undefined;
}

function getConfiguredFirestore(onError?: (error: Error) => void) {
  const firestore = getFirebaseClientFirestore();
  if (!firestore) {
    onError?.(
      new Error(
        'Firebase is not configured for this environment. Add the NEXT_PUBLIC_FIREBASE_* values to enable live assets.',
      ),
    );
    return null;
  }

  return firestore;
}

export function subscribeAssetManifests(
  onData: (manifests: StudioAssetManifest[]) => void,
  onError?: (error: Error) => void,
) {
  const firestore = getConfiguredFirestore(onError);
  if (!firestore) {
    onData([]);
    return noopUnsubscribe();
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
  const firestore = getConfiguredFirestore(onError);
  if (!firestore) {
    onData([]);
    return noopUnsubscribe();
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
