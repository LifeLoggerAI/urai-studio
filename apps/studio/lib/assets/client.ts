'use client';

import { collection, limit, onSnapshot, orderBy, query, type DocumentData, type Unsubscribe } from 'firebase/firestore';

import { firebaseClientConfigured, firestore } from '@/lib/firebaseClient';
import type { StudioAssetArtifact, StudioAssetManifest, StudioGenerationJob, StudioGenerationRequest } from './types';

const noop: Unsubscribe = () => undefined;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeRequest(value: unknown): StudioGenerationRequest {
  const request = asRecord(value);
  return {
    type: asString(request.type, 'asset'),
    prompt: asString(request.prompt, asString(request.promptPreview, 'Untitled generation')),
    promptPreview: typeof request.promptPreview === 'string' ? request.promptPreview : undefined,
  };
}

function normalizeArtifacts(value: unknown): StudioAssetArtifact[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const artifact = asRecord(item);
    return {
      artifactId: asString(artifact.artifactId, `artifact-${index + 1}`),
      type: asString(artifact.type, 'other'),
      url: asString(artifact.url, ''),
      storageUri: asString(artifact.storageUri, ''),
      mimeType: asString(artifact.mimeType, 'application/octet-stream'),
      width: asNumber(artifact.width),
      height: asNumber(artifact.height),
      durationMs: asNumber(artifact.durationMs),
    };
  });
}

function normalizeGenerationJob(docId: string, data: DocumentData): StudioGenerationJob {
  return {
    jobId: docId,
    ownerId: asString(data.ownerId, ''),
    projectId: asString(data.projectId, ''),
    status: asString(data.status, 'queued') as StudioGenerationJob['status'],
    provider: asString(data.provider, 'unknown'),
    model: asString(data.model, 'unknown'),
    artifactId: typeof data.artifactId === 'string' ? data.artifactId : undefined,
    manifestId: typeof data.manifestId === 'string' ? data.manifestId : undefined,
    request: normalizeRequest(data.request),
    error: data.error === null || data.error === undefined ? null : asRecord(data.error),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    completedAt: data.completedAt,
  };
}

function normalizeManifest(docId: string, data: DocumentData): StudioAssetManifest {
  const spatialCompatibility = asRecord(data.spatialCompatibility);
  const studioCompatibility = asRecord(data.studioCompatibility);
  const safetyReview = asRecord(data.safetyReview);

  return {
    manifestId: docId,
    manifestVersion: '1.0',
    jobId: asString(data.jobId, ''),
    ownerId: asString(data.ownerId, ''),
    projectId: asString(data.projectId, ''),
    assetType: asString(data.assetType, 'other'),
    artifacts: normalizeArtifacts(data.artifacts),
    provider: asString(data.provider, 'unknown'),
    model: asString(data.model, 'unknown'),
    promptHash: typeof data.promptHash === 'string' ? data.promptHash : undefined,
    promptPreview: asString(data.promptPreview, 'Untitled asset'),
    spatialCompatibility: {
      supported: asBoolean(spatialCompatibility.supported),
      type: asString(spatialCompatibility.type, 'not spatial'),
      reason: typeof spatialCompatibility.reason === 'string' ? spatialCompatibility.reason : undefined,
    },
    studioCompatibility:
      Object.keys(studioCompatibility).length > 0
        ? {
            previewable: asBoolean(studioCompatibility.previewable),
            downloadable: asBoolean(studioCompatibility.downloadable),
          }
        : undefined,
    safetyReview:
      Object.keys(safetyReview).length > 0
        ? {
            status: asString(safetyReview.status, 'unknown'),
          }
        : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export function subscribeAssetManifests(
  onData: (manifests: StudioAssetManifest[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!firebaseClientConfigured || !firestore) {
    onData([]);
    onError?.(new Error('Firebase client is not configured. Asset manifests are unavailable.'));
    return noop;
  }

  const q = query(collection(firestore, 'assetManifests'), orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((doc) => normalizeManifest(doc.id, doc.data())));
    },
    (error) => onError?.(error),
  );
}

export function subscribeGenerationJobs(
  onData: (jobs: StudioGenerationJob[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!firebaseClientConfigured || !firestore) {
    onData([]);
    onError?.(new Error('Firebase client is not configured. Generation jobs are unavailable.'));
    return noop;
  }

  const q = query(collection(firestore, 'generationJobs'), orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((doc) => normalizeGenerationJob(doc.id, doc.data())));
    },
    (error) => onError?.(error),
  );
}
