import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('./all.test.mjs', import.meta.url), 'utf8');

for (const token of ['readdirSync', "file.endsWith('.test.mjs')", 'await import', 'all Studio regression tests passed']) {
  assert.ok(src.includes(token), `all.test.mjs must keep auto-discovered test runner token: ${token}`);
}

const forbiddenManualImports = [
  ...src.matchAll(/^\s*import\s+(?:[^'"\n]+\s+from\s+)?['"]\.\/[^'"]+\.test\.mjs['"];?\s*$/gm),
].map((match) => match[0]);

assert.deepEqual(
  forbiddenManualImports,
  [],
  'all.test.mjs must not manually import individual tests; discovery must remain automatic',
);

console.log('all-test runner coverage passed: auto-discovers every .test.mjs file');
