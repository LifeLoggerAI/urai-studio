import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../../../functions/src/job-runner.ts', import.meta.url), 'utf8');

const requiredTokens = [
  'type JobOutput',
  'fallbackOutput',
  'mode: "fallback"',
  'readyForExternalUse: false',
  'fallbackOnly: true',
  'fallback-clip.txt',
  'fallback-thumbnail.txt',
  'fallback-captions.srt',
  'fallback-package-manifest.json',
  'job_succeeded_fallback',
];

for (const token of requiredTokens) {
  assert.ok(src.includes(token), `missing job-runner fallback token: ${token}`);
}

assert.ok(src.indexOf('fallbackOutput') < src.indexOf('const processJob'), 'fallback helper must be defined before job processing');
assert.ok(src.indexOf('const output = await processJob') < src.indexOf('job_succeeded_fallback'), 'audit marker must be written after output is produced');

console.log('job-runner fallback output coverage passed');
