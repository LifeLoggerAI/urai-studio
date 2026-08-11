import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('./all.test.mjs', import.meta.url), 'utf8');

for (const token of ['readdirSync', "file.endsWith('.test.mjs')", 'await import', 'all Studio regression tests passed']) {
  assert.ok(src.includes(token), `all.test.mjs must keep auto-discovered test runner token: ${token}`);
}

const forbiddenManualImports = [
  /import\s+['"][^'"]+\.test\.mjs['"]/, 
  /await\s+import\(\s*['"][^'"]+\.test\.mjs['"]\s*\)/,
];

for (const pattern of forbiddenManualImports) {
  assert.equal(pattern.test(src), false, `all.test.mjs must not hard-code individual test imports: ${pattern}`);
}

console.log('all-test runner coverage passed: auto-discovers every .test.mjs file');
