#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

const requiredFiles = [
  'docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json',
  'apps/studio/tests/release-evidence-schema.test.mjs',
  'apps/studio/tests/all-runner.test.mjs',
  'apps/studio/tests/legacy-roots.test.mjs',
];

const requiredTokens = new Map([
  ['docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json', ['repo', 'commitSha', 'recordedAt', 'environment', 'gates', 'install', 'lint', 'typecheck', 'tests', 'appBuild', 'functionsBuild', 'doneDoneGuard', 'releaseCheck', 'smoke']],
  ['apps/studio/tests/release-evidence-schema.test.mjs', ['URAI_STUDIO_RELEASE_EVIDENCE.schema.json', 'requiredGates', 'install', 'smoke']],
  ['apps/studio/tests/all-runner.test.mjs', ['auto-discovers every .test.mjs file', 'forbiddenManualImports', 'await import']],
  ['apps/studio/tests/legacy-roots.test.mjs', ['forbiddenWorkspaceRoots', 'apps/*', 'packages/*']],
]);

let failed = false;

for (const file of requiredFiles) {
  const full = path.join(root, file);
  if (!existsSync(full)) {
    console.error(`evidence schema guard failed: missing ${file}`);
    failed = true;
    continue;
  }

  const src = readFileSync(full, 'utf8');
  for (const token of requiredTokens.get(file) ?? []) {
    if (!src.includes(token)) {
      console.error(`evidence schema guard failed: ${file} missing ${token}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('evidence schema guard passed');
