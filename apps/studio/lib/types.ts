
export interface Job {
  jobId: string;
  title: string;
  kind: 'clip_demo' | 'replay' | 'render';
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  progress: number;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
  input: {
    prompt: string;
    durationSec: number;
    aspect: '9:16' | '16:9' | '1:1';
  };
  output?: {
    replayId?: string;
    url?: string;
  };
  logs?: Array<{ t: number; level: 'info' | 'warn' | 'error'; msg: string }>;
  ownerUid?: string;
  demo?: boolean;
}
