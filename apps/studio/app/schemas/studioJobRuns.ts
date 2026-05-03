export interface StudioJobRun { id: string; jobId: string; status: 'queued'|'running'|'failed'|'completed'; startedAt?: string; finishedAt?: string; errorMessage?: string; }
