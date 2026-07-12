import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const testDir = new URL('.', import.meta.url);

const testFiles = fs
  .readdirSync(testDir)
  .filter((file) => file.endsWith('.test.mjs'))
  .sort();

let executed = 0;
for (const file of testFiles) {
  const testUrl = new URL(file, testDir);
  const testPath = fileURLToPath(testUrl);
  if (testPath === currentFile) continue;

  const result = spawnSync(process.execPath, [testPath], {
    cwd: fileURLToPath(testDir),
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${file} failed with exit status ${result.status ?? 'unknown'}`);
  }
  executed += 1;
}

console.log('all Studio regression tests passed', executed);
