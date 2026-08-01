import assert from 'node:assert/strict';
import fs from 'node:fs';

const runner = fs.readFileSync(new URL('./all.test.mjs', import.meta.url), 'utf8');
const testFiles = fs
  .readdirSync(new URL('.', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.test.mjs') && entry.name !== 'all.test.mjs')
  .map((entry) => entry.name)
  .sort();

assert.ok(runner.includes('readdirSync'), 'all.test.mjs must discover the test directory');
assert.ok(runner.includes("file.endsWith('.test.mjs')"), 'all.test.mjs must discover test files by suffix');
assert.ok(runner.includes("file !== 'all.test.mjs'"), 'all.test.mjs must exclude only itself');
assert.ok(runner.includes('await import'), 'all.test.mjs must dynamically import each discovered test');

const forbiddenManualImports = testFiles.filter((file) =>
  runner.includes(`./${file}`) || runner.includes(`tests/${file}`) || runner.includes(`'${file}'`) || runner.includes(`"${file}"`),
);
assert.deepEqual(
  forbiddenManualImports,
  [],
  `all.test.mjs must not maintain a manual test list: ${forbiddenManualImports.join(', ')}`,
);

assert.ok(testFiles.length > 0, 'test directory must contain discovered regression tests');

console.log('all-test runner coverage passed: auto-discovers every .test.mjs file');
