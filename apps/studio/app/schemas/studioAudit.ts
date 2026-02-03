
// apps/studio/app/schemas/studioAudit.ts

import { FirebaseTimestamp } from './types';

export type StudioAudit = {
  auditId: string;
  at: FirebaseTimestamp;
  actor: { uid?: string; role?: "FOUNDER" | "OPERATOR" | "VIEWER"; ip?: string };
  action:
    | "JOB_CREATED"
    | "JOB_LEASED"
    | "JOB_REPLAYED"
    | "JOB_SUCCEEDED"
    | "JOB_FAILED"
    | "DLQ_ENQUEUED"
    | "DLQ_DISMISSED";
  jobId?: string;
  details?: any;
};
