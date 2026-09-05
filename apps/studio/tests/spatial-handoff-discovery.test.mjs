import assert from 'node:assert/strict';
import fs from 'node:fs';

const discoveryPath = new URL('../system/spatial-handoff.discovery.json', import.meta.url);
const discovery = JSON.parse(fs.readFileSync(discoveryPath, 'utf8'));

assert.equal(discovery.service, 'urai-studio');
assert.equal(discovery.consumerSystem, 'urai-spatial');
assert.equal(discovery.route, '/api/system/spatial-handoff');
assert.equal(discovery.exportRoute, '/api/studio/exports');
assert.equal(discovery.requiredExportField, 'spatialHandoff');
assert.equal(discovery.contractVersion, '0.1.0');
assert.equal(discovery.wireContract, 'urai-spatial/0.1.0');
assert.equal(discovery.defaultStatus, 'blocked');
assert.equal(discovery.defaultRenderer, 'fallback_cards');
assert.equal(discovery.liveIntegrationClaimed, false);
assert.equal(discovery.modelAssetContract.kind, 'mesh');
assert.equal(discovery.modelAssetContract.glbMimeType, 'model/gltf-binary');
assert.equal(discovery.modelAssetContract.gltfMimeType, 'model/gltf+json');

for (const helper of [
  'emitStudioSpatialExport',
  'createBlockedStudioSpatialHandoff',
  'validateStudioSpatialExport',
  'validateStudioSpatialManifest',
  'listBlockedStudioSpatialClaims',
  'isStudioSpatialManifestReleaseSafe',
]) {
  assert.ok(discovery.guardHelpers.includes(helper), `missing handoff guard helper: ${helper}`);
}

for (const field of [
  'contractVersion',
  'producer',
  'consumer',
  'runtimeTargets',
  'sceneManifest',
  'assetManifest',
  'consentReceipt',
  'safetyBoundaries',
  'releaseEvidence',
]) {
  assert.ok(discovery.requiredWireFields.includes(field), `missing required wire field: ${field}`);
}

for (const file of discovery.testFiles) {
  assert.ok(fs.existsSync(new URL(`../../../${file}`, import.meta.url)), `missing discovery test target: ${file}`);
}

console.log('spatial handoff discovery coverage passed');
