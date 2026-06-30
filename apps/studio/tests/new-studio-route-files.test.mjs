import assert from 'node:assert/strict';
import fs from 'node:fs';

const requiredFiles = [
  '../app/generate/page.tsx',
  '../app/studio/video-factory/page.tsx',
  '../app/api/studio/video-factory/route.ts',
];

for (const file of requiredFiles) {
  assert.ok(fs.existsSync(new URL(file, import.meta.url)), `missing Studio route file: ${file}`);
}

console.log('new Studio route file regression passed', requiredFiles.length);
