/** A scheduled fallback worker must not execute a job it did not lease. */
type JobFields = { state?: unknown; attempt?: unknown; leaseExpiresAt?: unknown; claimedBy?: unknown };
export type FallbackLeaseDecision = { kind: 'skip' | 'exhausted' | 'claim'; attempt: number };

function leaseMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return Number.NaN;
  const method = (value as { toMillis?: unknown }).toMillis;
  if (typeof method !== 'function') return Number.NaN;
  try { return Number(method.call(value)); } catch { return Number.NaN; }
}

export function inspectFallbackJobLease(value: unknown, nowMillis: number, maxAttempts: number): FallbackLeaseDecision {
  const skip = { kind: 'skip' as const, attempt: 0 };
  if (!value || typeof value !== 'object' || !Number.isSafeInteger(nowMillis) || nowMillis < 0
    || !Number.isSafeInteger(maxAttempts) || maxAttempts < 1) return skip;
  const job = value as JobFields;
  const attempt = job.attempt === undefined ? 0 : job.attempt;
  if (!Number.isSafeInteger(attempt) || (attempt as number) < 0) return skip;
  const eligible = job.state === 'queued' || (job.state === 'running'
    && Number.isFinite(leaseMillis(job.leaseExpiresAt)) && leaseMillis(job.leaseExpiresAt) <= nowMillis);
  if (!eligible) return skip;
  return { kind: (attempt as number) >= maxAttempts ? 'exhausted' : 'claim', attempt: attempt as number };
}

export function ownsFallbackJobLease(value: unknown, runnerId: string, attempt: number): boolean {
  if (!value || typeof value !== 'object' || !runnerId || !Number.isSafeInteger(attempt) || attempt < 1) return false;
  const job = value as JobFields;
  return job.state === 'running' && job.claimedBy === runnerId && job.attempt === attempt;
}
