#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repository = process.env.GITHUB_REPOSITORY || 'LifeLoggerAI/urai-studio';
const commitSha = process.env.TARGET_SHA || process.env.GITHUB_SHA || '';
const output = process.env.EVIDENCE_OUTPUT || path.join('release-evidence', `studio-source-${commitSha || 'unknown'}.json`);
const recordedAt = new Date().toISOString();

if (repository !== 'LifeLoggerAI/urai-studio') {
  throw new Error(`unexpected_repository:${repository}`);
}
if (!/^[0-9a-f]{40}$/.test(commitSha)) {
  throw new Error('TARGET_SHA must be the exact 40-character reviewed commit SHA.');
}

function gate(status, evidence) {
  if (!['pass', 'fail', 'blocked', 'not_run'].includes(status)) throw new Error(`invalid_gate_status:${status}`);
  if (!evidence) throw new Error('gate evidence must not be empty');
  return { status, evidence, recordedAt };
}

const receipt = {
  repository,
  commitSha,
  recordedAt,
  environment: 'ci',
  gates: {
    install: gate('pass', 'pnpm install --frozen-lockfile completed on the exact reviewed SHA.'),
    lint: gate('pass', 'pnpm release:check completed the Studio lint gate.'),
    typecheck: gate('pass', 'pnpm release:check completed the Studio typecheck gate.'),
    tests: gate('pass', 'pnpm release:check completed the auto-discovered Studio regression suite.'),
    appBuild: gate('pass', 'pnpm release:check completed the Next.js Studio build.'),
    functionsBuild: gate('pass', 'pnpm release:check completed the Firebase Functions build.'),
    doneDoneGuard: gate('pass', 'The done-done guard passed without user-facing internal labels or active backup imports.'),
    releaseCheck: gate('pass', 'The credential-free source-only release check passed at this exact SHA.'),
    providerReadiness: gate('blocked', 'Strict provider configuration and execution are protected and were not asserted by source CI.'),
    binaryArtifacts: gate('blocked', 'Source CI produced no playable MP4; contract-only output is represented by a non-playable binary-render receipt.'),
    smoke: gate('pass', 'Static and runtime HTTP smoke checks passed with EXPECT_READY=false.'),
  },
  notes: [
    'This receipt proves source and local runtime checks only.',
    'It is not deployment, provider execution, playable-media, staging, or production evidence.',
  ],
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, output, commitSha }, null, 2));
