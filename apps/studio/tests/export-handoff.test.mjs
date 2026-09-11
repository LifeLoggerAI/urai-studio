import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../app/api/studio/exports/route.ts', import.meta.url), 'utf8');

const requiredTokens = [
  'createBlockedStudioSpatialHandoff',
  'createExportHandoff',
  'spatialHandoff',
  "defaultStatus: 'blocked'",
  "validator: '/api/system/spatial-handoff'",
  'completeEvidenceRequiredForEmission: true',
  'liveIntegrationClaimed: false',
  'contractExportId',
  'tenantScoped: true',
  'exportData.id',
  'exportData.projectId',
  'exportData.tenantId',
  'exportData.userId',
];

for (const token of requiredTokens) {
  assert.ok(src.includes(token), `missing export handoff token: ${token}`);
}

assert.ok(
  src.indexOf('createExportHandoff') < src.indexOf('return json({\n    ok: true'),
  'export handoff helper must be defined before success response',
);

assert.ok(!src.includes('createFallbackStudioSpatialManifest'), 'exports must not fabricate fallback wire manifests');

console.log('fail-closed export spatial handoff response coverage passed');
