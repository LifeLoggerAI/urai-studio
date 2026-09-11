#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

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

const checkedOutSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (checkedOutSha !== commitSha) {
  throw new Error(`checked_out_sha_mismatch:${checkedOutSha}:${commitSha}`);
}

const requiredWorkflowResults = {
  install: process.env.INSTALL_GATE_RESULT,
  releaseCheck: process.env.RELEASE_CHECK_GATE_RESULT,
  staticSmoke: process.env.STATIC_SMOKE_GATE_RESULT,
  runtimeSmoke: process.env.RUNTIME_SMOKE_GATE_RESULT,
};
for (const [name, result] of Object.entries(requiredWorkflowResults)) {
  if (result !== 'success') {
    throw new Error(`missing_or_failed_workflow_gate:${name}:${result || 'unset'}`);
  }
}

const workflowRunId = process.env.GITHUB_RUN_ID || '';
const workflowRunAttempt = process.env.GITHUB_RUN_ATTEMPT || '';
if (!/^\d+$/.test(workflowRunId) || !/^\d+$/.test(workflowRunAttempt)) {
  throw new Error('GitHub workflow run identity is required for source evidence.');
}
const workflowEvidence = `GitHub Actions run ${workflowRunId}, attempt ${workflowRunAttempt}, reported success for the exact checked-out SHA.`;

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
    lint: gate('pass', `Covered by the successful pnpm release:check workflow step. ${workflowEvidence}`),
    typecheck: gate('pass', `Covered by the successful pnpm release:check workflow step. ${workflowEvidence}`),
    tests: gate('pass', `Covered by the successful pnpm release:check workflow step. ${workflowEvidence}`),
    appBuild: gate('pass', `Covered by the successful pnpm release:check workflow step. ${workflowEvidence}`),
    functionsBuild: gate('pass', `Covered by the successful pnpm release:check workflow step. ${workflowEvidence}`),
    doneDoneGuard: gate('pass', `Covered by the successful pnpm release:check workflow step. ${workflowEvidence}`),
    releaseCheck: gate('pass', `The credential-free source-only release check passed. ${workflowEvidence}`),
    providerReadiness: gate('blocked', 'Strict provider configuration and execution are protected and were not asserted by source CI.'),
    binaryArtifacts: gate('blocked', 'Source CI produced no playable MP4; contract-only output is represented by a non-playable binary-render receipt.'),
    smoke: gate('pass', `Static and runtime HTTP smoke workflow steps passed with EXPECT_READY=false. ${workflowEvidence}`),
  },
  notes: [
    'This receipt proves source and local runtime checks only.',
    'It is not deployment, provider execution, playable-media, staging, or production evidence.',
  ],
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, output, commitSha }, null, 2));
