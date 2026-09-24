import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = new Map([
  ['asset factory', fs.readFileSync(new URL('../lib/studio/asset-factory-orchestration.ts', import.meta.url), 'utf8')],
  ['film foundry', fs.readFileSync(new URL('../lib/studio/film-foundry.ts', import.meta.url), 'utf8')],
  ['brain map', fs.readFileSync(new URL('../lib/studio/brain-map.ts', import.meta.url), 'utf8')],
  ['cut one', fs.readFileSync(new URL('../lib/studio/cut-one.ts', import.meta.url), 'utf8')],
  ['capture', fs.readFileSync(new URL('../lib/studio/product-capture.ts', import.meta.url), 'utf8')],
  ['publishing', fs.readFileSync(new URL('../lib/studio/publishing.ts', import.meta.url), 'utf8')],
]);

assert.ok(files.get('asset factory').includes("'asset-factory-api-v1'"));
assert.ok(files.get('asset factory').includes('providerExecutionAuthorized: false'));
assert.ok(files.get('asset factory').includes('promotionAuthorized: false'));
assert.ok(files.get('asset factory').includes('provenanceReceiptRef'));
assert.ok(files.get('asset factory').includes('promotionState'));
assert.ok(files.get('asset factory').includes("'POST /api/assets'"));
assert.ok(files.get('asset factory').includes("'GET /api/system/health'"));
assert.ok(files.get('asset factory').includes("'x-asset-factory-api-key'"));
assert.ok(files.get('asset factory').includes("tenantIdentitySource: 'verified-auth-claim'"));
assert.ok(files.get('asset factory').includes('asset_factory_identity_must_come_from_verified_auth'));

assert.ok(files.get('film foundry').includes('providerSpendAuthorized: false'));
assert.ok(files.get('film foundry').includes('publicReleaseAuthorized: false'));
for (const token of ['rightsState', 'accessibilityState', 'costState', 'renderState', 'masterState', 'evidenceRefs']) {
  assert.ok(files.get('film foundry').includes(token));
}

for (const forbidden of ['rawMemoriesAllowed: false', 'privateTextAllowed: false', 'healthDataAllowed: false', 'preciseLocationAllowed: false', 'secretsAllowed: false', 'providerCredentialsAllowed: false']) {
  assert.ok(files.get('brain map').includes(forbidden));
}
assert.ok(files.get('brain map').includes('accessibleListEquivalentRequired: true'));
assert.ok(files.get('brain map').includes('activationAuthorized: false'));
assert.ok(files.get('brain map').includes('evidenceRefs: string[]'));
assert.ok(files.get('brain map').includes('brain_map_exact_sha_required'));
assert.ok(files.get('brain map').includes('brain_map_evidence_receipt_required'));
assert.ok(files.get('brain map').includes('brain_map_live_receipt_required'));
assert.ok(files.get('brain map').includes('brain_map_review_receipt_required'));

assert.ok(files.get('cut one').includes('providerExecutionAuthorized: false'));
assert.ok(files.get('cut one').includes('publicReleaseAuthorized: false'));
assert.ok(files.get('cut one').includes('sourceAuthorityRefs'));

for (const surface of ['home', 'orb', 'ground', 'life-map', 'memory-star', 'focus', 'replay', 'mirror', 'shadow', 'legacy', 'council', 'passport']) {
  assert.ok(files.get('capture').includes(`'${surface}'`));
}
assert.ok(files.get('capture').includes('exactSha'));
assert.ok(files.get('capture').includes('artifactHash'));
assert.ok(files.get('capture').includes('acceptedForReuse: false'));

assert.ok(files.get('publishing').includes('publicReleaseAuthorized: false'));
assert.ok(files.get('publishing').includes('deliveryEnabled: false'));
assert.ok(files.get('publishing').includes('canPublishStudioContract(_contract: StudioPublicationContract): false'));

console.log('Studio dormant control-plane contracts guard passed');
