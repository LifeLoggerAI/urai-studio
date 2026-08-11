import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');

const adminSource = fs.readFileSync(
  path.join(repoRoot, 'apps/studio/lib/firebase-admin.ts'),
  'utf8',
);
const rootEnv = fs.readFileSync(path.join(repoRoot, '.env.example'), 'utf8');
const appEnv = fs.readFileSync(
  path.join(repoRoot, 'apps/studio/.env.example'),
  'utf8',
);

assert.match(adminSource, /credential\.applicationDefault\(\)/);
assert.match(adminSource, /GOOGLE_APPLICATION_CREDENTIALS/);
assert.doesNotMatch(adminSource, /credential\.cert\(/);
assert.doesNotMatch(adminSource, /FIREBASE_PRIVATE_KEY/);
assert.doesNotMatch(adminSource, /FIREBASE_CLIENT_EMAIL/);

for (const envText of [rootEnv, appEnv]) {
  assert.doesNotMatch(envText, /^FIREBASE_PRIVATE_KEY=/m);
  assert.doesNotMatch(envText, /^FIREBASE_CLIENT_EMAIL=/m);
  assert.match(envText, /^GOOGLE_APPLICATION_CREDENTIALS=/m);
}

console.log('firebase admin auth contract passed');
