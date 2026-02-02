import { Timestamp } from 'firebase-admin/firestore';

export type UserRole = "owner" | "admin" | "editor" | "viewer";

export interface StudioUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  disabled: boolean;
}

export interface Project {
  name: string;
  description: string;
  createdBy: string; // uid
  status: "active" | "archived";
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Asset {
    type: "video" | "audio" | "image" | "script" | "caption" | "other";
    storagePath: string;
    filename: string;
    bytes: number;
    contentType: string;
    sha256?: string;
    createdBy: string; // uid
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type JobKind = "clip_render" | "thumbnail" | "captions" | "package_export" | "publish";
export type JobState = "queued" | "running" | "succeeded" | "failed" | "canceled";

export interface Job {
    projectId: string;
    kind: JobKind;
    state: JobState;
    priority: number;
    input: Record<string, any>;
    output: Record<string, any>;
    error: Record<string, any> | null;
    createdBy: string; // uid
    claimedBy: string | null;
    leaseExpiresAt: Timestamp | null;
    attempt: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface JobEvent {
    type: "state_change" | "log" | "artifact" | "metric";
    message: string;
    data: Record<string, any>;
    createdAt: Timestamp;
}

export type PublishPlatform = "youtube" | "tiktok" | "instagram" | "x" | "other";
export type PublishState = "draft" | "approved" | "publishing" | "published" | "failed";

export interface Publish {
    projectId: string;
    jobId: string;
    platform: PublishPlatform;
    state: PublishState;
    payload: Record<string, any>;
    result: Record<string, any>;
    approvedBy: string | null; // uid
    createdBy: string; // uid
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface AuditLog {
    actorUid: string | "system";
    action: string;
    target: string; // "projects/...", "jobs/..."
    before: Record<string, any> | null;
    after: Record<string, any> | null;
    ip: string | null;
    userAgent: string | null;
    createdAt: Timestamp;
}

export interface SystemConfig {
    allowBootstrapOwner: boolean;
    bootstrapOwnerEmail?: string;
    maxJobAttempts: number;
    leaseSeconds: number;
}
