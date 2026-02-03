
// apps/studio/app/schemas/studioDLQ.ts

import { FirebaseTimestamp } from './types';

export type StudioDLQItem = {
  dlqId: string;
  jobId: string;
  reason: string;
  lastError: {
    message: string;
    code?: string;
    at: FirebaseTimestamp;
  };
  createdAt: FirebaseTimestamp;
};
