import assert from 'node:assert/strict';
import fs from 'node:fs';

const model = fs.readFileSync(new URL('../lib/studio/data-model.ts', import.meta.url), 'utf8');
const contract = fs.readFileSync(new URL('../lib/urai-system-contract.ts', import.meta.url), 'utf8');
const store = fs.readFileSync(new URL('../lib/studio-runtime-store.ts', import.meta.url), 'utf8');
const rules = fs.readFileSync(new URL('../../../firestore.rules', import.meta.url), 'utf8');
const legacyFunctions = fs.readFileSync(new URL('../../../functions/src/studio-system.ts', import.meta.url), 'utf8');
const adr = fs.readFileSync(new URL('../../../docs/architecture/STUDIO_DATA_MODEL_V3.md', import.meta.url), 'utf8');

for (const token of [
  'STUDIO_DATA_MODEL_VERSION = 3',
  'studioProjects',
  'studioBriefs',
  'studioJobs',
  'studioAssets',
  'studioExports',
  'studioReviews',
  'studioVersions',
  'studioEvidence',
  'studioFeaturePolicies',
  'frozen-no-new-writes',
  'liveMigrationAuthorizedBySource: false',
]) {
  assert.ok(model.includes(token), `data model missing token: ${token}`);
}

assert.ok(contract.includes('schemaVersion: StudioDataModelVersion'), 'canonical records must carry the V3 schema version');
assert.ok(store.includes('STUDIO_CANONICAL_COLLECTIONS'), 'runtime store must use the canonical collection registry');
assert.ok(store.includes('schemaVersion: STUDIO_DATA_MODEL_VERSION'), 'runtime store must stamp V3 records');
assert.ok(store.includes('requireCanonicalStudioRecord'), 'runtime reads must reject noncanonical records');
assert.ok(legacyFunctions.includes('URAI_STUDIO_LEGACY_WRITES_ENABLED'), 'legacy callable writes must be hard-gated');
assert.ok(legacyFunctions.includes('legacy_studio_writes_disabled'), 'legacy callable gate must fail closed with an explicit code');

for (const legacy of [
  'studioScenes',
  'assetJobs',
  'assetCollections',
  'studioScrolls',
  'narratorScripts',
  'subtitles',
  'voiceoverJobs',
  'exportJobs',
  'studioEvents',
  'xrSessions',
  'vrSessions',
]) {
  assert.ok(model.includes(`'${legacy}'`), `legacy containment registry missing ${legacy}`);
  assert.ok(rules.includes(`match /${legacy}/{id}`), `Firestore rules must retain explicit containment for ${legacy}`);
}

assert.ok(rules.includes('canonicalV3Record'), 'Firestore rules must recognize V3 canonical records');
assert.ok(rules.includes('legacyStudioRecord'), 'Firestore rules must distinguish legacy uid-owned shapes');
assert.ok(rules.includes('allow create, update, delete: if false;'), 'legacy write freeze must exist in rules');

for (const phrase of [
  'LIVE MIGRATION NOT AUTHORIZED',
  'schemaVersion 3',
  'trusted server only',
  'Legacy containment',
  'Migration sequence',
  'Rollback',
]) {
  assert.ok(adr.includes(phrase), `ADR missing required boundary: ${phrase}`);
}

console.log('Studio V3 data-model convergence guard passed');
