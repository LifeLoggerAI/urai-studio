import assert from 'node:assert/strict';
import fs from 'node:fs';

const discoveryPath = new URL('../system/spatial-handoff.discovery.json', import.meta.url);
const discovery = JSON.parse(fs.readFileSync(discoveryPath, 'utf8'));

assert.equal(discovery.service, 'urai-studio');
assert.equal(discovery.consumerSystem, 'urai-spatial');
assert.equal(discovery.route, '/api/system/spatial-handoff');
assert.equal(discovery.exportRoute, '/api/studio/exports');
assert.equal(discovery.requiredExportField, 'spatialHandoff');
assert.equal(discovery.defaultStatus, 'fallback_only');
assert.equal(discovery.defaultRenderer, 'fallback_cards');

for (const helper of [
  'createFallbackStudioSpatialManifest',
  'validateStudioSpatialManifest',
  'listBlockedStudioSpatialClaims',
  'isStudioSpatialManifestReleaseSafe',
]) {
  assert.ok(discovery.guardHelpers.includes(helper), `missing handoff guard helper: ${helper}`);
}

for (const file of discovery.testFiles) {
  assert.ok(fs.existsSync(new URL(`../../../${file}`, import.meta.url)), `missing discovery test target: ${file}`);
}

console.log('spatial handoff discovery coverage passed');
