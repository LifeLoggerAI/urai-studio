import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('./all.test.mjs', import.meta.url), 'utf8');
const forbiddenManualImports = ['manual regression imports are forbidden'];

for (const token of ['readdirSync', "file.endsWith('.test.mjs')", 'await import', 'all Studio regression tests passed']) {
  assert.ok(src.includes(token), `all.test.mjs must keep auto-discovered test runner token: ${token}`);
}

console.log('all-test runner coverage passed: auto-discovers every .test.mjs file');
