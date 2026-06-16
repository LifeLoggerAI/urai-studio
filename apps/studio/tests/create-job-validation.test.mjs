import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../../../functions/src/create-job.ts', import.meta.url), 'utf8');

const requiredTokens = [
  'type CreateJobPayload',
  'type JobKind',
  'const allowedKinds',
  'isRecord',
  'readString',
  'readRecord',
  'normalizePriority',
  'normalizeCreateJobPayload',
  'const payload = normalizeCreateJobPayload(data);',
  'clip_render',
  'thumbnail',
  'captions',
  'package_export',
  'publish',
];

for (const token of requiredTokens) {
  assert.ok(src.includes(token), `missing create-job validation token: ${token}`);
}

assert.ok(!src.includes('TODO'), 'create-job must not retain validation TODO markers');
assert.ok(src.indexOf('normalizeCreateJobPayload') < src.indexOf('batch.set(jobRef'), 'job payload must be normalized before it is stored');

console.log('create-job validation coverage passed');
