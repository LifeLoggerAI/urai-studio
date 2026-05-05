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

export interface StudioGenerationJob {
  jobId: string;
  ownerId: string;
  projectId: string;
  status: GenerationJobStatus;
  provider: string;
  model: string;
  artifactId?: string;
  manifestId?: string;
  request: {
    type: string;
    prompt: string;
    promptPreview?: string;
  };
  error?: {
    code?: string;
    message?: string;
    retryable?: boolean;
  } | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  completedAt?: unknown;
}

export interface StudioAssetManifest {
  manifestId: string;
  manifestVersion: '1.0';
  jobId: string;
  ownerId: string;
  projectId: string;
  assetType: string;
  artifacts: Array<{
    artifactId: string;
    type: string;
    url: string;
    storageUri: string;
    mimeType: string;
    width?: number;
    height?: number;
    durationMs?: number;
  }>;
  provider: string;
  model: string;
  promptHash?: string;
  promptPreview: string;
  spatialCompatibility: {
    supported: boolean;
    type: string;
    reason?: string;
  };
  studioCompatibility?: {
    previewable: boolean;
    downloadable: boolean;
  };
  safetyReview?: {
    status: string;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
}
