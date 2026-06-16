import fs from 'node:fs';

const currentFile = new URL(import.meta.url).pathname;
const testDir = new URL('.', import.meta.url);

const testFiles = fs
  .readdirSync(testDir)
  .filter((file) => file.endsWith('.test.mjs'))
  .sort();

for (const file of testFiles) {
  const testUrl = new URL(file, testDir);
  if (testUrl.pathname === currentFile) continue;
  await import(testUrl.href);
}

console.log('all Studio regression tests passed', testFiles.length - 1);
