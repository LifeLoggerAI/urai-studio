import assert from 'node:assert/strict';
import fs from 'node:fs';

const policy = fs.readFileSync(new URL('../lib/studio/feature-policy.ts', import.meta.url), 'utf8');
const provider = fs.readFileSync(new URL('../lib/studio/provider-adapter.ts', import.meta.url), 'utf8');
const evidence = fs.readFileSync(new URL('../lib/studio/evidence.ts', import.meta.url), 'utf8');
const exportPkg = fs.readFileSync(new URL('../lib/studio/export-package.ts', import.meta.url), 'utf8');

for (const id of [
  'provider-execution',
  'asset-factory-execution',
  'product-capture',
  'film-foundry-execution',
  'public-publish',
  'external-delivery',
  'brain-map-private',
  'collaboration-review',
  'future-marketplace',
  'xr-preview',
]) {
  assert.ok(policy.includes(`'${id}'`), `hard-off feature missing: ${id}`);
}
assert.ok(policy.includes("state: requested === 'paused' ? 'paused' : 'disabled'"));
assert.ok(policy.includes('activationAuthorized: false'));
assert.ok(!policy.includes('NEXT_PUBLIC_'), 'server feature policy must not trust public environment variables');

for (const token of [
  'idempotencyKey',
  'maxAttempts',
  'timeoutMs',
  'estimatedSpendCents',
  'spendCeilingCents',
  'trainingUse',
  'retention',
  'humanApprovalState',
  'readyForExternalUse: false',
  'spendAuthorized: false',
  'providerCalled: false',
]) {
  assert.ok(provider.includes(token), `provider contract missing: ${token}`);
}
assert.ok(provider.includes("canExecuteStudioFeature('provider-execution'"), 'provider adapter must bind to hard-off policy');

for (const token of [
  'StudioVersionRecord',
  'StudioReviewRecord',
  'StudioApprovalReceipt',
  'StudioProvenanceRecord',
  'thirdPartyCopyright',
  'humanLikeness',
  'voiceLikeness',
  'familyAdvisorLikeness',
  'minors',
  'providerTrainingPermission',
  'privateMemoryUse',
  'accessibilityReadyForRelease',
]) {
  assert.ok(evidence.includes(token), `evidence contract missing: ${token}`);
}
assert.ok(evidence.includes("'owner', 'admin', 'reviewer'"), 'viewer/editor must not silently become approval roles');
assert.ok(evidence.includes('approvalMatchesVersion'), 'approval must remain bound to exact version/hash');

assert.ok(exportPkg.includes('publicReleaseAuthorized: false'));
assert.ok(exportPkg.includes('delivery: { enabled: false }'));
assert.ok(exportPkg.includes('exportPackageCanDeliver(_pkg: StudioExportPackage): false'));
assert.ok(exportPkg.includes('contentHash'));
assert.ok(exportPkg.includes('mimeType'));
assert.ok(exportPkg.includes('retention'));
assert.ok(exportPkg.includes('localization'));

console.log('Studio hard-off future rails source guard passed');
