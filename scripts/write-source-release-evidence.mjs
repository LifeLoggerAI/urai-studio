#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const repository = process.env.GITHUB_REPOSITORY || 'LifeLoggerAI/urai-studio';
const commitSha = process.env.TARGET_SHA || process.env.GITHUB_SHA || '';
const output = process.env.EVIDENCE_OUTPUT || path.join('release-evidence', `studio-source-${commitSha || 'unknown'}.json`);
const recordedAt = new Date().toISOString();

if (repository !== 'LifeLoggerAI/urai-studio') throw new Error(`unexpected_repository:${repository}`);
if (!/^[0-9a-f]{40}$/.test(commitSha)) throw new Error('TARGET_SHA must be the exact 40-character reviewed commit SHA.');

const checkedOutSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (checkedOutSha !== commitSha) throw new Error(`checked_out_sha_mismatch:${checkedOutSha}:${commitSha}`);

const verifiedCommands = [
  ['install', 'pnpm', ['install', '--frozen-lockfile'], undefined],
  ['releaseCheck', 'pnpm', ['release:check'], undefined],
  ['staticSmoke', 'pnpm', ['--filter', 'studio', 'smoke:static'], undefined],
  ['runtimeSmoke', 'bash', ['scripts/smoke.sh'], { HOST: process.env.HOST || 'http://127.0.0.1:3000', EXPECT_READY: process.env.EXPECT_READY || 'false' }],
];

for (const [name, command, args, extraEnv] of verifiedCommands) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, ...(extraEnv || {}) },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`self_verified_gate_failed:${name}:${result.status ?? 'unknown'}`);
}

const workflowRunId = /^\d+$/.test(process.env.GITHUB_RUN_ID || '') ? process.env.GITHUB_RUN_ID : null;
const workflowRunAttempt = /^\d+$/.test(process.env.GITHUB_RUN_ATTEMPT || '') ? process.env.GITHUB_RUN_ATTEMPT : null;
const workflowEvidence = workflowRunId
  ? `Executed inside GitHub Actions run ${workflowRunId}, attempt ${workflowRunAttempt}; gate conclusions come from commands re-executed by this writer on the exact checked-out SHA.`
  : 'Gate conclusions come from commands re-executed by this writer on the exact checked-out SHA; no GitHub Actions provenance is claimed.';

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
    install: gate('pass', `pnpm install --frozen-lockfile completed. ${workflowEvidence}`),
    lint: gate('pass', `Covered by the self-verified pnpm release:check. ${workflowEvidence}`),
    typecheck: gate('pass', `Covered by the self-verified pnpm release:check. ${workflowEvidence}`),
    tests: gate('pass', `Covered by the self-verified pnpm release:check. ${workflowEvidence}`),
    appBuild: gate('pass', `Covered by the self-verified pnpm release:check. ${workflowEvidence}`),
    functionsBuild: gate('pass', `Covered by the self-verified pnpm release:check. ${workflowEvidence}`),
    doneDoneGuard: gate('pass', `Covered by the self-verified pnpm release:check. ${workflowEvidence}`),
    releaseCheck: gate('pass', `The credential-free source-only release check passed under self-verification. ${workflowEvidence}`),
    providerReadiness: gate('blocked', 'Strict provider configuration and execution are protected and were not asserted by source CI.'),
    binaryArtifacts: gate('blocked', 'Source CI produced no playable MP4; contract-only output is represented by a non-playable binary-render receipt.'),
    smoke: gate('pass', `Static and runtime HTTP smoke were re-executed by this writer with EXPECT_READY=false. ${workflowEvidence}`),
  },
  notes: [
    'This receipt proves source and local runtime checks only.',
    'It is not deployment, provider execution, playable-media, staging, or production evidence.',
  ],
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, output, commitSha }, null, 2));
