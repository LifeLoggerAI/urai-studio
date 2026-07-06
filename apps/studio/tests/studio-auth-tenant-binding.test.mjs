import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const authSource = readFileSync(new URL('../lib/studio-auth.ts', import.meta.url), 'utf8');

assert.match(authSource, /import \{ createHash \} from 'node:crypto'/);
assert.match(authSource, /\^\[a-zA-Z0-9_-\]\{1,96\}\$/);
assert.match(authSource, /createHash\('sha256'\)\.update\(normalized\)/);
assert.match(authSource, /const uidTenant = safeTenant\(decoded\.uid, DEFAULT_LOCAL_TENANT\)/);
assert.match(authSource, /const tenantId = safeTenant\(tokenTenant, uidTenant\)/);
assert.match(authSource, /uid: decoded\.uid/);
assert.match(authSource, /const localUid = safeTenant\(header\(req, 'x-urai-user-id'\), DEFAULT_LOCAL_UID\)/);
assert.doesNotMatch(
  authSource,
  /const tenantId = safeTenant\([\s\S]*?requestedTenant[\s\S]*?\);/,
  'verified production auth must not bind tenant scope to a caller-controlled header',
);
assert.doesNotMatch(
  authSource,
  /safeTenant\(tokenTenant, decoded\.uid\)/,
  'raw verified UIDs must not be inserted directly into tenant path segments',
);
assert.match(authSource, /authMode: 'local_fallback'/);

console.log('Studio auth tenant binding regression checks passed');
