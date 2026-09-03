#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

const requiredFiles = [
  'docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json',
  'apps/studio/tests/release-evidence-schema.test.mjs',
  'apps/studio/tests/video-render-artifact-truth.test.mjs',
  'apps/studio/tests/all-runner.test.mjs',
  'apps/studio/tests/legacy-roots.test.mjs',
  'scripts/release-evidence-boundary-guard.mjs',
  'scripts/write-source-release-evidence.mjs',
];

const requiredTokens = new Map([
  ['docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json', ['repository', 'commitSha', 'recordedAt', 'environment', 'gates', 'install', 'lint', 'typecheck', 'tests', 'appBuild', 'functionsBuild', 'doneDoneGuard', 'releaseCheck', 'providerReadiness', 'binaryArtifacts', 'sourceCommitSha', 'smoke']],
  ['apps/studio/tests/release-evidence-schema.test.mjs', ['URAI_STUDIO_RELEASE_EVIDENCE.schema.json', 'requiredGates', 'providerReadiness', 'binaryArtifacts', 'smoke']],
  ['apps/studio/tests/video-render-artifact-truth.test.mjs', ['binary-render-receipt.json', 'playableMp4Written: false', 'video render artifact truth coverage passed']],
  ['apps/studio/tests/all-runner.test.mjs', ['all.test.mjs', "file.endsWith('.test.mjs')", 'await import', 'auto-discovers every .test.mjs file']],
  ['apps/studio/tests/legacy-roots.test.mjs', ['forbiddenWorkspaceRoots', 'apps/*', 'packages/*']],
  ['scripts/release-evidence-boundary-guard.mjs', ['release:check:provider', 'provider:check:strict', 'binaryArtifacts', 'validateArtifactSourceCommits', 'release evidence boundary guard passed']],
  ['scripts/write-source-release-evidence.mjs', ['TARGET_SHA', "environment: 'ci'", 'providerReadiness', 'binaryArtifacts', 'playable MP4']],
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
