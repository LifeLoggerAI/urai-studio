export type GenerationJobStatus =
  | 'queued'
  | 'claimed'
  | 'processing'
  | 'uploading'
  | 'manifest_written'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'cancelled';

export type StudioArtifactKind = 'image' | 'video' | 'audio' | 'model' | 'subtitle' | 'script' | 'scroll' | 'scene' | 'other';

export interface StudioGenerationRequest {
  type: string;
  prompt: string;
  promptPreview?: string;
}

export interface StudioGenerationError {
  code?: string;
  message?: string;
  retryable?: boolean;
}

export interface StudioGenerationJob {
  jobId: string;
  ownerId: string;
  projectId: string;
  status: GenerationJobStatus;
  provider: string;
  model: string;
  artifactId?: string;
  manifestId?: string;
  request: StudioGenerationRequest;
  error?: StudioGenerationError | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  completedAt?: unknown;
}

export interface StudioAssetArtifact {
  artifactId: string;
  type: StudioArtifactKind | string;
  url: string;
  storageUri: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationMs?: number;
}

export interface StudioSpatialCompatibility {
  supported: boolean;
  type: string;
  reason?: string;
}

export interface StudioCompatibility {
  previewable: boolean;
  downloadable: boolean;
}

export interface StudioSafetyReview {
  status: string;
}

export interface StudioAssetManifest {
  manifestId: string;
  manifestVersion: '1.0';
  jobId: string;
  ownerId: string;
  projectId: string;
  assetType: string;
  artifacts: StudioAssetArtifact[];
  provider: string;
  model: string;
  promptHash?: string;
  promptPreview: string;
  spatialCompatibility: StudioSpatialCompatibility;
  studioCompatibility?: StudioCompatibility;
  safetyReview?: StudioSafetyReview;
  createdAt?: unknown;
  updatedAt?: unknown;
}
