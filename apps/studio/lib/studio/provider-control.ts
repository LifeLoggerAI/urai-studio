export type StudioProviderMode = 'disabled' | 'demo' | 'configured' | 'live' | 'paused';

export type StudioProviderBudget = {
  currency: 'USD';
  maxAttemptCents: number;
  maxJobCents: number;
  maxDailyCents: number;
};

export type StudioProviderExecutionPolicy = {
  schemaVersion: 1;
  providerId: string;
  mode: StudioProviderMode;
  hardOff: boolean;
  activationAuthorized: false;
  killSwitchEngaged: boolean;
  budget: StudioProviderBudget;
  timeoutMs: number;
  maxAttempts: number;
  idempotencyRequired: true;
  provenanceRequired: true;
  receiptRequired: true;
  tenantScopeRequired: true;
  publicReleaseAuthorized: false;
};

export type StudioProviderAttempt = {
  providerId: string;
  tenantId: string;
  jobId: string;
  idempotencyKey: string;
  estimatedCostCents: number;
  attempt: number;
};

const MAX_TIMEOUT_MS = 120_000;
const MAX_ATTEMPTS = 3;

function positiveInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`studio_provider_invalid_${field}`);
  return value;
}

export function createStudioProviderExecutionPolicy(input: {
  providerId: string;
  mode?: Exclude<StudioProviderMode, 'live'>;
  budget: StudioProviderBudget;
  timeoutMs?: number;
  maxAttempts?: number;
  killSwitchEngaged?: boolean;
}): StudioProviderExecutionPolicy {
  if (!input.providerId.trim()) throw new Error('studio_provider_id_required');

  const timeoutMs = positiveInteger(input.timeoutMs ?? 30_000, 'timeout_ms');
  const maxAttempts = positiveInteger(input.maxAttempts ?? 1, 'max_attempts');
  if (timeoutMs > MAX_TIMEOUT_MS) throw new Error('studio_provider_timeout_exceeds_limit');
  if (maxAttempts > MAX_ATTEMPTS) throw new Error('studio_provider_attempts_exceed_limit');

  for (const [field, value] of Object.entries(input.budget)) {
    if (field === 'currency') continue;
    positiveInteger(value as number, `budget_${field}`);
  }
  if (input.budget.maxAttemptCents > input.budget.maxJobCents) {
    throw new Error('studio_provider_attempt_budget_exceeds_job_budget');
  }
  if (input.budget.maxJobCents > input.budget.maxDailyCents) {
    throw new Error('studio_provider_job_budget_exceeds_daily_budget');
  }

  return {
    schemaVersion: 1,
    providerId: input.providerId.trim(),
    mode: input.mode ?? 'disabled',
    hardOff: true,
    activationAuthorized: false,
    killSwitchEngaged: input.killSwitchEngaged ?? true,
    budget: input.budget,
    timeoutMs,
    maxAttempts,
    idempotencyRequired: true,
    provenanceRequired: true,
    receiptRequired: true,
    tenantScopeRequired: true,
    publicReleaseAuthorized: false,
  };
}

export function providerAttemptBlockers(
  policy: StudioProviderExecutionPolicy,
  attempt: StudioProviderAttempt,
): string[] {
  const blockers: string[] = [];

  if (policy.hardOff) blockers.push('studio_provider_hard_off');
  if (!policy.activationAuthorized) blockers.push('studio_provider_activation_not_authorized');
  if (policy.mode !== 'live') blockers.push(`studio_provider_mode_${policy.mode}`);
  if (policy.killSwitchEngaged) blockers.push('studio_provider_kill_switch_engaged');
  if (attempt.providerId !== policy.providerId) blockers.push('studio_provider_id_mismatch');
  if (!attempt.tenantId.trim()) blockers.push('studio_provider_tenant_required');
  if (!attempt.jobId.trim()) blockers.push('studio_provider_job_required');
  if (!attempt.idempotencyKey.trim()) blockers.push('studio_provider_idempotency_key_required');
  if (!Number.isInteger(attempt.estimatedCostCents) || attempt.estimatedCostCents < 0) {
    blockers.push('studio_provider_estimated_cost_invalid');
  } else if (attempt.estimatedCostCents > policy.budget.maxAttemptCents) {
    blockers.push('studio_provider_attempt_budget_exceeded');
  }
  if (!Number.isInteger(attempt.attempt) || attempt.attempt < 1 || attempt.attempt > policy.maxAttempts) {
    blockers.push('studio_provider_attempt_out_of_bounds');
  }

  return blockers;
}

export function canExecuteStudioProviderAttempt(
  policy: StudioProviderExecutionPolicy,
  attempt: StudioProviderAttempt,
) {
  return providerAttemptBlockers(policy, attempt).length === 0;
}
