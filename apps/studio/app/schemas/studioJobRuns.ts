
// apps/studio/app/schemas/studioJobRuns.ts

import { FirebaseTimestamp } from './types';

export type StudioJobRun = {
  runId: string;               // doc id
  jobId: string;
  startedAt: FirebaseTimestamp;
  finishedAt?: FirebaseTimestamp;

  worker: { id: string; version?: string };
  status: "RUNNING" | "SUCCEEDED" | "FAILED";

  // snapshot of input at run-time
  input: any;

  // logs are optional; keep short here, push heavy logs to storage if needed
  log?: { level: "info" | "warn" | "error"; msg: string; at: FirebaseTimestamp }[];

  error?: { message: string; code?: string; stack?: string };
  output?: any;
};
