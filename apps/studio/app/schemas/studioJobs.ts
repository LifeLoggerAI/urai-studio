
// apps/studio/app/schemas/studioJobs.ts

import { FirebaseTimestamp } from './types';

export type StudioJobStatus =
  | "QUEUED"      // Job is waiting in the queue
  | "ANALYZING"   // Analyzing transcript for highlights
  | "RENDERING"   // Rendering video clips
  | "UPLOADING"   // Uploading clips to storage
  | "SUCCEEDED"   // Job completed successfully
  | "FAILED"      // Job has failed
  | "CANCELLED";  // Job was cancelled

export type StudioJobType = 
  | "CLIP_PIPELINE_V1"
  | "CAPTION_V1"
  | "EXPORT_MP4_V1"
  | "PUBLISH_TIKTOK_V1";

export type StudioJob = {
  // identity
  jobId: string;
  type: StudioJobType;
  status: StudioJobStatus;
  progress?: number; // Progress percentage (0-100)

  // idempotency + grouping
  idempotencyKey: string;
  groupKey: string;
  priority: number;

  // source + params
  source: {
    kind: "CALL" | "TRANSCRIPT" | "UPLOAD" | "MANUAL";
    ref: string;
    title?: string;
  };

  input: {
    transcriptRef?: string;
    mediaRef?: string;
    maxClips?: number;
    clipSeconds?: { min: number; max: number };
    format?: "VERTICAL_9_16" | "SQUARE_1_1" | "HORIZONTAL_16_9";
    captions?: boolean;
    branding?: { watermark?: boolean; handle?: string };
  };

  // execution bookkeeping
  attempts: number;
  maxAttempts: number;
  lease: {
    leasedBy?: string;
    leaseUntil?: FirebaseTimestamp;
  };

  // outcomes
  output?: {
    clipRefs?: string[];
    artifactRefs?: string[];
  };

  // error + timestamps
  lastError?: {
    code?: string;
    message: string;
    stack?: string;
    at: FirebaseTimestamp;
  };

  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
};
