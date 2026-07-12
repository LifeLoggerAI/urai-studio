import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('./all.test.mjs', import.meta.url), 'utf8');

for (const token of [
  'readdirSync',
  "file.endsWith('.test.mjs')",
  'spawnSync',
  'process.execPath',
  'all Studio regression tests passed',
]) {
  assert.ok(src.includes(token), `all.test.mjs must keep isolated auto-discovered test runner token: ${token}`);
}

const forbiddenManualImports = [
  ...src.matchAll(/^\s*import\s+(?:[^'"\n]+\s+from\s+)?['"]\.\/[^'"]+\.test\.mjs['"];?\s*$/gm),
].map((match) => match[0]);

assert.deepEqual(
  forbiddenManualImports,
  [],
  'all.test.mjs must not manually import individual tests; discovery must remain automatic',
);
assert.equal(src.includes('await import(testUrl.href)'), false, 'tests must run in isolated child processes');

console.log('all-test runner coverage passed: isolated auto-discovery executes every .test.mjs file');
