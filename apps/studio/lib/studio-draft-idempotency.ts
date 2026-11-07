import { createHash } from 'node:crypto';

// This is draft persistence only, NOT a worker, output, or private-media grant.
const KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~-]{15,127}$/;
export const STUDIO_DRAFT_KEY_HEADER = 'x-urai-studio-idempotency-key';

export type DraftIdempotencyInput = {
  tenantId: string;
  userId: string;
  key: string;
  projectId?: string;
  briefId?: string;
  kind: string;
  prompt: string;
  requestedExports: readonly string[];
};

function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function validStudioDraftKey(key: unknown): key is string {
  return typeof key === 'string' && KEY_PATTERN.test(key);
}

export function deriveStudioDraftReceipt(input: DraftIdempotencyInput) {
  if (!validStudioDraftKey(input.key)) throw new Error('studio_idempotency_key_invalid');
  if (!input.tenantId || !input.userId) throw new Error('studio_idempotency_identity_required');
  const keyDigest = digest(['urai-studio-idempotency-key-v1', input.tenantId, input.userId, input.key]);
  const requestDigest = digest([
    'urai-studio-draft-request-v1', input.tenantId, input.userId,
    input.projectId || '', input.briefId || '', input.kind, input.prompt,
    [...input.requestedExports],
  ]);
  return { jobId: 'job_idem_' + keyDigest, keyDigest, requestDigest } as const;
}

export type ExportIdempotencyInput = {
  tenantId: string;
  userId: string;
  key: string;
  projectId: string;
  jobId?: string;
  assetIds: readonly string[];
  kind: string;
};

/** Export namespace differs from draft-job IDs even when clients use the same key. */
export function deriveStudioExportReceipt(input: ExportIdempotencyInput) {
  if (!validStudioDraftKey(input.key)) throw new Error('studio_idempotency_key_invalid');
  if (!input.tenantId || !input.userId) throw new Error('studio_idempotency_identity_required');
  const keyDigest = digest(['urai-studio-export-key-v1', input.tenantId, input.userId, input.key]);
  const requestDigest = digest([
    'urai-studio-export-request-v1', input.tenantId, input.userId,
    input.projectId, input.jobId || '', input.kind, [...input.assetIds],
  ]);
  return { exportId: 'export_idem_' + keyDigest, keyDigest, requestDigest } as const;
}
