import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const adminSource = fs.readFileSync(path.join(repoRoot, 'apps/studio/lib/firebase-admin.ts'), 'utf8');
const rootEnv = fs.readFileSync(path.join(repoRoot, '.env.example'), 'utf8');
const appEnv = fs.readFileSync(path.join(repoRoot, 'apps/studio/.env.example'), 'utf8');

assert.match(adminSource, /credential\.applicationDefault\(\)/);
assert.match(adminSource, /GOOGLE_CLOUD_PROJECT/);
assert.doesNotMatch(adminSource, /credential\.cert\(/);
assert.doesNotMatch(adminSource, /FIREBASE_PRIVATE_KEY/);
assert.doesNotMatch(adminSource, /FIREBASE_CLIENT_EMAIL/);
assert.doesNotMatch(adminSource, /&&\s*process\.env\.GOOGLE_APPLICATION_CREDENTIALS/, 'ambient workload identity must not require a credential-file environment variable');
assert.match(adminSource, /URAI_STUDIO_FIREBASE_ADMIN_ADC_VERIFIED === '1'/, 'Admin readiness must require a separately verified runtime ADC identity');
assert.match(adminSource, /verification-required/, 'an unverified project id must remain unready');

for (const envText of [rootEnv, appEnv]) {
  assert.doesNotMatch(envText, /^FIREBASE_PRIVATE_KEY=/m);
  assert.doesNotMatch(envText, /^FIREBASE_CLIENT_EMAIL=/m);
  assert.match(envText, /^URAI_STUDIO_FIREBASE_ADMIN_ADC_VERIFIED=0$/m);
}

console.log('firebase admin ADC/workload-identity contract passed');
