export type User = {
  email: string;
  displayName: string;
  roles: { admin: boolean };
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type ContentItem = {
  ownerUid: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  latestVersionId?: string;
  statusSummary: "draft" | "processing" | "ready" | "failed";
};

export type Upload = {
  ownerUid: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  size: number;
  durationSec?: number;
  createdAt: FirebaseFirestore.Timestamp;
  checksum?: string;
  status: "uploaded" | "validated" | "rejected";
  rejectReason?: string;
};

export type Version = {
  ownerUid: string;
  recipeId: string;
  recipeParams: Record<string, any>;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  status: "draft" | "rendering" | "ready" | "failed";
  outputs: Record<string, any>;
};

export type Job = {
  ownerUid: string;
  itemId: string;
  versionId: string;
  type: "transcode" | "captions" | "thumbnail" | "renderShort";
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  progressPct: number;
  stage: string;
  attempts: number;
  lockedBy?: string;
  lockExpiresAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  startedAt?: FirebaseFirestore.Timestamp;
  finishedAt?: FirebaseFirestore.Timestamp;
  errorCode?: string;
  errorMessage?: string;
  lastHeartbeatAt?: FirebaseFirestore.Timestamp;
};

export type JobRun = {
  jobId: string;
  attempt: number;
  startedAt: FirebaseFirestore.Timestamp;
  finishedAt?: FirebaseFirestore.Timestamp;
  status: "running" | "succeeded" | "failed";
  logsPath?: string;
  error?: string;
};

export type AuditLog = {
  actorUid?: string;
  actorRole: "user" | "admin" | "system";
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, any>;
  createdAt: FirebaseFirestore.Timestamp;
};
