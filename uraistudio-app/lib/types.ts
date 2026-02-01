
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  roles: {
    admin: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentItem {
  itemId: string;
  ownerUid: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  latestVersionId?: string;
  statusSummary: "draft" | "processing" | "ready" | "failed";
}

export interface Upload {
  uploadId: string;
  ownerUid: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  size: number;
  durationSec?: number;
  createdAt: Date;
  checksum?: string;
  status: "uploaded" | "validated" | "rejected";
  rejectReason?: string;
}

export interface Version {
  versionId: string;
  ownerUid: string;
  recipeId: string;
  recipeParams: { [key: string]: any };
  createdAt: Date;
  updatedAt: Date;
  status: "draft" | "rendering" | "ready" | "failed";
  outputs: { [key: string]: any };
}

export interface Job {
  jobId: string;
  ownerUid: string;
  itemId: string;
  versionId: string;
  type: "transcode" | "captions" | "thumbnail" | "renderShort";
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  progressPct: number;
  stage: string;
  attempts: number;
  lockedBy?: string;
  lockExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  errorCode?: string;
  errorMessage?: string;
  lastHeartbeatAt?: Date;
}

export interface JobRun {
  runId: string;
  jobId: string;
  attempt: number;
  startedAt: Date;
  finishedAt?: Date;
  status: "running" | "succeeded" | "failed";
  logsPath?: string;
  error?: string;
}

export interface AuditLog {
  logId: string;
  actorUid?: string;
  actorRole: "user" | "admin" | "system";
  action: string;
  targetType: string;
  targetId: string;
  metadata: { [key: string]: any };
  createdAt: Date;
}
