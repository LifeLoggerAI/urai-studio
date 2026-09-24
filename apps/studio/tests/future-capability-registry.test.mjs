import assert from 'node:assert/strict';
import fs from 'node:fs';

const registryUrl = new URL('../../../docs/contracts/urai-studio-future-capabilities.v1.json', import.meta.url);
const registry = JSON.parse(fs.readFileSync(registryUrl, 'utf8'));

assert.equal(registry.schemaVersion, '1.0.0');
assert.equal(registry.registryId, 'urai-studio-future-system-control');
assert.match(registry.authoritySnapshot.baseCandidateSha, /^[a-f0-9]{40}$/);

const allowedStatus = new Set(registry.allowedStatus);
const allowedPrelaunchClass = new Set(registry.allowedPrelaunchClass);
const ids = new Set();

assert.ok(Array.isArray(registry.capabilities));
assert.ok(registry.capabilities.length >= 15, 'future registry must retain the recovered major capability families');

for (const capability of registry.capabilities) {
  assert.equal(typeof capability.id, 'string');
  assert.ok(capability.id.length > 0);
  assert.ok(!ids.has(capability.id), `duplicate capability id: ${capability.id}`);
  ids.add(capability.id);

  assert.ok(allowedStatus.has(capability.status), `invalid authority status for ${capability.id}`);
  assert.ok(allowedPrelaunchClass.has(capability.prelaunchClass), `invalid prelaunch class for ${capability.id}`);
  assert.equal(capability.activationAuthorized, false, `${capability.id} must not authorize activation from roadmap metadata`);
  assert.ok(Array.isArray(capability.sourceEvidence) && capability.sourceEvidence.length > 0, `${capability.id} requires source evidence`);
  assert.ok(typeof capability.activationGate === 'string' && capability.activationGate.length > 0, `${capability.id} requires an activation gate`);
  assert.ok(Array.isArray(capability.acceptanceProof) && capability.acceptanceProof.length > 0, `${capability.id} requires acceptance proof`);

  if (capability.prelaunchClass === 'SAFE TO PREBUILD BUT MUST REMAIN HARD-OFF' || capability.prelaunchClass === 'POST-LAUNCH ONLY' || capability.prelaunchClass === 'BLOCKED') {
    assert.equal(capability.hardOff, true, `${capability.id} must remain hard-off for its prelaunch classification`);
  }
}

for (const requiredId of [
  'canonical-data-model-convergence',
  'observed-integration-readiness-profiles',
  'provider-job-export-execution-spine',
  'asset-factory-orchestration-bridge',
  'studio-spatial-handoff-0-1',
  'film-foundry-command-center',
  'live-brain-map-cockpit',
  'rights-provenance-release-evidence',
]) {
  assert.ok(ids.has(requiredId), `missing recovered roadmap capability: ${requiredId}`);
}

const providerSpine = registry.capabilities.find((item) => item.id === 'provider-job-export-execution-spine');
assert.equal(providerSpine.hardOff, true);
assert.equal(providerSpine.prelaunchClass, 'SAFE TO PREBUILD BUT MUST REMAIN HARD-OFF');

const xr = registry.capabilities.find((item) => item.id === 'webxr-ar-vr-creation-handoff');
assert.equal(xr.status, 'DORMANT BUT VALID');
assert.equal(xr.hardOff, true);

const marketplace = registry.capabilities.find((item) => item.id === 'template-marketplace-editor');
assert.equal(marketplace.status, 'PROPOSED / NOT YET CANONICAL');
assert.equal(marketplace.prelaunchClass, 'POST-LAUNCH ONLY');

assert.ok(
  registry.notAdmittedWithoutNewAuthority.includes('Studio-owned generation/provenance that duplicates Asset Factory authority'),
  'registry must preserve the Studio / Asset Factory ownership boundary',
);

console.log('Studio future-capability registry guard passed', registry.capabilities.length);
