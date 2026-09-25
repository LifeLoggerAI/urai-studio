import assert from 'node:assert/strict';
import fs from 'node:fs';

const model = fs.readFileSync(new URL('../lib/studio/provider-control.ts', import.meta.url), 'utf8');
const doc = fs.readFileSync(new URL('../../../docs/operations/URAI_STUDIO_PROVIDER_COST_CONTROL.md', import.meta.url), 'utf8');

for (const mode of ['disabled', 'demo', 'configured', 'live', 'paused']) {
  assert.ok(model.includes(`'${mode}'`), `provider mode missing: ${mode}`);
}
for (const marker of [
  'hardOff: true',
  'activationAuthorized: false',
  'publicReleaseAuthorized: false',
  'idempotencyRequired: true',
  'provenanceRequired: true',
  'receiptRequired: true',
  'tenantScopeRequired: true',
  'MAX_TIMEOUT_MS = 120_000',
  'MAX_ATTEMPTS = 3',
  'studio_provider_attempt_budget_exceeded',
  'studio_provider_kill_switch_engaged',
]) {
  assert.ok(model.includes(marker), `provider control missing: ${marker}`);
}

assert.ok(model.includes("mode?: Exclude<StudioProviderMode, 'live'>"), 'source constructor must not create live provider policy');
assert.ok(doc.includes('FOUNDATION COMPLETE / EXECUTION HARD-OFF'));
assert.ok(doc.includes('maxAttemptCents <= maxJobCents <= maxDailyCents'));
assert.ok(doc.includes('There is intentionally no source-only helper'));

console.log('Studio provider cost-control hard-off guard passed');
