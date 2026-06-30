import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../lib/studio-runtime-store.ts', import.meta.url), 'utf8');

for (const token of [
  'studioProjects',
  'studioBriefs',
  'studioJobs',
  'studioAssets',
  'studioExports',
  'tenantScoped: true',
  'createStudioProject',
  'createStudioBrief',
  'createStudioJob',
  'createStudioExport',
  'listTenantJobs',
]) {
  assert.ok(src.includes(token), `runtime store must include ${token}`);
}

assert.ok(src.includes('provider: "feature-gated"'), 'runtime jobs must remain provider feature-gated until a real provider is wired');
assert.ok(src.includes('model: "contract-only"'), 'runtime jobs must remain contract-only until a real model is wired');
assert.ok(src.includes('downloadUrl: undefined'), 'exports must not fake download URLs');
assert.ok(src.includes('.where("tenantId", "==", tenantId)'), 'tenant job listing must query tenantId');

console.log('studio runtime store contract regression passed');
