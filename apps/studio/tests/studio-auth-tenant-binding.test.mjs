import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const authSource = readFileSync(new URL('../lib/studio-auth.ts', import.meta.url), 'utf8');

assert.match(authSource, /const tenantId = safeTenant\(tokenTenant, decoded\.uid\)/);
assert.doesNotMatch(
  authSource,
  /const tenantId = safeTenant\([\s\S]*?requestedTenant[\s\S]*?\);/,
  'verified production auth must not bind tenant scope to a caller-controlled header',
);
assert.match(authSource, /authMode: 'local_fallback'/);

console.log('Studio auth tenant binding regression checks passed');
