import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const requiredFiles = [
  '../../../firestore.rules',
  '../../../storage.rules',
  '../lib/studio-auth.ts',
  'storage-rules.test.mjs',
];

for (const relativePath of requiredFiles) {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.ok(existsSync(fileUrl), `${relativePath} should exist`);
}

console.log('security surface presence checks passed');
