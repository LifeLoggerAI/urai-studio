export type StudioRole = "owner" | "creator" | "viewer";

export type Membership = {
  id: string;          // `${uid}_${studioId}`
  uid: string;
  studioId: string;
  role: StudioRole;
  createdAt: number;
};

export type JobState =
  | "QUEUED"
  | "RUNNING"
  | "RENDERING"
  | "UPLOADING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED";

export type Job = {
  id: string;
  studioId: string;
  createdAt: number;
  createdBy: string;
  clipRequestId: string;
  state: JobState;
  attempt: number;
  lastError?: string;
  renderProfile: string;
};

export type Output = {
  id: string;
  studioId: string;
  jobId: string;
  createdAt: number;
  kind: "mp4" | "thumb" | "srt" | "json";
  storagePath: string;
  contentType?: string;
};
