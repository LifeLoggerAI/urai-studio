import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../app/api/studio/exports/route.ts', import.meta.url), 'utf8');

const requiredTokens = [
  'createFallbackStudioSpatialManifest',
  'createExportHandoff',
  'spatialHandoff',
  "defaultStatus: 'fallback_only'",
  "validator: '/api/system/spatial-handoff'",
  'contractExportId',
  'tenantScoped: true',
  'result.data.id',
  'result.data.projectId',
  'result.data.tenantId',
  'result.data.userId',
];

for (const token of requiredTokens) {
  assert.ok(src.includes(token), `missing export handoff token: ${token}`);
}

assert.ok(
  src.indexOf('createExportHandoff') < src.indexOf('return json({\n    ok: true'),
  'export handoff helper must be defined before success response',
);

console.log('export spatial handoff response coverage passed');
