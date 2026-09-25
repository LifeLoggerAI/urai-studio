import assert from 'node:assert/strict';
import fs from 'node:fs';

const types = fs.readFileSync(new URL('../lib/studio/types.ts', import.meta.url), 'utf8');
const settings = fs.readFileSync(new URL('../app/studio/settings/page.tsx', import.meta.url), 'utf8');
const policy = fs.readFileSync(new URL('../lib/studio/feature-policy.ts', import.meta.url), 'utf8');

assert.ok(types.includes('@deprecated Read-only compatibility projection'));
for (const token of [
  'readonly callablesEnabled',
  'readonly uploadsEnabled',
  'readonly exportsEnabled',
  'readonly xrPreviewEnabled',
  'readonly demoSeedEnabled',
]) {
  assert.ok(types.includes(token), `legacy feature flag projection missing readonly boundary: ${token}`);
}

assert.ok(settings.includes('server-owned feature policy'));
assert.ok(settings.includes('cannot authorize activation'));
assert.ok(policy.includes('STUDIO_FEATURE_IDS'));
assert.ok(policy.includes('activationAuthorized'));

console.log('Studio feature-policy authority convergence guard passed');
