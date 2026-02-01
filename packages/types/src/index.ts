import { Timestamp } from "firebase/firestore";

export interface User {
  email: string;
  displayName: string;
  roles: {
    admin: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ContentItem {
  ownerUid: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  latestVersionId?: string;
  statusSummary: "draft" | "processing" | "ready" | "failed";
}

export interface Upload {
  ownerUid: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  size: number;
  durationSec?: number;
  createdAt: Timestamp;
  checksum?: string;
  status: "uploaded" | "validated" | "rejected";
  rejectReason?: string;
}

export interface Version {
  ownerUid: string;
  recipeId: string;
  recipeParams: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: "draft" | "rendering" | "ready" | "failed";
  outputs: Record<string, string>; // urls/paths for thumb/srt/mp4/etc once ready
}

export interface Job {
  ownerUid: string;
  itemId: string;
  versionId: string;
  type: "transcode" | "captions" | "thumbnail" | "renderShort";
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  progressPct: number;
  stage: string;
  attempts: number;
  lockedBy?: string;
  lockExpiresAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  finishedAt?: Timestamp;
  errorCode?: string;
  errorMessage?: string;
  lastHeartbeatAt?: Timestamp;
}

export interface JobRun {
  jobId: string;
  attempt: number;
  startedAt: Timestamp;
  finishedAt?: Timestamp;
  status: "running" | "succeeded" | "failed";
  logsPath?: string;
  error?: string;
}

export interface AuditLog {
  actorUid?: string;
  actorRole: "user" | "admin" | "system";
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, any>;
  createdAt: Timestamp;
}
