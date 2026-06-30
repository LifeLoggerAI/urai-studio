import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../../../functions/src/index.ts', import.meta.url), 'utf8');

for (const moduleName of [
  'bootstrap-owner',
  'create-job',
  'job-runner',
  'on-job-write',
  'approve-publish',
  'user-management',
  'studio-system',
]) {
  assert.ok(index.includes(`export * from "./${moduleName}";`), `functions index must export ${moduleName}`);
}

console.log('functions index export regression passed');
